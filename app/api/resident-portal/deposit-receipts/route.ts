import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { securityDepositReceiptNotes } from "@/lib/paymentReceiptPurpose";
import { notifyResidentEvent } from "@/lib/notifications/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const SAFE_FILE_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

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

function hasExpectedSignature(bytes: Uint8Array, type: string) {
  if (type === "application/pdf") {
    return bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
  }
  if (type === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  return bytes.length >= 8 &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
      .every((byte, index) => bytes[index] === byte);
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-160) || "receipt";
}

export async function POST(request: NextRequest) {
  let uploadedPath = "";
  try {
    const token = bearerToken(request);
    if (!token) return jsonError("Please sign in to submit a receipt.", 401);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) {
      return jsonError("Resident portal server configuration is incomplete.", 500);
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    const user = authData.user;
    const email = user?.email?.trim().toLowerCase() ?? "";
    if (authError || !user || !email) {
      return jsonError("Please sign in to submit a receipt.", 401);
    }

    const metadataResidentId =
      typeof user.user_metadata?.resident_id === "string"
        ? user.user_metadata.resident_id.trim()
        : "";
    let residentQuery = supabaseAdmin
      .from("residents")
      .select("id, status")
      .ilike("email", email);
    if (metadataResidentId) residentQuery = residentQuery.eq("id", metadataResidentId);
    const { data: resident, error: residentError } = await residentQuery.maybeSingle();
    if (residentError || !resident) {
      return jsonError("Your resident profile could not be verified.", 403);
    }
    if (String(resident.status ?? "").trim().toLowerCase() === "archived") {
      return jsonError("Archived residents cannot submit receipts.", 403);
    }

    const { data: admission, error: admissionError } = await supabaseAdmin
      .from("admissions")
      .select("id, resident_id, security_deposit, deposit_status, status")
      .eq("resident_id", resident.id)
      .eq("status", "Pending")
      .eq("deposit_status", "Pending")
      .gt("security_deposit", 0)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (admissionError) {
      return jsonError("Your security deposit obligation could not be verified.", 500);
    }
    if (!admission) {
      return jsonError("No outstanding security deposit is available for payment.", 409);
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const paymentMethod = String(formData.get("paymentMethod") ?? "").trim().slice(0, 100);
    const referenceNumber = String(formData.get("referenceNumber") ?? "").trim().slice(0, 120);
    const residentNotes = String(formData.get("notes") ?? "").trim().slice(0, 2000);
    if (!(file instanceof File) || !paymentMethod) {
      return jsonError("Payment method and receipt file are required.", 400);
    }
    if (!SAFE_FILE_TYPES.has(file.type) || file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return jsonError("Receipt files must be PDF, JPEG, or PNG and no larger than 5 MB.", 400);
    }
    const fileBuffer = await file.arrayBuffer();
    if (!hasExpectedSignature(new Uint8Array(fileBuffer).slice(0, 8), file.type)) {
      return jsonError("The receipt file content does not match its declared file type.", 400);
    }

    const { data: existingReceipt, error: existingError } = await supabaseAdmin
      .from("payment_receipts")
      .select("id, resident_id, bill_id, status")
      .eq("id", admission.id)
      .maybeSingle();
    if (existingError) return jsonError("Existing deposit submissions could not be checked.", 500);
    if (existingReceipt && (existingReceipt.resident_id !== resident.id || existingReceipt.bill_id)) {
      return jsonError("This deposit cannot use the existing receipt record. Contact an administrator.", 409);
    }
    if (existingReceipt && existingReceipt.status !== "Rejected") {
      return jsonError(
        existingReceipt.status === "Pending Verification"
          ? "A security deposit receipt is already pending verification."
          : "This security deposit receipt has already been processed.",
        409,
      );
    }

    if (referenceNumber) {
      const [paymentReference, receiptReference] = await Promise.all([
        supabaseAdmin.from("payments").select("id").eq("reference_number", referenceNumber).limit(1),
        supabaseAdmin.from("payment_receipts").select("id").eq("reference_number", referenceNumber).neq("id", admission.id).limit(1),
      ]);
      if (paymentReference.error || receiptReference.error) {
        return jsonError("The payment reference could not be checked.", 500);
      }
      if ((paymentReference.data ?? []).length || (receiptReference.data ?? []).length) {
        return jsonError("This reference number has already been submitted.", 409);
      }
    }

    uploadedPath = `${resident.id}/security-deposits/${admission.id}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("payment-receipts")
      .upload(uploadedPath, fileBuffer, { contentType: file.type, cacheControl: "3600", upsert: false });
    if (uploadError) return jsonError("The receipt file could not be uploaded. Please try again.", 500);

    const { data: urlData } = supabaseAdmin.storage.from("payment-receipts").getPublicUrl(uploadedPath);
    const now = new Date().toISOString();
    const receiptPayload = {
      resident_id: resident.id,
      bill_id: null,
      payment_id: null,
      receipt_url: urlData.publicUrl,
      original_file_name: file.name.slice(0, 255),
      reference_number: referenceNumber || null,
      amount: Number(admission.security_deposit),
      status: "Pending Verification",
      verified: false,
      verified_by: null,
      verified_at: null,
      remarks: null,
      notes: securityDepositReceiptNotes(admission.id, paymentMethod, residentNotes),
      uploaded_at: now,
      created_at: now,
      updated_at: now,
    };

    const receiptResult = existingReceipt
      ? await supabaseAdmin
          .from("payment_receipts")
          .update(receiptPayload)
          .eq("id", admission.id)
          .eq("resident_id", resident.id)
          .eq("status", "Rejected")
          .select("id")
          .maybeSingle()
      : await supabaseAdmin
          .from("payment_receipts")
          .insert({ id: admission.id, ...receiptPayload })
          .select("id")
          .single();

    if (receiptResult.error || !receiptResult.data) {
      await supabaseAdmin.storage.from("payment-receipts").remove([uploadedPath]);
      uploadedPath = "";
      return jsonError(
        "A security deposit receipt is already pending or the submission changed. Refresh and review its status.",
        409,
      );
    }

    const notification = await notifyResidentEvent("receipt_submitted", receiptResult.data.id);
    return NextResponse.json(
      {
        message: "Security deposit receipt submitted for verification. Your deposit remains Pending until an admin verifies it.",
        notificationWarning: notification.warning,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    if (uploadedPath) {
      await supabaseAdmin.storage.from("payment-receipts").remove([uploadedPath]);
    }
    return jsonError("The security deposit receipt could not be submitted.", 500);
  }
}
