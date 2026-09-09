import { SupabaseClient } from "@supabase/supabase-js";

export const METER_READING_CONFIG_KEY = "meter_reading_config";
export const DEFAULT_UNIT_RATE = 50;

export type MeterReadingConfig = {
  default_unit_rate: number;
  enabled_resident_ids: string[];
};

export const DEFAULT_METER_CONFIG: MeterReadingConfig = {
  default_unit_rate: DEFAULT_UNIT_RATE,
  enabled_resident_ids: [],
};

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateMeterUnits(previous: number, current: number): number {
  const prev = Number.isFinite(previous) ? previous : 0;
  const curr = Number.isFinite(current) ? current : 0;
  return Math.max(roundMoney(curr - prev), 0);
}

export function calculateMeterCharge(units: number, rate: number): number {
  const u = Number.isFinite(units) ? units : 0;
  const r = Number.isFinite(rate) ? rate : 0;
  return roundMoney(u * r);
}

export function isResidentElectricityEnabled(
  config: MeterReadingConfig | null | undefined,
  residentId: string | null | undefined
): boolean {
  if (!config || !residentId) return false;
  return config.enabled_resident_ids.includes(String(residentId).trim());
}

export async function getMeterReadingConfig(
  supabase: SupabaseClient
): Promise<MeterReadingConfig> {
  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("notes")
      .eq("setting_key", METER_READING_CONFIG_KEY)
      .maybeSingle();

    if (error || !data || !data.notes) {
      return { ...DEFAULT_METER_CONFIG };
    }

    try {
      const parsed = JSON.parse(data.notes);
      return {
        default_unit_rate:
          typeof parsed.default_unit_rate === "number" && parsed.default_unit_rate >= 0
            ? roundMoney(parsed.default_unit_rate)
            : DEFAULT_UNIT_RATE,
        enabled_resident_ids: Array.isArray(parsed.enabled_resident_ids)
          ? parsed.enabled_resident_ids.map((id: unknown) => String(id).trim()).filter(Boolean)
          : [],
      };
    } catch {
      return { ...DEFAULT_METER_CONFIG };
    }
  } catch (err) {
    console.error("[meterReading] Failed to load config:", err);
    return { ...DEFAULT_METER_CONFIG };
  }
}

export async function saveMeterReadingConfig(
  supabase: SupabaseClient,
  config: Partial<MeterReadingConfig>
): Promise<{ success: boolean; config: MeterReadingConfig; error?: string }> {
  try {
    const current = await getMeterReadingConfig(supabase);
    const updated: MeterReadingConfig = {
      default_unit_rate:
        typeof config.default_unit_rate === "number" && config.default_unit_rate >= 0
          ? roundMoney(config.default_unit_rate)
          : current.default_unit_rate,
      enabled_resident_ids: Array.isArray(config.enabled_resident_ids)
        ? [...new Set(config.enabled_resident_ids.map((id) => String(id).trim()).filter(Boolean))]
        : current.enabled_resident_ids,
    };

    const { error } = await supabase.from("system_settings").upsert(
      {
        setting_key: METER_READING_CONFIG_KEY,
        notes: JSON.stringify(updated),
      },
      { onConflict: "setting_key" }
    );

    if (error) {
      console.error("[meterReading] Upsert error:", error);
      return { success: false, config: current, error: error.message };
    }

    return { success: true, config: updated };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save configuration";
    return { success: false, config: DEFAULT_METER_CONFIG, error: message };
  }
}
