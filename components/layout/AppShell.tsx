"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import ProfileDropdown from "@/components/layout/ProfileDropdown";
import Sidebar from "@/components/layout/Sidebar";
import { usePermissions } from "@/lib/usePermissions";

const adminRoutes = [
  "/dashboard",
  "/admissions",
  "/residents",
  "/rooms",
  "/beds",
  "/payments",
  "/payment-verification",
  "/billing",
  "/meter-reading",
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
  return (
    pathname === "/dashboard" ||
    pathname === "/rooms/add" ||
    pathname === "/beds/add" ||
    pathname.startsWith("/residents/")
  );
}

function AccessDeniedView() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="m4.93 4.93 14.14 14.14" />
        </svg>
      </div>
      <h2 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
        Access Restricted
      </h2>
      <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
        You do not have permission to access this module. Please contact your system administrator to update your account privileges.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
      >
        Go to Available Modules
      </Link>
    </div>
  );
}

function AppShellContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchType = searchParams.get("type");
  const { canAccess, loading } = usePermissions();

  const isAdminRoute = adminRoutes.some((route) => matchesRoute(pathname, route));

  if (!isAdminRoute || pathname === "/dashboard") {
    return children;
  }

  const isAllowed = loading || canAccess(pathname, searchType);

  return (
    <div className="flex min-h-screen w-full">
      {!hasEmbeddedSidebar(pathname) && <Sidebar />}
      <div className="min-w-0 flex-1">
        <header className="flex min-h-20 items-center justify-end border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
          <ProfileDropdown />
        </header>
        {isAllowed ? children : <AccessDeniedView />}
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AppShellContent>{children}</AppShellContent>
    </Suspense>
  );
}
