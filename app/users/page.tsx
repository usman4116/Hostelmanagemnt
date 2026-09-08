"use client";

import StaffUserManager from "@/components/admin/StaffUserManager";

export default function UsersPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
              Hostel Management System
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              Staff & User Access Control
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage staff accounts, credentials for /admin123, and granular sidebar module permissions.
            </p>
          </div>
        </section>

        <StaffUserManager />
      </div>
    </main>
  );
}
