export function isAdminRole(role: unknown) {
  return ["admin", "super admin"].includes(
    String(role ?? "").trim().toLowerCase(),
  );
}

export function isActiveAdmin(role: unknown, status: unknown) {
  return isAdminRole(role) && String(status ?? "").trim().toLowerCase() === "active";
}
