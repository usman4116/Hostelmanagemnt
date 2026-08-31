import { supabase } from "@/lib/supabase";
import type { NotificationEventType, NotificationRequestOptions, NotificationRequestResult } from "@/lib/notifications/types";

const failedResult: NotificationRequestResult = {
  delivered: false,
  configurationRequired: false,
  warning: true,
};

export async function requestEventNotification(
  eventType: NotificationEventType,
  entityId: string,
  options: NotificationRequestOptions = {},
): Promise<NotificationRequestResult> {
  try {
    let { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) {
      const refreshed = await supabase.auth.refreshSession();
      data = refreshed.data;
    }
    const accessToken = data.session?.access_token;
    if (!accessToken) return failedResult;

    const response = await fetch("/api/notifications/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ eventType, entityId, ...options }),
    });
    if (!response.ok) return failedResult;

    const payload = (await response.json().catch(() => null)) as Partial<NotificationRequestResult> | null;
    return {
      delivered: payload?.delivered === true,
      configurationRequired: payload?.configurationRequired === true,
      warning: payload?.warning === true,
      recipientCount: typeof payload?.recipientCount === "number" ? payload.recipientCount : undefined,
      deliveredCount: typeof payload?.deliveredCount === "number" ? payload.deliveredCount : undefined,
    };
  } catch {
    return failedResult;
  }
}

export function notificationWarning(result: NotificationRequestResult) {
  return result.warning
    ? " The record was saved, but its notification could not be delivered."
    : "";
}
