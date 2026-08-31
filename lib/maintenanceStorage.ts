import { supabase } from "@/lib/supabase";

export const MAINTENANCE_PHOTO_BUCKET = "maintenance-photos";

export function maintenancePhotoUrl(reference: string) {
  if (/^https?:\/\//i.test(reference)) return reference;
  return supabase.storage.from(MAINTENANCE_PHOTO_BUCKET).getPublicUrl(reference)
    .data.publicUrl;
}
