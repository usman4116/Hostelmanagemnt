"use client";

import { useState } from "react";

type AuditRecord = {
  id: number;
  action: string;
  module: string;
  user: string;
  date: string;
  status: string;
};

export default function AuditPage() {

  const [records] = useState<AuditRecord[]>([
    {
      id: 1,
      action: "Resident Created",
      module: "Residents",
      user: "Admin",
      date: "Today",
      status: "Success",
    },
    {
      id: 2,
      action: "Payment Verified",
      module: "Payments",
      user: "Manager",
      date: "Today",
      status: "Success",
    },
    {
      id: 3,
      action: "Bill Generated",
      module: "Billing",
      user: "Admin",
      date: "Yesterday",
      status: "Success",
    },
    {
      id: 4,
      action: "Room Updated",
      module: "Rooms",
      user: "Staff",
      date: "Yesterday",
      status: "Success",
    },
    {
      id: 5,
      action: "Maintenance Closed",
      module: "Maintenance",
      user: "Admin",
      date: "2 Days Ago",
      status: "Success",
    },
  ]);

  return (

    <main className="min-h-screen bg-slate-50 p-6">

      <div className="mx-auto max-w-7xl space-y-6">

        <div className="rounded-3xl bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 p-8 text-white shadow-xl">

          <h1 className="text-3xl font-bold">
            Audit Log
          </h1>

          <p className="mt-2 text-slate-300">
            Track every important action performed inside University Girls Hostel
            for transparency and security.
          </p>

        </div>

        <div className="grid gap-6 md:grid-cols-4">

          <div className="rounded-2xl border bg-white p-6 shadow-sm">

            <p className="text-sm text-slate-500">
              Total Records
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {records.length}
            </h2>

          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">

            <p className="text-sm text-slate-500">
              Successful
            </p>

            <h2 className="mt-2 text-3xl font-bold text-green-600">
              {
                records.filter(
                  (item) => item.status === "Success"
                ).length
              }
            </h2>

          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">

            <p className="text-sm text-slate-500">
              Today&apos;s Logs
            </p>

            <h2 className="mt-2 text-3xl font-bold text-blue-600">
              {
                records.filter(
                  (item) => item.date === "Today"
                ).length
              }
            </h2>

          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">

            <p className="text-sm text-slate-500">
              Security
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
                Audit Records
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review all system actions performed by administrators,
                managers and staff.
              </p>

            </div>

            <button
              type="button"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-black"
            >
              Export Audit Log
            </button>

          </div>

          <div className="space-y-4">

            {records.map((record) => (

              <div
                key={record.id}
                className="rounded-2xl border border-slate-200 p-5 transition hover:border-slate-400 hover:bg-slate-50"
              >

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                  <div className="flex-1">

                    <div className="flex flex-wrap items-center gap-3">

                      <h3 className="text-lg font-bold text-slate-900">
                        {record.action}
                      </h3>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {record.module}
                      </span>

                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        {record.status}
                      </span>

                    </div>

                    <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-600">

                      <span>
                        User:
                        <strong className="ml-1 text-slate-800">
                          {record.user}
                        </strong>
                      </span>

                      <span>
                        Date:
                        <strong className="ml-1 text-slate-800">
                          {record.date}
                        </strong>
                      </span>

                    </div>

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
                      className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
                    >
                      Details
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
              Module Summary
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Audit records grouped by University Girls Hostel modules.
            </p>

            <div className="mt-6 space-y-4">

              {[
                "Residents",
                "Payments",
                "Billing",
                "Rooms",
                "Maintenance",
              ].map((module) => {

                const total = records.filter(
                  (record) => record.module === module
                ).length;

                return (

                  <div
                    key={module}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"
                  >

                    <span className="font-semibold text-slate-700">
                      {module}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                      {total}
                    </span>

                  </div>

                );

              })}

            </div>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-xl font-bold text-slate-900">
              User Summary
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Actions performed by different system users.
            </p>

            <div className="mt-6 space-y-5">

              <div className="flex items-center justify-between rounded-2xl bg-blue-50 p-4">

                <span className="font-medium text-blue-700">
                  Admin
                </span>

                <span className="text-xl font-bold text-blue-700">
                  {
                    records.filter(
                      (record) => record.user === "Admin"
                    ).length
                  }
                </span>

              </div>

              <div className="flex items-center justify-between rounded-2xl bg-emerald-50 p-4">

                <span className="font-medium text-emerald-700">
                  Manager
                </span>

                <span className="text-xl font-bold text-emerald-700">
                  {
                    records.filter(
                      (record) => record.user === "Manager"
                    ).length
                  }
                </span>

              </div>

              <div className="flex items-center justify-between rounded-2xl bg-amber-50 p-4">

                <span className="font-medium text-amber-700">
                  Staff
                </span>

                <span className="text-xl font-bold text-amber-700">
                  {
                    records.filter(
                      (record) => record.user === "Staff"
                    ).length
                  }
                </span>

              </div>

            </div>

          </div>

        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Audit Controls
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Manage audit logs and maintain a complete history of system activities.
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <button
                type="button"
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Refresh Logs
              </button>

              <button
                type="button"
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-black"
              >
                Download Report
              </button>

            </div>

          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">

              <h3 className="font-semibold text-blue-900">
                Full Tracking
              </h3>

              <p className="mt-2 text-sm leading-6 text-blue-800">
                Every important system action is recorded automatically for
                future review.
              </p>

            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">

              <h3 className="font-semibold text-emerald-900">
                User Verification
              </h3>

              <p className="mt-2 text-sm leading-6 text-emerald-800">
                Identify which administrator, manager or staff member
                performed each activity.
              </p>

            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">

              <h3 className="font-semibold text-amber-900">
                Secure Records
              </h3>

              <p className="mt-2 text-sm leading-6 text-amber-800">
                Keep audit records protected to support management reviews
                and compliance.
              </p>

            </div>

          </div>

        </div>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-6">

          <h2 className="text-xl font-bold text-red-900">
            Audit Notice
          </h2>

          <p className="mt-3 text-sm leading-6 text-red-800">
            Audit logs should only be accessed by authorized users. These
            records provide an accurate history of actions performed across
            the University Girls Hostel system.
          </p>

        </div>
      </div>

    </main>

  );
}
