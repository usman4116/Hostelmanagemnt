import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isSecurityDepositReceipt, receiptPaymentMethod } from "@/lib/paymentReceiptPurpose";
import { createResidentReceiptPdf } from "@/lib/residentReceiptPdf";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "private, no-store" } });
}

function value(input: unknown) {
  return input == null ? "" : String(input).trim();
}

function isPaid(input: unknown) {
  return ["verified", "paid", "completed", "received"].includes(value(input).toLowerCase());
}

export async function GET(request: NextRequest, context: { params: Promise<{ source: string; id: string }> }) {
  try {
    const authorization = request.headers.get("authorization") ?? "";
    const token = authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : "";
    if (!token) return errorResponse("Please sign in to download this receipt.", 401);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) return errorResponse("Receipt service configuration is incomplete.", 500);
    const authClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    const user = authData.user;
    const email = user?.email?.trim().toLowerCase() ?? "";
    if (authError || !user || !email) return errorResponse("Please sign in to download this receipt.", 401);

    const metadataResidentId = typeof user.user_metadata?.resident_id === "string" ? user.user_metadata.resident_id.trim() : "";
    let residentQuery = supabaseAdmin.from("residents").select("id, resident_code, full_name, email, status").ilike("email", email);
    if (metadataResidentId) residentQuery = residentQuery.eq("id", metadataResidentId);
    const { data: resident, error: residentError } = await residentQuery.maybeSingle();
    if (residentError) return errorResponse("Your resident profile could not be verified.", 500);
    if (!resident || value(resident.status).toLowerCase() === "archived") return errorResponse("No active resident profile is linked to this account.", 403);

    const { source, id } = await context.params;
    if (!["payment", "receipt"].includes(source) || !id) return errorResponse("Receipt not found.", 404);

    let record: Record<string, unknown> | null = null;
    let paymentType = "Account payment";
    let paymentMethod = "Payment method not recorded";
    let receiptNumber = "";
    let billId = "";
    if (source === "payment") {
      const result = await supabaseAdmin.from("payments").select("id, bill_id, payment_number, payment_date, amount, payment_method, reference_number, payment_status, verified_by, verified_at, created_at").eq("id", id).eq("resident_id", resident.id).maybeSingle();
      if (result.error) return errorResponse("The receipt could not be loaded.", 500);
      record = result.data;
      if (!record) return errorResponse("Receipt not found.", 404);
      if (!isPaid(record.payment_status)) return errorResponse("A receipt is available after the payment is verified.", 409);
      billId = value(record.bill_id);
      paymentType = billId ? "Bill payment" : "Account payment";
      paymentMethod = value(record.payment_method) || paymentMethod;
      receiptNumber = value(record.payment_number);
    } else {
      const result = await supabaseAdmin.from("payment_receipts").select("id, bill_id, amount, reference_number, status, verified_by, verified_at, notes, created_at").eq("id", id).eq("resident_id", resident.id).maybeSingle();
      if (result.error) return errorResponse("The receipt could not be loaded.", 500);
      record = result.data;
      if (!record) return errorResponse("Receipt not found.", 404);
      if (!isPaid(record.status)) return errorResponse("A receipt is available after the payment is verified.", 409);
      billId = value(record.bill_id);
      paymentType = isSecurityDepositReceipt(record.notes) ? "Security deposit" : billId ? "Bill payment" : "Receipt payment";
      paymentMethod = receiptPaymentMethod(record.notes) || paymentMethod;
    }

    const [{ data: bill }, { data: admissionRows }, { data: settings }] = await Promise.all([
      billId ? supabaseAdmin.from("bills").select("id, bill_number, admission_id, billing_month").eq("id", billId).eq("resident_id", resident.id).maybeSingle() : Promise.resolve({ data: null }),
      supabaseAdmin.from("admissions").select("id, room_id, bed_id, status, created_at").eq("resident_id", resident.id).order("created_at", { ascending: false }),
      supabaseAdmin.from("system_settings").select("hostel_name, hostel_address, contact_number, email, logo_url, receipt_prefix").eq("setting_key", "main").maybeSingle(),
    ]);
    const admission = (admissionRows ?? []).find((row) => row.id === bill?.admission_id) ?? (admissionRows ?? []).find((row) => row.status === "Active") ?? admissionRows?.[0] ?? null;
    const [{ data: room }, { data: bed }] = await Promise.all([
      admission?.room_id ? supabaseAdmin.from("rooms").select("room_number").eq("id", admission.room_id).maybeSingle() : Promise.resolve({ data: null }),
      admission?.bed_id ? supabaseAdmin.from("beds").select("bed_number").eq("id", admission.bed_id).maybeSingle() : Promise.resolve({ data: null }),
    ]);

    const fallbackNumber = `${value(settings?.receipt_prefix) || "RCP"}-${id.replace(/-/g, "").slice(0, 10).toUpperCase()}`;
    receiptNumber ||= fallbackNumber;
    const verifiedBy = value(record.verified_by) || "StayHub Administration";
    const pdf = await createResidentReceiptPdf({
      hostelName: value(settings?.hostel_name) || "StayHub Hostel Management",
      hostelAddress: value(settings?.hostel_address),
      hostelContact: value(settings?.contact_number),
      hostelEmail: value(settings?.email),
      logoUrl: value(settings?.logo_url),
      residentName: value(resident.full_name) || "Resident",
      residentId: value(resident.resident_code) || resident.id,
      room: value(room?.room_number) || "Not assigned",
      bed: value(bed?.bed_number) || "Not assigned",
      paymentDate: value(record.payment_date ?? record.verified_at ?? record.created_at),
      receiptNumber,
      billReference: value(bill?.bill_number) || value(record.reference_number) || (paymentType === "Security deposit" ? "Security Deposit" : "No bill reference"),
      paymentType,
      amount: Number(record.amount || 0),
      paymentMethod,
      paymentStatus: "Paid",
      verifiedBy,
      verifiedAt: value(record.verified_at),
    });
    const safeNumber = receiptNumber.replace(/[^a-z0-9_-]+/gi, "-");
    return new NextResponse(Buffer.from(pdf), { status: 200, headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="StayHub-Receipt-${safeNumber}.pdf"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return errorResponse("The receipt could not be generated.", 500);
  }
}
