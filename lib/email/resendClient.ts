import "server-only";

import { Resend } from "resend";

export type EmailDispatchStatus =
  | "sent"
  | "skipped"
  | "configuration_required"
  | "failed";

export type EmailDispatchResult = {
  status: EmailDispatchStatus;
  providerMessageId: string | null;
  error: string | null;
};

export type EmailRequest = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Stable key so a retried approval never double-sends the same bill email. */
  idempotencyKey?: string;
};

function text(value: unknown) {
  return String(value ?? "").trim();
}

let cachedClient: Resend | null = null;

function resendClient(apiKey: string) {
  if (!cachedClient) cachedClient = new Resend(apiKey);
  return cachedClient;
}

export function emailSenderConfigured() {
  return Boolean(
    text(process.env.RESEND_API_KEY) && text(process.env.NOTIFICATION_EMAIL_FROM),
  );
}

export function emailFromAddress() {
  const fromAddress = text(process.env.NOTIFICATION_EMAIL_FROM);
  const fromName = text(process.env.NOTIFICATION_EMAIL_FROM_NAME) || "StayHub";
  return fromAddress ? `${fromName} <${fromAddress}>` : "";
}

/** Sends one transactional email through the Resend SDK. Never throws. */
export async function sendTransactionalEmail(
  request: EmailRequest,
): Promise<EmailDispatchResult> {
  const recipient = text(request.to).toLowerCase();
  if (!recipient) {
    return { status: "skipped", providerMessageId: null, error: "recipient_email_missing" };
  }

  const apiKey = text(process.env.RESEND_API_KEY);
  const from = emailFromAddress();
  if (!apiKey || !from) {
    return {
      status: "configuration_required",
      providerMessageId: null,
      error: "resend_configuration_missing",
    };
  }

  try {
    const { data, error } = await resendClient(apiKey).emails.send(
      {
        from,
        to: [recipient],
        subject: request.subject,
        html: request.html,
        text: request.text,
      },
      request.idempotencyKey ? { idempotencyKey: request.idempotencyKey } : undefined,
    );

    if (error) {
      console.warn("[email] Resend rejected the message.", {
        name: error.name,
        message: error.message,
      });
      return {
        status: "failed",
        providerMessageId: null,
        error: text(error.message) || "resend_send_failed",
      };
    }

    return { status: "sent", providerMessageId: text(data?.id) || null, error: null };
  } catch (caught) {
    const message =
      caught instanceof Error && caught.message.trim()
        ? caught.message
        : "resend_send_failed";
    console.warn("[email] Resend request failed.", { message });
    return { status: "failed", providerMessageId: null, error: message };
  }
}
