import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  apiError,
  apiJson,
  requireStaff,
  BILLING_STAFF_ROLES,
} from "@/lib/adminApiAuth";
import {
  getMeterReadingConfig,
  isResidentElectricityEnabled,
  calculateMeterUnits,
  calculateMeterCharge,
  roundMoney,
} from "@/lib/meterReading";

function text(value: unknown) {
  return String(value ?? "").trim();
}

function numberVal(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month")?.slice(0, 7);
    const residentId = searchParams.get("resident_id");

    let query = supabaseAdmin
      .from("ac_bills")
      .select(
        "id, bill_id, resident_id, admission_id, billing_month, previous_reading, current_reading, units_consumed, rate_per_unit, total_amount, remarks, created_at"
      )
      .order("created_at", { ascending: false });

    if (month) {
      query = query.like("billing_month", `${month}%`);
    }
    if (residentId) {
      query = query.eq("resident_id", residentId);
    }

    const { data: readings, error } = await query;
    if (error) {
      console.error("[meterReading] GET error:", error);
      return apiError("Meter readings could not be retrieved.", 500);
    }

    const allReadings = readings ?? [];
    if (allReadings.length === 0) {
      return apiJson({ readings: [] });
    }

    const resIds = [...new Set(allReadings.map((r) => r.resident_id).filter(Boolean))];
    const billIds = [...new Set(allReadings.map((r) => r.bill_id).filter(Boolean))];
    const admIds = [...new Set(allReadings.map((r) => r.admission_id).filter(Boolean))];

    const [residentsRes, billsRes, admissionsRes] = await Promise.all([
      resIds.length > 0
        ? supabaseAdmin.from("residents").select("id, full_name, resident_code, phone").in("id", resIds)
        : { data: [] },
      billIds.length > 0
        ? supabaseAdmin.from("bills").select("id, bill_number, bill_status, total_amount, billing_month").in("id", billIds)
        : { data: [] },
      admIds.length > 0
        ? supabaseAdmin.from("admissions").select("id, room_id, bed_id, status").in("id", admIds)
        : { data: [] },
    ]);

    const resMap = new Map((residentsRes.data ?? []).map((r) => [r.id, r]));
    const billMap = new Map((billsRes.data ?? []).map((b) => [b.id, b]));
    const admMap = new Map((admissionsRes.data ?? []).map((a) => [a.id, a]));

    const roomIds = [...new Set((admissionsRes.data ?? []).map((a) => a.room_id).filter(Boolean))];
    const bedIds = [...new Set((admissionsRes.data ?? []).map((a) => a.bed_id).filter(Boolean))];

    const [roomsRes, bedsRes] = await Promise.all([
      roomIds.length > 0
        ? supabaseAdmin.from("rooms").select("id, room_number").in("id", roomIds)
        : { data: [] },
      bedIds.length > 0
        ? supabaseAdmin.from("beds").select("id, bed_number").in("id", bedIds)
        : { data: [] },
    ]);

    const roomMap = new Map((roomsRes.data ?? []).map((r) => [r.id, r.room_number]));
    const bedMap = new Map((bedsRes.data ?? []).map((b) => [b.id, b.bed_number]));

    const enriched = allReadings.map((r) => {
      const resident = resMap.get(r.resident_id);
      const bill = r.bill_id ? billMap.get(r.bill_id) : null;
      const adm = r.admission_id ? admMap.get(r.admission_id) : null;
      const roomNumber = adm?.room_id ? roomMap.get(adm.room_id) : null;
      const bedNumber = adm?.bed_id ? bedMap.get(adm.bed_id) : null;

      return {
        ...r,
        resident_name: resident?.full_name ?? "Unknown",
        resident_code: resident?.resident_code ?? null,
        resident_phone: resident?.phone ?? null,
        room_number: roomNumber ?? null,
        bed_number: bedNumber ?? null,
        bill_number: bill?.bill_number ?? null,
        bill_status: bill?.bill_status ?? null,
        is_billed: Boolean(r.bill_id),
      };
    });

    return apiJson({ readings: enriched });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return apiError(message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { staff, response } = await requireStaff(
      request,
      [...BILLING_STAFF_ROLES, "staff"]
    );
    if (!staff) return response;

    const body = await request.json().catch(() => null);
    if (!body) return apiError("Invalid request body.", 400);

    const residentId = text(body.resident_id);
    const admissionId = text(body.admission_id) || null;
    const billingMonth = text(body.billing_month).slice(0, 7);
    const previousReading = numberVal(body.previous_reading);
    const currentReading = numberVal(body.current_reading);

    if (!residentId) {
      return apiError("Student/Resident is required.", 400);
    }
    if (!billingMonth || !/^\d{4}-\d{2}$/.test(billingMonth)) {
      return apiError("A valid billing month (YYYY-MM) is required.", 400);
    }
    if (previousReading < 0 || currentReading < 0) {
      return apiError("Meter readings cannot be negative.", 400);
    }
    if (currentReading < previousReading) {
      return apiError("Current reading must be greater than or equal to previous reading.", 400);
    }

    const config = await getMeterReadingConfig(supabaseAdmin);
    if (!isResidentElectricityEnabled(config, residentId)) {
      return apiError("This student is not selected/enabled for electricity billing. Please enable electricity billing for this student first.", 400);
    }

    const ratePerUnit =
      body.rate_per_unit !== undefined && Number(body.rate_per_unit) > 0
        ? roundMoney(Number(body.rate_per_unit))
        : config.default_unit_rate;

    const unitsConsumed = calculateMeterUnits(previousReading, currentReading);
    const totalAmount = calculateMeterCharge(unitsConsumed, ratePerUnit);

    const existingCheck = await supabaseAdmin
      .from("ac_bills")
      .select("id, bill_id")
      .eq("resident_id", residentId)
      .like("billing_month", `${billingMonth}%`)
      .maybeSingle();

    if (existingCheck.data) {
      if (existingCheck.data.bill_id) {
        return apiError(
          `A meter reading for this student in ${billingMonth} is already attached to a generated rent bill. Edit the bill directly if needed.`,
          400
        );
      }
      const { data: updated, error: updateErr } = await supabaseAdmin
        .from("ac_bills")
        .update({
          admission_id: admissionId,
          previous_reading: previousReading,
          current_reading: currentReading,
          units_consumed: unitsConsumed,
          rate_per_unit: ratePerUnit,
          total_amount: totalAmount,
          remarks: text(body.remarks) || `Meter reading for ${billingMonth}`,
        })
        .eq("id", existingCheck.data.id)
        .select()
        .single();

      if (updateErr) {
        return apiError(updateErr.message, 500);
      }
      return apiJson({ success: true, reading: updated, message: "Updated existing reading for this month." });
    }

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("ac_bills")
      .insert({
        resident_id: residentId,
        admission_id: admissionId,
        bill_id: null,
        billing_month: billingMonth,
        previous_reading: previousReading,
        current_reading: currentReading,
        units_consumed: unitsConsumed,
        rate_per_unit: ratePerUnit,
        total_amount: totalAmount,
        remarks: text(body.remarks) || `Meter reading for ${billingMonth}`,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("[meterReading] Insert error:", insertErr);
      return apiError(insertErr.message, 500);
    }

    return apiJson({ success: true, reading: inserted }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return apiError(message, 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { staff, response } = await requireStaff(
      request,
      [...BILLING_STAFF_ROLES, "staff"]
    );
    if (!staff) return response;

    const body = await request.json().catch(() => null);
    if (!body || !body.id) return apiError("Reading ID is required.", 400);

    const readingId = text(body.id);
    const previousReading = numberVal(body.previous_reading);
    const currentReading = numberVal(body.current_reading);
    const ratePerUnit = numberVal(body.rate_per_unit);

    if (previousReading < 0 || currentReading < 0) {
      return apiError("Readings cannot be negative.", 400);
    }
    if (currentReading < previousReading) {
      return apiError("Current reading must be >= previous reading.", 400);
    }
    if (ratePerUnit <= 0) {
      return apiError("Rate per unit must be greater than zero.", 400);
    }

    const unitsConsumed = calculateMeterUnits(previousReading, currentReading);
    const totalAmount = calculateMeterCharge(unitsConsumed, ratePerUnit);

    const { data: updated, error } = await supabaseAdmin
      .from("ac_bills")
      .update({
        previous_reading: previousReading,
        current_reading: currentReading,
        units_consumed: unitsConsumed,
        rate_per_unit: ratePerUnit,
        total_amount: totalAmount,
        remarks: text(body.remarks) || null,
      })
      .eq("id", readingId)
      .select()
      .single();

    if (error) {
      return apiError(error.message, 500);
    }

    return apiJson({ success: true, reading: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return apiError(message, 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { staff, response } = await requireStaff(
      request,
      [...BILLING_STAFF_ROLES, "staff"]
    );
    if (!staff) return response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return apiError("Reading ID is required.", 400);

    const { data: reading } = await supabaseAdmin
      .from("ac_bills")
      .select("id, bill_id")
      .eq("id", id)
      .maybeSingle();

    if (reading?.bill_id) {
      return apiError(
        "This meter reading is already linked to a generated rent bill and cannot be deleted directly. Delete or cancel the rent bill first.",
        400
      );
    }

    const { error } = await supabaseAdmin.from("ac_bills").delete().eq("id", id);
    if (error) {
      return apiError(error.message, 500);
    }

    return apiJson({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return apiError(message, 500);
  }
}
