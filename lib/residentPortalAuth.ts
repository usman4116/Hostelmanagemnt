import { supabase } from "@/lib/supabase";

export type AuthenticatedResident = {
  id: string;
  email: string | null;
  full_name: string | null;
  status: string | null;
};

export async function resolveAuthenticatedResident() {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user?.email) {
    return {
      resident: null,
      error: "Please sign in to access the resident portal.",
    };
  }

  const { data: resident, error: residentError } = await supabase
    .from("residents")
    .select("id, email, full_name, status")
    .ilike("email", authData.user.email.trim().toLowerCase())
    .maybeSingle();

  if (residentError) {
    return {
      resident: null,
      error: "Your resident profile could not be verified. Please try again.",
    };
  }

  if (!resident) {
    return {
      resident: null,
      error: "No active resident profile is linked to this account.",
    };
  }

  if (resident.status?.trim().toLowerCase() === "archived") {
    return {
      resident: null,
      error: "No active resident profile is linked to this account.",
    };
  }

  return {
    resident: resident as AuthenticatedResident,
    error: null,
  };
}
