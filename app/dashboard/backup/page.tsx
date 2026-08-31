"use client";

import { useState } from "react";

type BackupRecord = {
  id: number;
  name: string;
  date: string;
  size: string;
  status: string;
};

export default function BackupPage() {

  const [backups] = useState<BackupRecord[]>([
    {
      id: 1,
      name: "Daily Backup",
      date: "Today",
      size: "45 MB",
      status: "Completed",
    },
    {
      id: 2,
      name: "Weekly Backup",
      date: "Yesterday",
      size: "310 MB",
      status: "Completed",
    },
    {
      id: 3,
      name: "Monthly Backup",
      date: "25 Jul 2026",
      size: "1.2 GB",
      status: "Completed",
    },
    {
      id: 4,
      name: "Manual Backup",
      date: "20 Jul 2026",
      size: "520 MB",
      status: "Completed",
    },
  ]);

  return (

    <main className="min-h-screen bg-slate-50 p-6">

      <div className="mx-auto max-w-7xl space-y-6">

        <div className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8 text-white shadow-xl">

          <h1 className="text-3xl font-bold">
            Backup & Restore
          </h1>

          <p className="mt-2 text-emerald-100">
            Secure your University Girls Hostel data by creating and managing
            system backups.
          </p>

        </div>

        <div className="grid gap-6 md:grid-cols-4">

          <div className="rounded-2xl border bg-white p-6 shadow-sm">

            <p className="text-sm text-slate-500">
              Total Backups
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {backups.length}
            </h2>

          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">

            <p className="text-sm text-slate-500">
              Successful
            </p>

            <h2 className="mt-2 text-3xl font-bold text-green-600">
              {
                backups.filter(
                  (item) => item.status === "Completed"
                ).length
              }
            </h2>

          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">

            <p className="text-sm text-slate-500">
              Latest Backup
            </p>

            <h2 className="mt-2 text-xl font-bold text-blue-600">
              Today
            </h2>

          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">

            <p className="text-sm text-slate-500">
              System Status
            </p>

            <h2 className="mt-2 text-xl font-bold text-emerald-600">
              Protected
            </h2>

          </div>

        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-2xl font-bold text-slate-900">
                Backup History
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                View and manage all available system backups.
              </p>

            </div>

            <button
              type="button"
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Create Backup
            </button>

          </div>

          <div className="space-y-4">

            {backups.map((backup) => (

              <div
                key={backup.id}
                className="rounded-2xl border border-slate-200 p-5 transition hover:border-emerald-300 hover:bg-emerald-50"
              >

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                  <div className="flex-1">

                    <div className="flex flex-wrap items-center gap-3">

                      <h3 className="text-lg font-bold text-slate-900">
                        {backup.name}
                      </h3>

                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {backup.status}
                      </span>

                    </div>

                    <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-600">

                      <span>
                        Date:
                        <strong className="ml-1 text-slate-800">
                          {backup.date}
                        </strong>
                      </span>

                      <span>
                        Size:
                        <strong className="ml-1 text-slate-800">
                          {backup.size}
                        </strong>
                      </span>

                    </div>

                  </div>

                  <div className="flex flex-wrap gap-3">

                    <button
                      type="button"
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-100"
                    >
                      Restore
                    </button>

                    <button
                      type="button"
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Download
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        </div>
        <div className="grid gap-6 lg:grid-cols-2">

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-xl font-bold text-slate-900">
              Backup Summary
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Overview of stored backup files.
            </p>

            <div className="mt-6 space-y-4">

              <div className="flex items-center justify-between rounded-2xl bg-emerald-50 p-4">

                <span className="font-medium text-emerald-700">
                  Total Backups
                </span>

                <span className="text-xl font-bold text-emerald-700">
                  {backups.length}
                </span>

              </div>

              <div className="flex items-center justify-between rounded-2xl bg-blue-50 p-4">

                <span className="font-medium text-blue-700">
                  Latest Backup
                </span>

                <span className="text-lg font-bold text-blue-700">
                  Today
                </span>

              </div>

              <div className="flex items-center justify-between rounded-2xl bg-amber-50 p-4">

                <span className="font-medium text-amber-700">
                  Successful Backups
                </span>

                <span className="text-xl font-bold text-amber-700">
                  {
                    backups.filter(
                      (backup) => backup.status === "Completed"
                    ).length
                  }
                </span>

              </div>

            </div>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-xl font-bold text-slate-900">
              Backup Schedule
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Recommended backup routine.
            </p>

            <div className="mt-6 space-y-4">

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Daily Backup
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Create a backup every day to protect recent changes.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Weekly Backup
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Keep a weekly backup for long-term recovery.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Monthly Backup
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Archive a monthly backup for permanent records.
                </p>

              </div>

            </div>

          </div>

        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Backup Controls
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Manage backup creation, restore options and system protection.
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <button
                type="button"
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Refresh Backups
              </button>

              <button
                type="button"
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Create New Backup
              </button>

            </div>

          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">

              <h3 className="font-semibold text-blue-900">
                Create Backup
              </h3>

              <p className="mt-2 text-sm leading-6 text-blue-800">
                Generate a complete backup before making important system
                changes.
              </p>

            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">

              <h3 className="font-semibold text-emerald-900">
                Restore Data
              </h3>

              <p className="mt-2 text-sm leading-6 text-emerald-800">
                Restore the system from a selected backup when recovery is
                required.
              </p>

            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">

              <h3 className="font-semibold text-amber-900">
                Download Backup
              </h3>

              <p className="mt-2 text-sm leading-6 text-amber-800">
                Download backup files and keep an additional secure copy
                outside the system.
              </p>

            </div>

          </div>

        </div>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-6">

          <h2 className="text-xl font-bold text-red-900">
            Restore Warning
          </h2>

          <p className="mt-3 text-sm leading-6 text-red-800">
            Restoring a backup may replace current system data. Always create
            a fresh backup before starting the restore process.
          </p>

        </div>
      </div>

    </main>

  );
}