import { supabase } from "@/lib/supabase";

export type ResidentLoginResult = {
  created: boolean;
  email: string;
  temporaryPassword: string | null;
};

export type ResidentPasswordResetResult = {
  email: string;
  temporaryPassword: string;
};

async function getValidAccessToken() {
  const {
    data: { session: existingSession },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (!sessionError && existingSession?.access_token) {
    return existingSession.access_token;
  }

  const {
    data: { session: refreshedSession },
    error: refreshError,
  } = await supabase.auth.refreshSession();

  if (refreshError || !refreshedSession?.access_token) {
    return null;
  }

  return refreshedSession.access_token;
}

async function postResidentAction<T>(
  endpoint: string,
  residentId: string,
): Promise<T> {
  const cleanResidentId = residentId.trim();

  if (!cleanResidentId) {
    throw new Error("A valid resident is required.");
  }

  const accessToken = await getValidAccessToken();

  if (!accessToken) {
    throw new Error(
      "Your admin session could not be verified. Please log out and sign in again.",
    );
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ residentId: cleanResidentId }),
  });

  const responseText = await response.text();
  const payload = (() => {
    try {
      return responseText ? JSON.parse(responseText) : null;
    } catch {
      return null;
    }
  })() as
    | (T & { error?: string })
    | null;

  if (!response.ok || !payload) {
    throw new Error(
      payload?.error ||
        `The resident portal account request failed with HTTP ${response.status}. Check the server log for details.`,
    );
  }

  return payload;
}

export async function ensureResidentLogin(
  residentId: string,
): Promise<ResidentLoginResult> {
  const payload = await postResidentAction<ResidentLoginResult>(
    "/api/residents/create-login",
    residentId,
  );

  if (!payload.email) {
    throw new Error(
      "The portal login request completed without valid account details.",
    );
  }

  return {
    created: Boolean(payload.created),
    email: payload.email,
    temporaryPassword:
      typeof payload.temporaryPassword === "string"
        ? payload.temporaryPassword
        : null,
  };
}

export async function resetResidentPassword(
  residentId: string,
): Promise<ResidentPasswordResetResult> {
  const payload = await postResidentAction<ResidentPasswordResetResult>(
    "/api/residents/create-login/reset-password",
    residentId,
  );

  if (!payload.email || !payload.temporaryPassword) {
    throw new Error(
      "The password reset completed without valid temporary credentials.",
    );
  }

  return {
    email: payload.email,
    temporaryPassword: payload.temporaryPassword,
  };
}
