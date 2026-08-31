"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { isActiveAdmin } from "@/lib/adminRoles";
import { supabase } from "@/lib/supabase";

const menuItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Admissions", href: "/admissions" },
  { name: "Residents", href: "/residents" },
  { name: "Rooms", href: "/rooms" },
  { name: "Beds", href: "/beds" },
  { name: "Payments", href: "/payments" },
  { name: "Rent Bills", href: "/billing?type=Rent" },
  { name: "Security Deposits", href: "/billing?type=Security Deposit" },
  { name: "Contracts", href: "/contracts" },
  { name: "Inspections", href: "/inspection" },
  { name: "Maintenance", href: "/maintenance" },
  { name: "Notices", href: "/notices" },
  { name: "Reports", href: "/reports" },
  { name: "Settings", href: "/settings" },
];

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showAdminTools, setShowAdminTools] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadAdminAccess() {
      const { data: authData } = await supabase.auth.getUser();
      const email = authData.user?.email;
      if (!email) return;

      const { data } = await supabase
        .from("staff_users")
        .select("role, status")
        .ilike("email", email)
        .maybeSingle();

      if (active) setShowAdminTools(isActiveAdmin(data?.role, data?.status));
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

  return (
    <aside className="flex min-h-screen w-72 shrink-0 flex-col bg-slate-900 p-6 text-slate-100 dark:bg-slate-950">
      <Link
        href="/dashboard"
        className="block rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
      >
        <h1 className="text-3xl font-bold text-blue-400">StayHub</h1>
        <p className="mt-1 text-sm text-slate-400">Hostel Management System</p>
      </Link>

      <nav className="mt-10 space-y-2">
        {menuItems.map((item) => (
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
