import { supabase } from "@/lib/supabase";

export const INSPECTION_PHOTO_BUCKET = "room-inspection-photos";

export function inspectionPhotoUrl(reference: string) {
  if (/^https?:\/\//i.test(reference)) return reference;
  return supabase.storage.from(INSPECTION_PHOTO_BUCKET).getPublicUrl(reference)
    .data.publicUrl;
}

export function inspectionTypePath(type: string) {
  return type.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "inspection";
}
