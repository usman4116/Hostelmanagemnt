export type ResidentPortalSession = {
  linkId: string;
  residentId: string;
  portalEmail: string;
};

const STORAGE_KEY = "resident_portal_session";

export function saveResidentPortalSession(
  session: ResidentPortalSession
) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(session)
  );
}

export function getResidentPortalSession():
  | ResidentPortalSession
  | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw) as ResidentPortalSession;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearResidentPortalSession() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(STORAGE_KEY);
}