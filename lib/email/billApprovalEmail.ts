import { billingMonthLabel } from "@/lib/billApproval";

export type BillEmailDetails = {
  residentName: string;
  billNumber: string;
  billingMonth: string;
  dueDate: string;
  rentAmount: number;
  electricityAmount: number;
  acAmount: number;
  otherAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  portalUrl: string;
  hostelName: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function money(value: number) {
  const amount = Number.isFinite(value) ? value : 0;
  return `PKR ${amount.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

function longDate(value: string) {
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("en-PK", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
}

function chargeRow(label: string, value: number, negative = false) {
  if (!value) return "";
  return `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#475569;font-size:14px">${escapeHtml(label)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;text-align:right">${negative ? "- " : ""}${money(value)}</td>
      </tr>`;
}

/** Builds the resident-facing bill email for an approved bill. */
export function buildBillApprovalEmail(details: BillEmailDetails) {
  const monthLabel = billingMonthLabel(details.billingMonth);
  const dueLabel = longDate(details.dueDate);
  const subject = `${details.hostelName} bill for ${monthLabel} — due ${details.dueDate}`;

  const text = [
    `Hello ${details.residentName},`,
    "",
    `Your ${monthLabel} bill (${details.billNumber}) has been approved and is now available in the Resident Portal.`,
    "",
    `Monthly rent: ${money(details.rentAmount)}`,
    details.electricityAmount ? `Electricity: ${money(details.electricityAmount)}` : "",
    details.acAmount ? `AC charges: ${money(details.acAmount)}` : "",
    details.otherAmount ? `Other charges: ${money(details.otherAmount)}` : "",
    details.discountAmount ? `Discount: - ${money(details.discountAmount)}` : "",
    `Total payable: ${money(details.totalAmount)}`,
    details.paidAmount ? `Already paid: ${money(details.paidAmount)}` : "",
    `Balance due: ${money(details.balanceAmount)}`,
    `Due date: ${dueLabel}`,
    "",
    `Pay or download your receipt in the Resident Portal: ${details.portalUrl}`,
    "",
    details.hostelName,
  ]
    .filter((line) => line !== "")
    .join("\n");

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
      <tr>
        <td style="padding:24px 28px;background:#4338ca;color:#ffffff">
          <p style="margin:0;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.85">${escapeHtml(details.hostelName)}</p>
          <h1 style="margin:6px 0 0;font-size:22px;font-weight:700">Bill for ${escapeHtml(monthLabel)}</h1>
          <p style="margin:6px 0 0;font-size:14px;opacity:0.9">Bill ${escapeHtml(details.billNumber)}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:28px">
          <p style="margin:0 0 16px;font-size:15px">Hello ${escapeHtml(details.residentName)},</p>
          <p style="margin:0 0 22px;font-size:14px;color:#475569;line-height:1.6">
            Your bill for <strong>${escapeHtml(monthLabel)}</strong> has been approved and is now available in the
            Resident Portal. Please settle it on or before the due date below.
          </p>

          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
            ${chargeRow("Monthly rent", details.rentAmount)}
            ${chargeRow("Electricity", details.electricityAmount)}
            ${chargeRow("AC charges", details.acAmount)}
            ${chargeRow("Other charges", details.otherAmount)}
            ${chargeRow("Discount", details.discountAmount, true)}
            <tr>
              <td style="padding:14px 0 0;font-size:15px;font-weight:700">Total payable</td>
              <td style="padding:14px 0 0;font-size:15px;font-weight:700;text-align:right">${money(details.totalAmount)}</td>
            </tr>
            ${
              details.paidAmount
                ? `<tr>
              <td style="padding:6px 0;font-size:14px;color:#475569">Already paid</td>
              <td style="padding:6px 0;font-size:14px;color:#047857;text-align:right">${money(details.paidAmount)}</td>
            </tr>`
                : ""
            }
            <tr>
              <td style="padding:6px 0;font-size:15px;font-weight:700">Balance due</td>
              <td style="padding:6px 0;font-size:15px;font-weight:700;color:#b91c1c;text-align:right">${money(details.balanceAmount)}</td>
            </tr>
          </table>

          <div style="margin:24px 0;padding:14px 16px;background:#eef2ff;border:1px solid #c7d2fe;border-radius:12px">
            <p style="margin:0;font-size:13px;color:#3730a3;font-weight:700;text-transform:uppercase;letter-spacing:0.08em">Due date</p>
            <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#1e1b4b">${escapeHtml(dueLabel)}</p>
          </div>

          <a href="${escapeHtml(details.portalUrl)}"
             style="display:inline-block;padding:13px 22px;background:#4338ca;color:#ffffff;font-size:14px;font-weight:700;border-radius:12px;text-decoration:none">
            Log in to pay or view receipt
          </a>

          <p style="margin:22px 0 0;font-size:12px;color:#64748b;line-height:1.6">
            You can view this bill, upload a payment receipt and download receipts any time from the Resident Portal:
            <br /><a href="${escapeHtml(details.portalUrl)}" style="color:#4338ca">${escapeHtml(details.portalUrl)}</a>
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b">
          This is an automated billing notification from ${escapeHtml(details.hostelName)}.
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
