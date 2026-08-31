"use client";

import { useState } from "react";

type DatabaseInfo = {
  id: number;
  title: string;
  value: string;
};

export default function DatabaseSettingsPage() {

  const [database] = useState<DatabaseInfo[]>([
    {
      id: 1,
      title: "Database",
      value: "Supabase PostgreSQL",
    },
    {
      id: 2,
      title: "Environment",
      value: "Production",
    },
    {
      id: 3,
      title: "Connection",
      value: "Connected",
    },
    {
      id: 4,
      title: "Last Backup",
      value: "Today",
    },
  ]);

  return (

    <main className="min-h-screen bg-slate-50 p-6">

      <div className="mx-auto max-w-7xl space-y-6">

        <div className="rounded-3xl bg-gradient-to-r from-cyan-700 via-sky-700 to-blue-700 p-8 text-white shadow-xl">

          <h1 className="text-3xl font-bold">
            Database Settings
          </h1>

          <p className="mt-2 text-cyan-100">
            Monitor database status, connection and backup information
            for your University Girls Hostel system.
          </p>

        </div>

        <div className="grid gap-6 md:grid-cols-4">

          {database.map((item) => (

            <div
              key={item.id}
              className="rounded-2xl border bg-white p-6 shadow-sm"
            >

              <p className="text-sm text-slate-500">
                {item.title}
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-900">
                {item.value}
              </h2>

            </div>

          ))}

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-2xl font-bold text-slate-900">
                Database Overview
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current database connection and health information.
              </p>

            </div>

            <button
              type="button"
              className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
            >
              Test Connection
            </button>

          </div>
          <div className="mt-6 space-y-4">

            {database.map((item) => (

              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 p-5 transition hover:border-cyan-300 hover:bg-cyan-50"
              >

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                  <div className="flex-1">

                    <h3 className="text-lg font-bold text-slate-900">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-slate-600">
                      {item.value}
                    </p>

                  </div>

                  <div className="flex gap-3">

                    <button
                      type="button"
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-100"
                    >
                      View
                    </button>

                    <button
                      type="button"
                      className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
                    >
                      Check
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
              Database Summary
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Current database status and system information.
            </p>

            <div className="mt-6 space-y-4">

              <div className="flex items-center justify-between rounded-2xl bg-cyan-50 p-4">

                <span className="font-medium text-cyan-700">
                  Database
                </span>

                <span className="font-bold text-cyan-700">
                  Supabase PostgreSQL
                </span>

              </div>

              <div className="flex items-center justify-between rounded-2xl bg-emerald-50 p-4">

                <span className="font-medium text-emerald-700">
                  Connection
                </span>

                <span className="font-bold text-emerald-700">
                  Connected
                </span>

              </div>

              <div className="flex items-center justify-between rounded-2xl bg-blue-50 p-4">

                <span className="font-medium text-blue-700">
                  Environment
                </span>

                <span className="font-bold text-blue-700">
                  Production
                </span>

              </div>

            </div>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-xl font-bold text-slate-900">
              Database Services
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Important services available for your database.
            </p>

            <div className="mt-6 space-y-4">

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Automatic Backup
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Daily backups help protect hostel data automatically.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Connection Monitoring
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Monitor database availability and response time.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Security Protection
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Database access is secured using authentication rules.
                </p>

              </div>

            </div>

          </div>

        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Database Controls
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Manage connection health, backups and database maintenance.
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <button
                type="button"
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Refresh Status
              </button>

              <button
                type="button"
                className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
              >
                Save Settings
              </button>

            </div>

          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">

            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5">

              <h3 className="font-semibold text-cyan-900">
                Connection Test
              </h3>

              <p className="mt-2 text-sm leading-6 text-cyan-800">
                Verify that the database connection is active and responding
                correctly.
              </p>

            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">

              <h3 className="font-semibold text-emerald-900">
                Backup Verification
              </h3>

              <p className="mt-2 text-sm leading-6 text-emerald-800">
                Confirm that scheduled backups are running successfully and
                can be restored when required.
              </p>

            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">

              <h3 className="font-semibold text-amber-900">
                Maintenance
              </h3>

              <p className="mt-2 text-sm leading-6 text-amber-800">
                Perform database maintenance during low-traffic hours to
                ensure optimal performance.
              </p>

            </div>

          </div>

        </div>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-6">

          <h2 className="text-xl font-bold text-red-900">
            Important Notice
          </h2>

          <p className="mt-3 text-sm leading-6 text-red-800">
            Database configuration changes should only be performed by
            authorized administrators. Always verify backups before making
            major changes.
          </p>

        </div>
      </div>

    </main>

  );
}