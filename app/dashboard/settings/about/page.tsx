"use client";

import { useState } from "react";

type AboutInfo = {
  id: number;
  title: string;
  value: string;
};

export default function AboutSettingsPage() {
  const [details] = useState<AboutInfo[]>([
    {
      id: 1,
      title: "Application",
      value: "StayHub",
    },
    {
      id: 2,
      title: "Version",
      value: "1.0.0",
    },
    {
      id: 3,
      title: "License",
      value: "Commercial",
    },
    {
      id: 4,
      title: "Environment",
      value: "Production",
    },
  ]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">

      <div className="mx-auto max-w-7xl space-y-6">

        <div className="rounded-3xl bg-gradient-to-r from-emerald-700 via-green-700 to-teal-700 p-8 text-white shadow-xl">

          <h1 className="text-3xl font-bold">
            About StayHub
          </h1>

          <p className="mt-2 text-emerald-100">
            Application information, version details and system overview
            for the StayHub Hostel Management System.
          </p>

        </div>

        <div className="grid gap-6 md:grid-cols-4">

          {details.map((item) => (

            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
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
                Application Details
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                View software information and release details for StayHub.
              </p>

            </div>

            <button
              type="button"
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Check Updates
            </button>

          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">

            {details.map((item) => (

              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 p-5 transition hover:border-emerald-300 hover:bg-emerald-50"
              >

                <div className="flex items-center justify-between">

                  <div>

                    <h3 className="text-lg font-bold text-slate-900">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-slate-600">
                      {item.value}
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
            Application Information
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            General information about the StayHub platform and software.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">

            {[
              "Application Version",
              "Release Notes",
              "System Requirements",
              "Database Version",
              "Framework Details",
              "Support Information",
            ].map((item) => (

              <div
                key={item}
                className="rounded-2xl border border-slate-200 p-4"
              >

                <h3 className="font-medium text-slate-700">
                  {item}
                </h3>

              </div>

            ))}

          </div>

        </div>
        <div className="grid gap-6 lg:grid-cols-2">

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-xl font-bold text-slate-900">
              System Overview
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Current information about the StayHub application.
            </p>

            <div className="mt-6 space-y-4">

              <div className="flex items-center justify-between rounded-2xl bg-emerald-50 p-4">

                <span className="font-medium text-emerald-700">
                  Current Version
                </span>

                <span className="font-bold text-emerald-700">
                  v1.0.0
                </span>

              </div>

              <div className="flex items-center justify-between rounded-2xl bg-green-50 p-4">

                <span className="font-medium text-green-700">
                  Build Status
                </span>

                <span className="font-bold text-green-700">
                  Stable
                </span>

              </div>

              <div className="flex items-center justify-between rounded-2xl bg-teal-50 p-4">

                <span className="font-medium text-teal-700">
                  Environment
                </span>

                <span className="font-bold text-teal-700">
                  Production
                </span>

              </div>

            </div>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-xl font-bold text-slate-900">
              Application Features
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Core capabilities available in StayHub.
            </p>

            <div className="mt-6 space-y-4">

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Resident Management
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Manage admissions, resident records and hostel occupancy
                  from a single dashboard.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Billing & Payments
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Track invoices, payments and financial records securely.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Reports & Analytics
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Generate reports and monitor hostel performance with
                  detailed insights.
                </p>

              </div>

            </div>

          </div>

        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                About Controls
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Review application details, version information and update
                status for StayHub.
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <button
                type="button"
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                View License
              </button>

              <button
                type="button"
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Check Updates
              </button>

            </div>

          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">

              <h3 className="font-semibold text-emerald-900">
                Version History
              </h3>

              <p className="mt-2 text-sm leading-6 text-emerald-800">
                Review previous releases and software improvements made to
                the StayHub platform.
              </p>

            </div>

            <div className="rounded-2xl border border-green-200 bg-green-50 p-5">

              <h3 className="font-semibold text-green-900">
                Documentation
              </h3>

              <p className="mt-2 text-sm leading-6 text-green-800">
                Access user guides, technical documentation and system
                references.
              </p>

            </div>

            <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5">

              <h3 className="font-semibold text-teal-900">
                Support
              </h3>

              <p className="mt-2 text-sm leading-6 text-teal-800">
                Contact the administrator or support team for technical
                assistance and troubleshooting.
              </p>

            </div>

          </div>

        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">

          <h2 className="text-xl font-bold text-amber-900">
            Important Notice
          </h2>

          <p className="mt-3 text-sm leading-6 text-amber-800">
            Always keep StayHub updated to the latest stable version for
            improved security, performance and new features.
          </p>

        </div>
      </div>

    </main>

  );
}