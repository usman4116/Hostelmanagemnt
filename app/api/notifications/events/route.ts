import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyResidentEvent } from "@/lib/notifications/server";
import { isNotificationChannel, isNotificationEventType } from "@/lib/notifications/types";

const STAFF_EVENT_ROLES: Record<string, Set<string>> = {
  admission_created: new Set(["super admin", "admin", "manager", "reception"]),
  bill_generated: new Set(["super admin", "admin", "accountant"]),
  contract_approved: new Set(["super admin", "admin", "manager", "reception"]),
  resident_notice_created: new Set(["super admin", "admin", "manager", "reception"]),
  resident_login_details_sent: new Set(["super admin", "admin", "manager", "reception"]),
};

function bearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") ?? "";
  return header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";
}

function json(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function GET(request: NextRequest) {
  try {
    const token = bearerToken(request);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!token || !supabaseUrl || !anonKey) return json({ error: "Your session could not be verified." }, 401);
    const authClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    const email = authData.user?.email?.trim().toLowerCase() ?? "";
    if (authError || !email) return json({ error: "Your session could not be verified." }, 401);
    const { data: staff } = await supabaseAdmin.from("staff_users").select("status").ilike("email", email).maybeSingle();
    if (!staff || String(staff.status).toLowerCase() !== "active") return json({ error: "You do not have permission to view notification logs." }, 403);
    const { data, error } = await supabaseAdmin
      .from("notification_deliveries")
      .select("id,event_type,entity_id,resident_id,requested_channels,email_status,whatsapp_status,sms_status,email_provider_message_id,whatsapp_provider_message_id,sms_provider_message_id,status,attempt_count,last_error_code,created_at,updated_at,completed_at,residents(full_name,email)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return json({ error: "Notification logs could not be loaded." }, 500);
    return json({ logs: data ?? [] });
  } catch {
    return json({ error: "Notification logs could not be loaded." }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = bearerToken(request);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!token || !supabaseUrl || !anonKey) {
      return json({ error: "Your session could not be verified." }, 401);
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } =
      await authClient.auth.getUser(token);
    const email = authData.user?.email?.trim().toLowerCase() ?? "";
    if (authError || !email) {
      return json({ error: "Your session could not be verified." }, 401);
    }

    const body = (await request.json().catch(() => null)) as
      | { eventType?: unknown; entityId?: unknown; channels?: unknown; recipientIds?: unknown }
      | null;
    const entityId =
      typeof body?.entityId === "string" ? body.entityId.trim() : "";
    if (!isNotificationEventType(body?.eventType) || !entityId) {
      return json({ error: "A valid notification event is required." }, 400);
    }
    const eventType = body.eventType;
    const channels = Array.isArray(body?.channels)
      ? [...new Set(body.channels.filter(isNotificationChannel))]
      : undefined;
    const recipientIds = Array.isArray(body?.recipientIds)
      ? [...new Set(body.recipientIds.filter((value): value is string => typeof value === "string" && Boolean(value.trim())).map((value) => value.trim()))]
      : undefined;
    if (Array.isArray(body?.channels) && (!channels?.length || channels.length !== body.channels.length)) {
      return json({ error: "One or more communication channels are invalid." }, 400);
    }
    if ((recipientIds?.length ?? 0) > 1000) {
      return json({ error: "Too many notification recipients were requested." }, 400);
    }

    const allowedRoles = STAFF_EVENT_ROLES[eventType];
    if (allowedRoles) {
      const { data: staff } = await supabaseAdmin
        .from("staff_users")
        .select("role, status")
        .ilike("email", email)
        .maybeSingle();
      if (
        !staff ||
        String(staff.status).toLowerCase() !== "active" ||
        !allowedRoles.has(String(staff.role).toLowerCase())
      ) {
        return json(
          { error: "You do not have permission to request this notification." },
          403,
        );
      }
    } else if (eventType === "receipt_submitted") {
      const [{ data: resident }, { data: receipt }] = await Promise.all([
        supabaseAdmin
          .from("residents")
          .select("id, status")
          .ilike("email", email)
          .maybeSingle(),
        supabaseAdmin
          .from("payment_receipts")
          .select("resident_id")
          .eq("id", entityId)
          .maybeSingle(),
      ]);
      if (
        !resident ||
        !receipt ||
        resident.id !== receipt.resident_id ||
        String(resident.status).toLowerCase() === "archived"
      ) {
        return json(
          { error: "You do not have permission to request this notification." },
          403,
        );
      }
    } else {
      return json(
        { error: "This event can only be sent by its server-side verification workflow." },
        403,
      );
    }

    return json(await notifyResidentEvent(eventType, entityId, { channels, recipientIds }));
  } catch {
    return json({
      delivered: false,
      configurationRequired: false,
      warning: true,
    });
  }
}
