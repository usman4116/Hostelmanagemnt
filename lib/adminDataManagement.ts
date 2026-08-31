import "server-only";

import { createClient, type User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type VerifiedDataAdmin = {
  authUser: User;
  email: string;
  staffId: string;
};

function bearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") ?? "";
  return header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";
}

export async function verifyDataAdmin(request: NextRequest): Promise<
  | { admin: VerifiedDataAdmin; error?: never; status?: never }
  | { admin?: never; error: string; status: number }
> {
  const token = bearerToken(request);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !supabaseUrl || !anonKey) {
    return { error: "Your administrator session could not be verified.", status: 401 };
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await authClient.auth.getUser(token);
  const email = data.user?.email?.trim().toLowerCase() ?? "";
  if (error || !data.user || !email) {
    return { error: "Your administrator session could not be verified.", status: 401 };
  }

  const { data: staff, error: staffError } = await supabaseAdmin
    .from("staff_users")
    .select("id, role, status")
    .ilike("email", email)
    .maybeSingle();
  const role = String(staff?.role ?? "").trim().toLowerCase();
  const status = String(staff?.status ?? "").trim().toLowerCase();
  if (staffError || !staff || status !== "active" || !["admin", "super admin"].includes(role)) {
    return { error: "Only active administrators can manage hostel data.", status: 403 };
  }

  return { admin: { authUser: data.user, email, staffId: String(staff.id) } };
}
