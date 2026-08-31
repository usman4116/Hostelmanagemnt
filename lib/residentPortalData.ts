import { supabase } from "@/lib/supabase";
import type { AuthenticatedResident } from "@/lib/residentPortalAuth";

export type ResidentPortalRow = Record<string, unknown>;

export type ResidentPortalData = {
  resident: AuthenticatedResident & ResidentPortalRow;
  admission: ResidentPortalRow | null;
  contract: ResidentPortalRow | null;
  room: ResidentPortalRow | null;
  bed: ResidentPortalRow | null;
  bills: ResidentPortalRow[];
  payments: ResidentPortalRow[];
  receipts: ResidentPortalRow[];
};

type ResidentPortalResponse =
  | { data: ResidentPortalData }
  | { error: string };

async function getAccessToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) return session.access_token;

  const {
    data: { session: refreshedSession },
  } = await supabase.auth.refreshSession();

  return refreshedSession?.access_token ?? null;
}

export async function loadResidentPortalData() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return {
      data: null,
      error: "Please sign in to access the resident portal.",
    };
  }

  try {
    const response = await fetch("/api/resident-portal/data", {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as
      | ResidentPortalResponse
      | null;

    if (!response.ok || !payload || !("data" in payload)) {
      return {
        data: null,
        error:
          payload && "error" in payload
            ? payload.error
            : "Your resident portal data could not be loaded.",
      };
    }

    return { data: payload.data, error: null };
  } catch {
    return {
      data: null,
      error: "Your resident portal data could not be loaded. Please try again.",
    };
  }
}
