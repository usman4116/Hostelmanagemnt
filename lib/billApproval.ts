export const BILL_APPROVAL_DUE_DAYS = 5;

export const UNAPPROVED_BILL_STATUSES = ["Pending Approval", "Draft"] as const;

export type UnapprovedBillStatus = (typeof UNAPPROVED_BILL_STATUSES)[number];

const unapprovedStatusSet = new Set<string>(
  UNAPPROVED_BILL_STATUSES.map((status) => status.toLowerCase()),
);

function normalized(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

/** A bill an admin has generated but not yet released to the resident. */
export function isUnapprovedBill(status: unknown) {
  return unapprovedStatusSet.has(normalized(status));
}

export function billingMonthOf(date = new Date()) {
  return date.toISOString().slice(0, 10).slice(0, 7);
}

export function isBillingMonth(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function monthStartDate(billingMonth: string) {
  return `${billingMonth.slice(0, 7)}-01`;
}

/** Bulk-generated bills fall due exactly BILL_APPROVAL_DUE_DAYS after generation. */
export function dueDateFromGeneration(
  generatedAt = new Date(),
  days = BILL_APPROVAL_DUE_DAYS,
) {
  const due = new Date(generatedAt.getTime());
  due.setUTCDate(due.getUTCDate() + days);
  return due.toISOString().slice(0, 10);
}

export function billingMonthLabel(value: string) {
  const parsed = new Date(`${monthStartDate(value)}T00:00:00Z`);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("en-PK", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
}
