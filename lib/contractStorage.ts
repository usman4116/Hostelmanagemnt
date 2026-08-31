import { supabase } from "@/lib/supabase";
import { getSupabaseErrorMessage } from "@/lib/supabaseErrors";

const AGREEMENT_BUCKET = "contract-agreements";
const SIGNATURE_BUCKET = "contract-signature";

function safeFileName(name: string) {
  return name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
}

export async function uploadContractAgreement(
  contractId: string,
  file: File,
) {
  const path = `${contractId}/${Date.now()}-${safeFileName(file.name)}`;
  const { error } = await supabase.storage
    .from(AGREEMENT_BUCKET)
    .upload(path, file, { contentType: "application/pdf", upsert: false });

  if (error) {
    throw new Error(
      getSupabaseErrorMessage(
        error,
        "Unable to upload the agreement PDF. Please try again.",
      ),
    );
  }

  return path;
}

export async function getLatestContractAgreement(contractId: string) {
  const { data: files, error: listError } = await supabase.storage
    .from(AGREEMENT_BUCKET)
    .list(contractId, {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });

  if (listError) {
    throw new Error(
      getSupabaseErrorMessage(
        listError,
        "Unable to load the contract agreement.",
      ),
    );
  }

  const agreement = (files ?? []).find((file) =>
    file.name.toLowerCase().endsWith(".pdf"),
  );

  if (!agreement) return null;

  const path = `${contractId}/${agreement.name}`;
  const { data, error: signedUrlError } = await supabase.storage
    .from(AGREEMENT_BUCKET)
    .createSignedUrl(path, 60 * 60);

  if (signedUrlError || !data?.signedUrl) {
    throw new Error(
      getSupabaseErrorMessage(
        signedUrlError,
        "Unable to prepare the agreement download.",
      ),
    );
  }

  return data.signedUrl;
}

export async function uploadResidentSignature(
  contractId: string,
  signature: Blob,
  originalFileName = "resident-signature.png",
) {
  const extension =
    signature.type === "image/jpeg"
      ? ".jpg"
      : signature.type === "image/png"
        ? ".png"
        : originalFileName.toLowerCase().endsWith(".jpeg")
          ? ".jpeg"
          : ".png";
  const path = `${contractId}/${Date.now()}-resident-signature${extension}`;
  const { error } = await supabase.storage
    .from(SIGNATURE_BUCKET)
    .upload(path, signature, {
      contentType: signature.type || "image/png",
      upsert: false,
    });

  if (error) {
    throw new Error(
      getSupabaseErrorMessage(
        error,
        "Unable to upload the resident signature. Please try again.",
      ),
    );
  }

  return supabase.storage.from(SIGNATURE_BUCKET).getPublicUrl(path).data
    .publicUrl;
}
