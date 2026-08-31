export const notificationEventTypes = [
  "admission_created",
  "bill_generated",
  "receipt_submitted",
  "payment_verified",
  "payment_rejected",
  "contract_approved",
  "resident_notice_created",
  "resident_login_details_sent",
] as const;

export type NotificationEventType = (typeof notificationEventTypes)[number];

export const notificationChannels = ["email", "whatsapp", "sms"] as const;
export type NotificationChannel = (typeof notificationChannels)[number];

export type NotificationRequestOptions = {
  channels?: NotificationChannel[];
  recipientIds?: string[];
};

export type NotificationRequestResult = {
  delivered: boolean;
  configurationRequired: boolean;
  warning: boolean;
  recipientCount?: number;
  deliveredCount?: number;
};

export function isNotificationEventType(value: unknown): value is NotificationEventType {
  return notificationEventTypes.includes(value as NotificationEventType);
}

export function isNotificationChannel(value: unknown): value is NotificationChannel {
  return notificationChannels.includes(value as NotificationChannel);
}
