"use client";

import { useState } from "react";

type Activity = {
  id: number;
  title: string;
  description: string;
  module: string;
  user: string;
  date: string;
};

export default function ActivityPage() {

  const [activities] = useState<Activity[]>([
    {
      id: 1,
      title: "Resident Added",
      description: "A new resident has been added successfully.",
      module: "Residents",
      user: "Admin",
      date: "Today",
    },
    {
      id: 2,
      title: "Monthly Bill Generated",
      description: "Monthly billing completed successfully.",
      module: "Billing",
      user: "Admin",
      date: "Today",
    },
    {
      id: 3,
      title: "Payment Verified",
      description: "Resident payment has been verified.",
      module: "Payments",
      user: "Manager",
      date: "Yesterday",
    },
    {
      id: 4,
      title: "Maintenance Completed",
      description: "Room maintenance request completed.",
      module: "Maintenance",
      user: "Staff",
      date: "Yesterday",
    },
    {
      id: 5,
      title: "Inspection Finished",
      description: "Room inspection record updated.",
      module: "Inspection",
      user: "Admin",
      date: "2 Days Ago",
    },
  ]);

  return (

    <main className="min-h-screen bg-slate-50 p-6">

      <div className="mx-auto max-w-7xl space-y-6">

        <div className="rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-8 text-white shadow-xl">

          <h1 className="text-3xl font-bold">
            Activity Log
          </h1>

          <p className="mt-2 text-violet-100">
            Track every important action performed inside University Girls Hostel.
          </p>

        </div>

        <div className="grid gap-6 md:grid-cols-4">

          <div className="rounded-2xl border bg-white p-6 shadow-sm">

            <p className="text-sm text-slate-500">
              Total Activities
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {activities.length}
            </h2>

          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">

            <p className="text-sm text-slate-500">
              Today&apos;s Activities
            </p>

            <h2 className="mt-2 text-3xl font-bold text-blue-600">
              {
                activities.filter(
                  (item) => item.date === "Today"
                ).length
              }
            </h2>

          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">

            <p className="text-sm text-slate-500">
              Admin Actions
            </p>

            <h2 className="mt-2 text-3xl font-bold text-green-600">
              {
                activities.filter(
                  (item) => item.user === "Admin"
                ).length
              }
            </h2>

          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">

            <p className="text-sm text-slate-500">
              Active Modules
            </p>

            <h2 className="mt-2 text-3xl font-bold text-purple-600">
              5
            </h2>

          </div>

        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-2xl font-bold text-slate-900">
                Recent Activities
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Latest actions performed across all University Girls Hostel modules.
              </p>

            </div>

            <button
              type="button"
              className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              Export Activity Log
            </button>

          </div>

          <div className="space-y-4">

            {activities.map((activity) => (

              <div
                key={activity.id}
                className="rounded-2xl border border-slate-200 p-5 transition hover:border-violet-300 hover:bg-violet-50"
              >

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                  <div className="flex-1">

                    <div className="flex flex-wrap items-center gap-3">

                      <h3 className="text-lg font-bold text-slate-900">
                        {activity.title}
                      </h3>

                      <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                        {activity.module}
                      </span>

                    </div>

                    <p className="mt-3 text-slate-600">
                      {activity.description}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-slate-500">

                      <span>
                        User:
                        <strong className="ml-1 text-slate-800">
                          {activity.user}
                        </strong>
                      </span>

                      <span>
                        Date:
                        <strong className="ml-1 text-slate-800">
                          {activity.date}
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
                      className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
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
              Module Activity
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Activity summary for each University Girls Hostel module.
            </p>

            <div className="mt-6 space-y-4">

              {[
                "Residents",
                "Billing",
                "Payments",
                "Maintenance",
                "Inspection",
              ].map((module) => {

                const total = activities.filter(
                  (activity) => activity.module === module
                ).length;

                return (
                  <div
                    key={module}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"
                  >

                    <span className="font-semibold text-slate-700">
                      {module}
                    </span>

                    <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-bold text-violet-700">
                      {total}
                    </span>

                  </div>
                );

              })}

            </div>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-xl font-bold text-slate-900">
              User Activity
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Actions performed by different users.
            </p>

            <div className="mt-6 space-y-5">

              <div className="flex items-center justify-between rounded-2xl bg-blue-50 p-4">

                <span className="font-medium text-blue-700">
                  Admin
                </span>

                <span className="text-xl font-bold text-blue-700">
                  {
                    activities.filter(
                      (activity) => activity.user === "Admin"
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
                    activities.filter(
                      (activity) => activity.user === "Manager"
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
                    activities.filter(
                      (activity) => activity.user === "Staff"
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
                Activity Controls
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Manage and review system activity records.
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <button
                type="button"
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Refresh Log
              </button>

              <button
                type="button"
                className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                Download Report
              </button>

            </div>

          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">

              <h3 className="font-semibold text-blue-900">
                Daily Review
              </h3>

              <p className="mt-2 text-sm leading-6 text-blue-800">
                Review recent activities daily to monitor important
                changes across all modules.
              </p>

            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">

              <h3 className="font-semibold text-emerald-900">
                User Tracking
              </h3>

              <p className="mt-2 text-sm leading-6 text-emerald-800">
                Track which administrator, manager or staff member
                performed each action.
              </p>

            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">

              <h3 className="font-semibold text-amber-900">
                Record Safety
              </h3>

              <p className="mt-2 text-sm leading-6 text-amber-800">
                Keep activity records protected for future review
                and management verification.
              </p>

            </div>

          </div>

        </div>

        <div className="rounded-3xl border border-violet-200 bg-violet-50 p-6">

          <h2 className="text-xl font-bold text-violet-900">
            Activity Log Notice
          </h2>

          <p className="mt-3 text-sm leading-6 text-violet-800">
            Activity records help management track important changes,
            user actions and module updates. Sensitive records should
            only be reviewed by authorized users.
          </p>

        </div>
      </div>

    </main>

  );
}
