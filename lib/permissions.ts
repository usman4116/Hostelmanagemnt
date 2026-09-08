export type PermissionDefinition = {
  id: string;
  name: string;
  description: string;
  href: string;
  category: "Core" | "Accommodations" | "Finance" | "Operations" | "System";
};

export type PermissionId = string;

export const AVAILABLE_PERMISSIONS: PermissionDefinition[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    description: "Hostel overview, occupancy metrics, alerts, and quick actions",
    href: "/dashboard",
    category: "Core",
  },
  {
    id: "admissions",
    name: "Admissions",
    description: "New resident check-in, bed assignment, and admission management",
    href: "/admissions",
    category: "Accommodations",
  },
  {
    id: "residents",
    name: "Residents",
    description: "Resident profiles, emergency contacts, login links, and documents",
    href: "/residents",
    category: "Accommodations",
  },
  {
    id: "rooms",
    name: "Rooms",
    description: "Hostel room inventory, capacities, bed status, and pricing",
    href: "/rooms",
    category: "Accommodations",
  },
  {
    id: "beds",
    name: "Beds",
    description: "Bed allocations, availability, and occupant resident details",
    href: "/beds",
    category: "Accommodations",
  },
  {
    id: "payments",
    name: "Payments",
    description: "Payment collections, bank transaction verification, and receipts",
    href: "/payments",
    category: "Finance",
  },
  {
    id: "rent_bills",
    name: "Rent Bills",
    description: "Monthly rent invoices, AC bills, bill approvals (revenue totals hidden for staff)",
    href: "/billing?type=Rent",
    category: "Finance",
  },
  {
    id: "security_deposits",
    name: "Security Deposits",
    description: "Security deposit records, status tracking, and refunds",
    href: "/billing?type=Security Deposit",
    category: "Finance",
  },
  {
    id: "contracts",
    name: "Contracts",
    description: "Hostel tenancy agreements, digital signatures, and templates",
    href: "/contracts",
    category: "Operations",
  },
  {
    id: "inspections",
    name: "Inspections",
    description: "Room check-in, check-out, and periodic facility inspection logs",
    href: "/inspection",
    category: "Operations",
  },
  {
    id: "maintenance",
    name: "Maintenance",
    description: "Maintenance work orders, issue tracking, and resolution logs",
    href: "/maintenance",
    category: "Operations",
  },
  {
    id: "notices",
    name: "Notices",
    description: "Broadcast announcements and SMS/email notifications to residents",
    href: "/notices",
    category: "Operations",
  },
  {
    id: "reports",
    name: "Reports",
    description: "Occupancy, payment summaries, and operational audit reports",
    href: "/reports",
    category: "System",
  },
  {
    id: "settings",
    name: "Settings",
    description: "System preferences, hostel configuration, and templates",
    href: "/settings",
    category: "System",
  },
  {
    id: "admin_tools",
    name: "Admin Tools",
    description: "Staff user management, role permissions, and database tools",
    href: "/dashboard/settings/data-management",
    category: "System",
  },
];

export const ALL_PERMISSION_IDS = AVAILABLE_PERMISSIONS.map((p) => p.id);

export function isSuperAdmin(role: unknown): boolean {
  const normalized = String(role ?? "").trim().toLowerCase();
  return normalized === "super admin" || normalized === "admin";
}

export function hasPermission(
  role: unknown,
  permissions: unknown,
  permissionId: string,
): boolean {
  if (isSuperAdmin(role)) return true;
  if (!Array.isArray(permissions)) return false;
  return permissions.includes(permissionId);
}

/**
 * Revenue financials in Rent Bills (Pending Balance, Collected)
 * should NOT be shown to staff users per explicit security requirement.
 */
export function canViewRevenue(role: unknown): boolean {
  return isSuperAdmin(role);
}

export function matchPathToPermission(
  pathname: string,
  searchType?: string | null,
): string | null {
  if (pathname === "/billing") {
    if (searchType === "Security Deposit") {
      return "security_deposits";
    }
    return "rent_bills";
  }

  if (pathname === "/dashboard") return "dashboard";
  if (pathname === "/admissions" || pathname.startsWith("/admissions/")) return "admissions";
  if (pathname === "/residents" || pathname.startsWith("/residents/")) return "residents";
  if (pathname === "/rooms" || pathname.startsWith("/rooms/")) return "rooms";
  if (pathname === "/beds" || pathname.startsWith("/beds/")) return "beds";
  if (
    pathname === "/payments" ||
    pathname.startsWith("/payments/") ||
    pathname === "/payment-verification" ||
    pathname.startsWith("/payment-verification/")
  ) {
    return "payments";
  }
  if (
    pathname === "/contracts" ||
    pathname.startsWith("/contracts/") ||
    pathname === "/contract-template"
  ) {
    return "contracts";
  }
  if (pathname === "/inspection" || pathname.startsWith("/inspection/")) return "inspections";
  if (pathname === "/maintenance" || pathname.startsWith("/maintenance/")) return "maintenance";
  if (pathname === "/notices" || pathname.startsWith("/notices/")) return "notices";
  if (pathname === "/reports" || pathname.startsWith("/reports/")) return "reports";
  if (
    pathname === "/dashboard/settings/data-management" ||
    pathname.startsWith("/dashboard/settings/data-management/") ||
    pathname === "/users"
  ) {
    return "admin_tools";
  }
  if (pathname === "/settings" || pathname.startsWith("/settings/")) return "settings";

  return null;
}

export function canAccessRoute(
  role: unknown,
  permissions: unknown,
  pathname: string,
  searchType?: string | null,
): boolean {
  if (isSuperAdmin(role)) return true;
  if (pathname === "/profile" || pathname.startsWith("/profile/")) return true;

  const requiredPermission = matchPathToPermission(pathname, searchType);
  if (!requiredPermission) return true; // Unprotected or neutral route

  return hasPermission(role, permissions, requiredPermission);
}

export function getFirstAllowedRoute(
  role: unknown,
  permissions: unknown,
): string {
  if (isSuperAdmin(role)) return "/dashboard";
  const userPerms = Array.isArray(permissions) ? permissions : [];
  for (const perm of AVAILABLE_PERMISSIONS) {
    if (userPerms.includes(perm.id)) {
      return perm.href;
    }
  }
  return "/profile";
}
