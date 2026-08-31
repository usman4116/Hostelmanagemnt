"use client";

import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import ProfileDropdown from "@/components/layout/ProfileDropdown";
import Sidebar from "@/components/layout/Sidebar";

const adminRoutes = [
  "/dashboard",
  "/admissions",
  "/residents",
  "/rooms",
  "/beds",
  "/payments",
  "/payment-verification",
  "/billing",
  "/contracts",
  "/contract-template",
  "/inspection",
  "/maintenance",
  "/notices",
  "/reports",
  "/settings",
  "/users",
  "/profile",
];

function matchesRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function hasEmbeddedSidebar(pathname: string) {
  return pathname === "/dashboard" ||
    pathname === "/rooms/add" ||
    pathname === "/beds/add" ||
    pathname.startsWith("/residents/");
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = adminRoutes.some((route) => matchesRoute(pathname, route));

  if (!isAdminRoute || pathname === "/dashboard") {
    return children;
  }

  return (
    <div className="flex min-h-screen w-full">
      {!hasEmbeddedSidebar(pathname) && <Sidebar />}
      <div className="min-w-0 flex-1">
        <header className="flex min-h-20 items-center justify-end border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8 dark:border-slate-700 dark:bg-slate-900">
          <ProfileDropdown />
        </header>
        {children}
      </div>
    </div>
  );
}
