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
  saveMeterReadingConfig,
} from "@/lib/meterReading";

export async function GET(request: NextRequest) {
  try {
    const config = await getMeterReadingConfig(supabaseAdmin);
    return apiJson({ config });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load config";
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

    const body = (await request.json().catch(() => ({}))) as {
      default_unit_rate?: unknown;
      enabled_resident_ids?: unknown;
    };

    const updatePayload: {
      default_unit_rate?: number;
      enabled_resident_ids?: string[];
    } = {};

    if (body.default_unit_rate !== undefined) {
      const rate = Number(body.default_unit_rate);
      if (Number.isFinite(rate) && rate >= 0) {
        updatePayload.default_unit_rate = rate;
      }
    }

    if (body.enabled_resident_ids !== undefined) {
      if (Array.isArray(body.enabled_resident_ids)) {
        updatePayload.enabled_resident_ids = body.enabled_resident_ids.map((id) =>
          String(id).trim()
        );
      }
    }

    const result = await saveMeterReadingConfig(supabaseAdmin, updatePayload);
    if (!result.success) {
      return apiError(result.error || "Failed to save configuration", 500);
    }

    return apiJson({ success: true, config: result.config });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update config";
    return apiError(message, 500);
  }
}
