import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyResidentEvent } from "@/lib/notifications/server";
import { securityDepositAdmissionId } from "@/lib/paymentReceiptPurpose";
import { isUnapprovedBill } from "@/lib/billApproval";

const ALLOWED_STAFF_ROLES = new Set([
  "super admin",
  "admin",
  "accountant",
]);

function normalized(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function bearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") ?? "";
  return header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";
}

function jsonError(error: string, status: number) {
  return NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}

function paymentMethod(notes: unknown) {
  const match = String(notes ?? "").match(/^Payment method:\s*(.+)$/im);
  return match?.[1]?.trim() || "Receipt submission";
}

function paymentNumber(receiptId: string) {
  return `PAY-${new Date().getFullYear()}-${receiptId
    .replaceAll("-", "")
    .slice(0, 8)
    .toUpperCase()}`;
}

function billStatus(
  total: number,
  paid: number,
  dueDate: string | null,
) {
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

export async function POST(request: NextRequest) {
  try {
    const token = bearerToken(request);
    if (!token) return jsonError("Your admin session could not be verified.", 401);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) {
      return jsonError("Supabase server configuration is incomplete.", 500);
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } =
      await authClient.auth.getUser(token);
    const verifier = authData.user?.email?.trim().toLowerCase() ?? "";
    if (authError || !verifier) {
      return jsonError("Your admin session could not be verified.", 401);
    }

    const { data: staff, error: staffError } = await supabaseAdmin
      .from("staff_users")
      .select("id, role, status")
      .ilike("email", verifier)
      .maybeSingle();
    if (
      staffError ||
      !staff ||
      normalized(staff.status) !== "active" ||
      !ALLOWED_STAFF_ROLES.has(normalized(staff.role))
    ) {
      return jsonError(
        "You do not have permission to verify resident payments.",
        403,
      );
    }

    const body = (await request.json().catch(() => null)) as
      | { receiptId?: unknown; action?: unknown; rejectionReason?: unknown }
      | null;
    const receiptId =
      typeof body?.receiptId === "string" ? body.receiptId.trim() : "";
    const action = body?.action === "Verify" || body?.action === "Reject"
      ? body.action
      : null;
    const rejectionReason =
      typeof body?.rejectionReason === "string"
        ? body.rejectionReason.trim()
        : "";

    if (!receiptId || !action) {
      return jsonError("A valid receipt and verification action are required.", 400);
    }
    if (action === "Reject" && !rejectionReason) {
      return jsonError("A rejection reason is required.", 400);
    }

    const { data: receipt, error: receiptError } = await supabaseAdmin
      .from("payment_receipts")
      .select(
        "id, resident_id, bill_id, payment_id, amount, reference_number, status, notes, remarks, verified_at",
      )
      .eq("id", receiptId)
      .maybeSingle();
    if (receiptError || !receipt) {
      return jsonError("The receipt could not be verified.", 404);
    }
    const depositAdmissionId = receipt.bill_id
      ? null
      : securityDepositAdmissionId(receipt.notes);

    let linkedPaymentError = null;
    const linkedPayments = [];
    if (receipt.payment_id) {
      const { data, error } = await supabaseAdmin
        .from("payments")
        .select("id, resident_id, bill_id, amount, payment_status")
        .eq("id", receipt.payment_id)
        .limit(2);
      if (error) {
        linkedPaymentError = error;
      } else if (data) {
        linkedPayments.push(...data);
      }
    }

    if (linkedPaymentError) {
      return jsonError("The linked payment could not be checked.", 500);
    }
    if ((linkedPayments ?? []).length > 1) {
      return jsonError(
        "Multiple payments are linked to this receipt. Resolve the financial conflict before continuing.",
        409,
      );
    }
    const existingPayment = linkedPayments?.[0] ?? null;

    if (receipt.status !== "Pending Verification") {
      if (
        action === "Verify" &&
        receipt.status === "Verified" &&
        (depositAdmissionId || existingPayment?.payment_status === "Verified")
      ) {
        return NextResponse.json(
          { message: "This receipt was already verified.", alreadyProcessed: true },
          { headers: { "Cache-Control": "private, no-store" } },
        );
      }
      return jsonError(
        `This receipt is already ${receipt.status}. No second action was applied.`,
        409,
      );
    }

    if (action === "Reject") {
      if (existingPayment?.payment_status === "Verified") {
        return jsonError(
          "This receipt already has a verified payment and cannot be rejected.",
          409,
        );
      }

      const now = new Date().toISOString();
      const { data: rejectedReceipt, error: rejectionError } =
        await supabaseAdmin
          .from("payment_receipts")
          .update({
            status: "Rejected",
            verified: false,
            verified_by: null,
            verified_at: null,
            remarks: rejectionReason,
            updated_at: now,
          })
          .eq("id", receipt.id)
          .eq("status", "Pending Verification")
          .select("id")
          .maybeSingle();
      if (rejectionError || !rejectedReceipt) {
        return jsonError(
          "The receipt changed before it could be rejected. Refresh and review its current status.",
          409,
        );
      }

      if (existingPayment?.payment_status === "Pending") {
        const { error: paymentRejectError } = await supabaseAdmin
          .from("payments")
          .update({
            payment_status: "Rejected",
            verified: false,
            notes: rejectionReason,
            updated_at: now,
          })
          .eq("id", existingPayment.id)
          .eq("payment_status", "Pending");
        if (paymentRejectError) {
          await notifyResidentEvent("payment_rejected", receipt.id);
          return jsonError(
            "The receipt was rejected, but its legacy pending payment could not be updated. It remains unverified and does not affect the bill.",
            500,
          );
        }
      }

      const notification = await notifyResidentEvent(
        "payment_rejected",
        receipt.id,
      );
      return NextResponse.json(
        {
          message: depositAdmissionId
            ? "Security deposit receipt rejected. The admission deposit remains Pending."
            : "Receipt rejected. No amount was applied to the bill.",
          notificationWarning: notification.warning,
        },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    if (depositAdmissionId) {
      if (receipt.bill_id || existingPayment) {
        return jsonError(
          "This security deposit receipt is incorrectly linked to a bill or payment.",
          409,
        );
      }

      const { data: admission, error: admissionError } = await supabaseAdmin
        .from("admissions")
        .select("id, resident_id, status, security_deposit, deposit_status")
        .eq("id", depositAdmissionId)
        .maybeSingle();
      const receiptAmount = roundMoney(Number(receipt.amount ?? 0));
      const depositAmount = roundMoney(Number(admission?.security_deposit ?? 0));
      if (
        admissionError ||
        !admission ||
        admission.resident_id !== receipt.resident_id ||
        admission.status !== "Pending" ||
        admission.deposit_status !== "Pending" ||
        depositAmount <= 0 ||
        receiptAmount !== depositAmount
      ) {
        return jsonError(
          "This receipt no longer matches an outstanding security deposit for the resident's Pending admission.",
          409,
        );
      }

      const verifiedAt = new Date().toISOString();
      const { data: claimedReceipt, error: claimError } = await supabaseAdmin
        .from("payment_receipts")
        .update({
          status: "Verified",
          verified: true,
          verified_by: verifier,
          verified_at: verifiedAt,
          updated_at: verifiedAt,
        })
        .eq("id", receipt.id)
        .eq("resident_id", receipt.resident_id)
        .eq("status", "Pending Verification")
        .select("id")
        .maybeSingle();
      if (claimError || !claimedReceipt) {
        return jsonError(
          "The receipt changed before verification completed. Refresh and review its current status.",
          409,
        );
      }

      const { data: receivedDeposit, error: depositError } = await supabaseAdmin
        .from("admissions")
        .update({ deposit_status: "Held", updated_at: verifiedAt })
        .eq("id", admission.id)
        .eq("resident_id", receipt.resident_id)
        .eq("status", "Pending")
        .eq("deposit_status", "Pending")
        .eq("security_deposit", admission.security_deposit)
        .select("id")
        .maybeSingle();
      if (depositError || !receivedDeposit) {
        await supabaseAdmin
          .from("payment_receipts")
          .update({
            status: "Pending Verification",
            verified: false,
            verified_by: null,
            verified_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", receipt.id)
          .eq("status", "Verified")
          .eq("verified_at", verifiedAt);
        return jsonError(
          "The admission changed during verification. The receipt remains pending; refresh and try again.",
          409,
        );
      }

      const notification = await notifyResidentEvent("payment_verified", receipt.id);
      return NextResponse.json(
        {
          message: "Security deposit receipt verified. The deposit is Held; the admission remains Pending until explicit activation.",
          notificationWarning: notification.warning,
        },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    if (!receipt.bill_id) {
      return jsonError("This receipt is not linked to a bill.", 400);
    }

    const { data: bill, error: billError } = await supabaseAdmin
      .from("bills")
      .select(
        "id, resident_id, admission_id, total_amount, paid_amount, balance_amount, due_date, bill_status",
      )
      .eq("id", receipt.bill_id)
      .maybeSingle();
    if (
      billError ||
      !bill ||
      bill.resident_id !== receipt.resident_id ||
      isUnapprovedBill(bill.bill_status) ||
      ["cancelled", "archived"].includes(normalized(bill.bill_status))
    ) {
      return jsonError(
        "The receipt is not linked to a valid payable bill for this resident.",
        409,
      );
    }

    if (bill.admission_id) {
      const { data: admission, error: admissionError } = await supabaseAdmin
        .from("admissions")
        .select("id, resident_id")
        .eq("id", bill.admission_id)
        .maybeSingle();
      if (
        admissionError ||
        !admission ||
        admission.resident_id !== receipt.resident_id
      ) {
        return jsonError(
          "The bill admission is not linked to the receipt resident.",
          409,
        );
      }
    }

    const receiptAmount = roundMoney(Number(receipt.amount ?? 0));
    const { data: verifiedPayments, error: verifiedPaymentsError } =
      await supabaseAdmin
        .from("payments")
        .select("id, amount")
        .eq("bill_id", bill.id)
        .eq("payment_status", "Verified");
    if (verifiedPaymentsError) {
      return jsonError("The current bill balance could not be confirmed.", 500);
    }
    const verifiedTotal = roundMoney(
      (verifiedPayments ?? []).reduce(
        (sum, payment) => sum + Number(payment.amount ?? 0),
        0,
      ),
    );
    const total = roundMoney(Number(bill.total_amount ?? 0));
    const outstanding = Math.max(roundMoney(total - verifiedTotal), 0);
    if (receiptAmount <= 0 || receiptAmount > outstanding) {
      return jsonError(
        "The receipt amount must be positive and cannot exceed the current outstanding balance.",
        409,
      );
    }

    if (receipt.reference_number) {
      let referenceQuery = supabaseAdmin
        .from("payments")
        .select("id")
        .eq("reference_number", receipt.reference_number)
        .limit(1);
      if (existingPayment?.id) {
        referenceQuery = referenceQuery.neq("id", existingPayment.id);
      }
      const { data: duplicateReference, error: referenceError } =
        await referenceQuery;
      if (referenceError) {
        return jsonError("The payment reference could not be checked.", 500);
      }
      if ((duplicateReference ?? []).length > 0) {
        return jsonError(
          "This reference number is already linked to another payment.",
          409,
        );
      }
    }

    if (existingPayment) {
      const matchesReceipt =
        existingPayment.payment_status === "Pending" &&
        existingPayment.resident_id === receipt.resident_id &&
        existingPayment.bill_id === receipt.bill_id &&
        roundMoney(Number(existingPayment.amount ?? 0)) === receiptAmount;
      if (!matchesReceipt) {
        return jsonError(
          "The linked payment does not match this receipt.",
          409,
        );
      }
    }

    const verifiedAt = new Date().toISOString();
    const { data: claimedReceipt, error: claimError } = await supabaseAdmin
      .from("payment_receipts")
      .update({
        status: "Verified",
        verified: true,
        verified_by: verifier,
        verified_at: verifiedAt,
        updated_at: verifiedAt,
      })
      .eq("id", receipt.id)
      .eq("status", "Pending Verification")
      .select("id")
      .maybeSingle();
    if (claimError || !claimedReceipt) {
      return jsonError(
        "The receipt changed before verification completed. Refresh and review its current status.",
        409,
      );
    }

    const paid = roundMoney(verifiedTotal + receiptAmount);
    const balance = Math.max(roundMoney(total - paid), 0);
    const nextBillStatus = billStatus(total, paid, bill.due_date);
    const originalPaid = roundMoney(Number(bill.paid_amount ?? 0));
    const originalBalance = roundMoney(Number(bill.balance_amount ?? 0));
    const { data: reservedBill, error: billReservationError } =
      await supabaseAdmin
        .from("bills")
        .update({
          paid_amount: paid,
          balance_amount: balance,
          bill_status: nextBillStatus,
          updated_at: verifiedAt,
        })
        .eq("id", bill.id)
        .eq("resident_id", receipt.resident_id)
        .eq("paid_amount", originalPaid)
        .eq("balance_amount", originalBalance)
        .eq("bill_status", bill.bill_status)
        .select("id")
        .maybeSingle();
    if (billReservationError || !reservedBill) {
      await supabaseAdmin
        .from("payment_receipts")
        .update({
          status: "Pending Verification",
          verified: false,
          verified_by: null,
          verified_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", receipt.id)
        .eq("status", "Verified")
        .eq("verified_at", verifiedAt);
      return jsonError(
        "The bill changed during verification. The receipt remains pending; refresh and try again.",
        409,
      );
    }

    const paymentPayload = {
      resident_id: receipt.resident_id,
      bill_id: receipt.bill_id,
      payment_date: verifiedAt.slice(0, 10),
      payment_method: paymentMethod(receipt.notes),
      reference_number: receipt.reference_number,
      amount: receiptAmount,
      payment_status: "Verified",
      verified: true,
      verified_by: verifier,
      verified_at: verifiedAt,
      updated_at: verifiedAt,
    };

    const paymentResult = existingPayment
      ? await supabaseAdmin
          .from("payments")
          .update(paymentPayload)
          .eq("id", existingPayment.id)
          .eq("payment_status", "Pending")
          .select("id")
          .maybeSingle()
      : await supabaseAdmin
          .from("payments")
          .insert({
            ...paymentPayload,
            payment_number: paymentNumber(receipt.id),
            notes: "Verified from a resident receipt submission.",
          })
          .select("id")
          .single();

    if (paymentResult.error || !paymentResult.data) {
      await supabaseAdmin
        .from("bills")
        .update({
          paid_amount: originalPaid,
          balance_amount: originalBalance,
          bill_status: bill.bill_status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bill.id)
        .eq("resident_id", receipt.resident_id)
        .eq("paid_amount", paid)
        .eq("balance_amount", balance)
        .eq("bill_status", nextBillStatus);
      await supabaseAdmin
        .from("payment_receipts")
        .update({
          status: "Pending Verification",
          verified: false,
          verified_by: null,
          verified_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", receipt.id)
        .eq("status", "Verified")
        .eq("verified_at", verifiedAt);
      return jsonError(
        "The payment could not be recorded, so the receipt remains pending.",
        500,
      );
    }

    const paymentId = paymentResult.data.id;
    const { error: receiptLinkError } = await supabaseAdmin
      .from("payment_receipts")
      .update({ payment_id: paymentId, updated_at: verifiedAt })
      .eq("id", receipt.id)
      .eq("status", "Verified")
      .eq("verified_at", verifiedAt);
    if (receiptLinkError) {
      return jsonError(
        "The payment was verified, but the receipt link could not be finalized. Review the canonical payment before retrying.",
        500,
      );
    }

    const notification = await notifyResidentEvent(
      "payment_verified",
      receipt.id,
    );
    return NextResponse.json(
      {
        message: "Receipt verified, payment recorded, and bill balance refreshed.",
        billSummaryUpdated: true,
        notificationWarning: notification.warning,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return jsonError("The receipt verification request could not be completed.", 500);
  }
}
