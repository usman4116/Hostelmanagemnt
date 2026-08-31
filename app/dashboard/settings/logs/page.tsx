"use client";

import { useState } from "react";

type Log = {
  id: number;
  title: string;
  count: string;
};

export default function LogsSettingsPage() {
  const [logs] = useState<Log[]>([
    {
      id: 1,
      title: "System Logs",
      count: "245 Records",
    },
    {
      id: 2,
      title: "Login Logs",
      count: "87 Records",
    },
    {
      id: 3,
      title: "Activity Logs",
      count: "412 Records",
    },
    {
      id: 4,
      title: "Error Logs",
      count: "16 Records",
    },
  ]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">

      <div className="mx-auto max-w-7xl space-y-6">

        <div className="rounded-3xl bg-gradient-to-r from-indigo-700 via-violet-700 to-purple-700 p-8 text-white shadow-xl">

          <h1 className="text-3xl font-bold">
            System Logs
          </h1>

          <p className="mt-2 text-indigo-100">
            Monitor system activities, security events and application logs
            for StayHub Hostel Management System.
          </p>

        </div>

        <div className="grid gap-6 md:grid-cols-4">

          {logs.map((item) => (

            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >

              <p className="text-sm text-slate-500">
                {item.title}
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-900">
                {item.count}
              </h2>

            </div>

          ))}

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-2xl font-bold text-slate-900">
                Log Management
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review and manage system logs for monitoring and auditing.
              </p>

            </div>

            <button
              type="button"
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Export Logs
            </button>

          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">

            {logs.map((item) => (

              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 p-5 transition hover:border-indigo-300 hover:bg-indigo-50"
              >

                <div className="flex items-center justify-between">

                  <div>

                    <h3 className="text-lg font-bold text-slate-900">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-slate-600">
                      {item.count}
                    </p>

                  </div>

                  <button
                    type="button"
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-100"
                  >
                    View
                  </button>

                </div>

              </div>

            ))}

          </div>

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold text-slate-900">
            Log Categories
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Enable or disable logging for different system activities.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">

            {[
              "Authentication Logs",
              "Resident Activity",
              "Billing Events",
              "Database Changes",
              "Security Alerts",
              "System Errors",
            ].map((item) => (

              <label
                key={item}
                className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"
              >

                <span className="font-medium text-slate-700">
                  {item}
                </span>

                <input
                  type="checkbox"
                  defaultChecked
                  className="h-5 w-5"
                />

              </label>

            ))}

          </div>

        </div>
        <div className="grid gap-6 lg:grid-cols-2">

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-xl font-bold text-slate-900">
              Log Summary
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Overview of system logging activity across StayHub.
            </p>

            <div className="mt-6 space-y-4">

              <div className="flex items-center justify-between rounded-2xl bg-indigo-50 p-4">

                <span className="font-medium text-indigo-700">
                  Total Logs
                </span>

                <span className="font-bold text-indigo-700">
                  760
                </span>

              </div>

              <div className="flex items-center justify-between rounded-2xl bg-green-50 p-4">

                <span className="font-medium text-green-700">
                  Successful Events
                </span>

                <span className="font-bold text-green-700">
                  744
                </span>

              </div>

              <div className="flex items-center justify-between rounded-2xl bg-red-50 p-4">

                <span className="font-medium text-red-700">
                  Error Events
                </span>

                <span className="font-bold text-red-700">
                  16
                </span>

              </div>

            </div>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-xl font-bold text-slate-900">
              Log Features
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Logging helps maintain security, compliance and troubleshooting.
            </p>

            <div className="mt-6 space-y-4">

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Audit Trail
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Record important user activities for accountability and
                  compliance.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Error Tracking
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Capture application errors for faster debugging and
                  maintenance.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Security Monitoring
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Monitor suspicious activity and login attempts to improve
                  system security.
                </p>

              </div>

            </div>

          </div>

        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Log Controls
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Manage log retention, monitoring and export options for
                the StayHub system.
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <button
                type="button"
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Clear Logs
              </button>

              <button
                type="button"
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Save Settings
              </button>

            </div>

          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">

            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">

              <h3 className="font-semibold text-indigo-900">
                Monitoring
              </h3>

              <p className="mt-2 text-sm leading-6 text-indigo-800">
                Continuously monitor system activity and detect unusual
                events in real time.
              </p>

            </div>

            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">

              <h3 className="font-semibold text-violet-900">
                Retention Policy
              </h3>

              <p className="mt-2 text-sm leading-6 text-violet-800">
                Automatically retain logs according to your configured
                retention period.
              </p>

            </div>

            <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5">

              <h3 className="font-semibold text-purple-900">
                Export & Backup
              </h3>

              <p className="mt-2 text-sm leading-6 text-purple-800">
                Export logs for auditing and keep secure backups for future
                reference.
              </p>

            </div>

          </div>

        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">

          <h2 className="text-xl font-bold text-amber-900">
            Important Notice
          </h2>

          <p className="mt-3 text-sm leading-6 text-amber-800">
            System logs may contain sensitive operational information.
            Access should be restricted to authorized administrators only.
          </p>

        </div>
      </div>

    </main>

  );
}
