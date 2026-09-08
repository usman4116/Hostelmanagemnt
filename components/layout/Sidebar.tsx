"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { hasPermission, isSuperAdmin } from "@/lib/permissions";
import { supabase } from "@/lib/supabase";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", permissionId: "dashboard" },
  { name: "Admissions", href: "/admissions", permissionId: "admissions" },
  { name: "Residents", href: "/residents", permissionId: "residents" },
  { name: "Rooms", href: "/rooms", permissionId: "rooms" },
  { name: "Beds", href: "/beds", permissionId: "beds" },
  { name: "Payments", href: "/payments", permissionId: "payments" },
  { name: "Rent Bills", href: "/billing?type=Rent", permissionId: "rent_bills" },
  { name: "Security Deposits", href: "/billing?type=Security Deposit", permissionId: "security_deposits" },
  { name: "Contracts", href: "/contracts", permissionId: "contracts" },
  { name: "Inspections", href: "/inspection", permissionId: "inspections" },
  { name: "Maintenance", href: "/maintenance", permissionId: "maintenance" },
  { name: "Notices", href: "/notices", permissionId: "notices" },
  { name: "Reports", href: "/reports", permissionId: "reports" },
  { name: "Settings", href: "/settings", permissionId: "settings" },
];

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showAdminTools, setShowAdminTools] = useState(false);
  const [allowedPermissionIds, setAllowedPermissionIds] = useState<string[] | null>(null);
  const [isSuper, setIsSuper] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadAdminAccess() {
      const { data: authData } = await supabase.auth.getUser();
      const email = authData.user?.email;
      if (!email) return;

      const { data } = await supabase
        .from("staff_users")
        .select("role, status, permissions")
        .ilike("email", email)
        .maybeSingle();

      if (!active) return;

      const superAdminUser = isSuperAdmin(data?.role);
      setIsSuper(superAdminUser);

      const rawPerms = data?.permissions;
      const userPerms: string[] = Array.isArray(rawPerms)
        ? rawPerms
        : typeof rawPerms === "string"
        ? JSON.parse(rawPerms || "[]")
        : [];

      setAllowedPermissionIds(userPerms);

      const canAccessAdmin = superAdminUser || userPerms.includes("admin_tools");
      setShowAdminTools(canAccessAdmin);
    }

    void loadAdminAccess();
    return () => {
      active = false;
    };
  }, []);

  function isActive(href: string) {
    if (href === "/billing?type=Security Deposit") {
      return pathname === "/billing" && searchParams.get("type") === "Security Deposit";
    }
    if (href === "/billing") {
      return pathname === "/billing" && searchParams.get("type") !== "Security Deposit";
    }

    const matchesRoute = pathname === href || pathname.startsWith(`${href}/`);

    if (href === "/payments") {
      return matchesRoute ||
        pathname === "/payment-verification" ||
        pathname.startsWith("/payment-verification/");
    }

    return matchesRoute;
  }

  const visibleMenuItems = menuItems.filter((item) => {
    if (allowedPermissionIds === null) return true;
    if (isSuper) return true;
    return allowedPermissionIds.includes(item.permissionId);
  });

  return (
    <aside className="flex min-h-screen w-72 shrink-0 flex-col bg-slate-900 p-6 text-slate-100 dark:bg-slate-950">
      <Link
        href="/dashboard"
        className="block rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
      >
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Logo" className="w-12 h-12 rounded-full object-cover bg-white" />
          <h1 className="text-xl font-bold text-blue-400 leading-tight">University Girls<br/>Hostel</h1>
        </div>
      </Link>

      <nav className="mt-10 space-y-2">
        {visibleMenuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-lg p-3 transition ${
              isActive(item.href)
                ? "bg-blue-600 text-white"
                : "text-slate-200 hover:bg-slate-800 hover:text-white dark:hover:bg-slate-900"
            }`}
          >
            {item.name}
          </Link>
        ))}
        {showAdminTools && (
          <Link
            href="/dashboard/settings/data-management"
            className={`flex items-center gap-3 rounded-lg p-3 transition ${
              isActive("/dashboard/settings/data-management")
                ? "bg-blue-600 text-white"
                : "text-slate-200 hover:bg-slate-800 hover:text-white dark:hover:bg-slate-900"
            }`}
          >
            <AdminToolsIcon />
            <span>Admin Tools</span>
          </Link>
        )}
      </nav>
    </aside>
  );
}

export default function Sidebar() {
  return (
    <Suspense fallback={<aside className="flex min-h-screen w-72 shrink-0 flex-col bg-slate-900 p-6 text-slate-100 dark:bg-slate-950" />}>
      <SidebarContent />
    </Suspense>
  );
}

function AdminToolsIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="M9 12h6M12 9v6" />
    </svg>
  );
}
