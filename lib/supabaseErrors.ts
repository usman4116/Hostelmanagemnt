type SupabaseErrorLike = {
  code?: string | null;
  message?: string | null;
};

export function isMissingColumnError(error: SupabaseErrorLike | null | undefined) {
  return Boolean(error?.message && /column|does not exist|not exist/i.test(error.message));
}

export function getSupabaseErrorMessage(
  error: SupabaseErrorLike | null | undefined,
  fallback: string,
  duplicateMessage = "A record with the same details already exists.",
) {
  const code = error?.code ?? "";
  const message = error?.message ?? "";

  if (code === "23505" || /duplicate key|unique constraint/i.test(message)) {
    return duplicateMessage;
  }

  if (code === "23503" || /foreign key constraint/i.test(message)) {
    return "This record is linked to other information and cannot be changed that way.";
  }

  if (code === "42501" || /row-level security|permission denied/i.test(message)) {
    return "You do not have permission to perform this action.";
  }

  if (/failed to fetch|network|load failed/i.test(message)) {
    return "Unable to connect to the database. Please check your connection and try again.";
  }

  if (message && (code.startsWith("PGRST") || isMissingColumnError(error))) {
    return `${fallback} (${message})`;
  }

  return fallback;
}
