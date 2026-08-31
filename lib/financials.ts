import { supabase } from "@/lib/supabase";
import { isUnapprovedBill } from "@/lib/billApproval";

export type BillLifecycleStatus =
  | "Draft"
  | "Pending Approval"
  | "Pending"
  | "Partially Paid"
  | "Paid"
  | "Overdue"
  | "Cancelled";

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function deriveBillStatus(
  total: number,
  paid: number,
  dueDate: string | null | undefined,
  currentStatus?: string | null,
): BillLifecycleStatus {
  if (currentStatus === "Cancelled") return "Cancelled";

  // A bill awaiting admin approval keeps that status until it is released,
  // so it never ages into Pending or Overdue while still unpublished.
  if (isUnapprovedBill(currentStatus)) {
    return currentStatus as BillLifecycleStatus;
  }

  const balance = Math.max(roundMoney(total - paid), 0);
  if (total > 0 && balance === 0) return "Paid";
  if (paid > 0) return "Partially Paid";

  if (dueDate) {
    const endOfDueDate = new Date(`${dueDate}T23:59:59`);
    if (!Number.isNaN(endOfDueDate.getTime()) && endOfDueDate < new Date()) {
      return "Overdue";
    }
  }

  return "Pending";
}

export async function getVerifiedPaymentTotal(
  billId: string,
  excludePaymentId?: string,
) {
  let query = supabase
    .from("payments")
    .select("id, amount")
    .eq("bill_id", billId)
    .eq("payment_status", "Verified");

  if (excludePaymentId) query = query.neq("id", excludePaymentId);

  const { data, error } = await query;
  if (error) throw error;

  return roundMoney(
    (data ?? []).reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0),
  );
}

export async function refreshBillFinancials(billId: string) {
  const { data: bill, error: billError } = await supabase
    .from("bills")
    .select("id, total_amount, due_date, bill_status")
    .eq("id", billId)
    .single();

  if (billError) throw billError;

  const paid = await getVerifiedPaymentTotal(billId);
  const total = roundMoney(Number(bill.total_amount ?? 0));
  const balance = Math.max(roundMoney(total - paid), 0);
  const status = deriveBillStatus(total, paid, bill.due_date, bill.bill_status);

  const { error: updateError } = await supabase
    .from("bills")
    .update({
      paid_amount: paid,
      balance_amount: balance,
      bill_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", billId);

  if (updateError) throw updateError;
  return { paid, balance, status, total };
}
