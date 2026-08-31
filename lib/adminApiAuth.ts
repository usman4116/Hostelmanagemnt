import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type AuthorizedStaff = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
};

type StaffAuthResult =
  | { staff: AuthorizedStaff; response: null }
  | { staff: null; response: NextResponse };

function bearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") ?? "";
  return header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";
}

function normalized(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export function apiError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}

export function apiJson(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

/**
 * Verifies the caller's Supabase access token and confirms it belongs to an
 * active staff account holding one of `allowedRoles`. Returns the staff record
 * or a ready-to-return error response.
 */
export async function requireStaff(
  request: NextRequest,
  allowedRoles: string[],
): Promise<StaffAuthResult> {
  const token = bearerToken(request);
  if (!token) {
    return { staff: null, response: apiError("Your admin session could not be verified.", 401) };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return { staff: null, response: apiError("The server Supabase configuration is incomplete.", 500) };
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  const email = authData.user?.email?.trim().toLowerCase() ?? "";
  if (authError || !email) {
    return { staff: null, response: apiError("Your admin session could not be verified.", 401) };
  }

  const { data: staffRows, error: staffError } = await supabaseAdmin
    .from("staff_users")
    .select("id, email, full_name, role, status")
    .ilike("email", email);

  if (staffError) {
    return { staff: null, response: apiError("Your admin permissions could not be verified.", 500) };
  }

  const matches = (staffRows ?? []).filter((row) => normalized(row.email) === email);
  const staff = matches.length === 1 ? matches[0] : null;
  const allowed = new Set(allowedRoles.map((role) => role.toLowerCase()));

  if (
    !staff ||
    normalized(staff.status) !== "active" ||
    !allowed.has(normalized(staff.role))
  ) {
    return {
      staff: null,
      response: apiError("You do not have permission to perform this action.", 403),
    };
  }

  return {
    staff: {
      id: String(staff.id),
      email,
      full_name: staff.full_name == null ? null : String(staff.full_name),
      role: String(staff.role),
    },
    response: null,
  };
}

export const BILLING_STAFF_ROLES = [
  "super admin",
  "admin",
  "manager",
  "accountant",
];
