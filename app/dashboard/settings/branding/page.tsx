"use client";

import { useState } from "react";

type BrandingSetting = {
  id: number;
  title: string;
  value: string;
};

export default function BrandingSettingsPage() {
  const [branding] = useState<BrandingSetting[]>([
    {
      id: 1,
      title: "Brand Name",
      value: "University Girls Hostel",
    },
    {
      id: 2,
      title: "Tagline",
      value: "Hostel Management",
    },
    {
      id: 3,
      title: "Primary Color",
      value: "Indigo",
    },
    {
      id: 4,
      title: "Logo Status",
      value: "Active",
    },
  ]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">

      <div className="mx-auto max-w-7xl space-y-6">

        <div className="rounded-3xl bg-gradient-to-r from-fuchsia-700 via-purple-700 to-indigo-700 p-8 text-white shadow-xl">

          <h1 className="text-3xl font-bold">
            Branding Settings
          </h1>

          <p className="mt-2 text-purple-100">
            Manage the University Girls Hostel name, logo, colors and visual identity
            across the system.
          </p>

        </div>

        <div className="grid gap-6 md:grid-cols-4">

          {branding.map((item) => (

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
                Brand Configuration
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review and update the visual identity of University Girls Hostel.
              </p>

            </div>

            <button
              type="button"
              className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              Upload Logo
            </button>

          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">

            {branding.map((item) => (

              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 p-5 transition hover:border-purple-300 hover:bg-purple-50"
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
                    Edit
                  </button>

                </div>

              </div>

            ))}

          </div>

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold text-slate-900">
            Branding Options
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Customize how University Girls Hostel appears throughout the application.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">

            {[
              "Display Brand Logo",
              "Show Hostel Tagline",
              "Use Primary Brand Color",
              "Enable Custom Login Branding",
              "Dashboard Branding",
              "Report Branding",
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
              Branding Summary
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Current branding configuration used throughout the University Girls Hostel
              application.
            </p>

            <div className="mt-6 space-y-4">

              <div className="flex items-center justify-between rounded-2xl bg-purple-50 p-4">

                <span className="font-medium text-purple-700">
                  Brand Name
                </span>

                <span className="font-bold text-purple-700">
                  University Girls Hostel
                </span>

              </div>

              <div className="flex items-center justify-between rounded-2xl bg-indigo-50 p-4">

                <span className="font-medium text-indigo-700">
                  Tagline
                </span>

                <span className="font-bold text-indigo-700">
                  Hostel Management
                </span>

              </div>

              <div className="flex items-center justify-between rounded-2xl bg-fuchsia-50 p-4">

                <span className="font-medium text-fuchsia-700">
                  Theme Color
                </span>

                <span className="font-bold text-fuchsia-700">
                  Indigo
                </span>

              </div>

            </div>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-xl font-bold text-slate-900">
              Branding Features
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Features available for customizing the University Girls Hostel identity.
            </p>

            <div className="mt-6 space-y-4">

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Logo Management
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Upload and update the official University Girls Hostel logo used across
                  dashboards and reports.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Theme Customization
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Apply consistent colors and branding throughout the
                  application interface.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Professional Appearance
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Maintain a consistent visual identity across reports,
                  notifications and login screens.
                </p>

              </div>

            </div>

          </div>

        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Branding Controls
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Manage logo, colors, themes and branding preferences for
                the University Girls Hostel application.
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <button
                type="button"
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Preview Theme
              </button>

              <button
                type="button"
                className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
              >
                Save Branding
              </button>

            </div>

          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">

            <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5">

              <h3 className="font-semibold text-purple-900">
                Logo Preview
              </h3>

              <p className="mt-2 text-sm leading-6 text-purple-800">
                Review the uploaded logo before applying branding changes
                throughout the system.
              </p>

            </div>

            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">

              <h3 className="font-semibold text-indigo-900">
                Theme Consistency
              </h3>

              <p className="mt-2 text-sm leading-6 text-indigo-800">
                Apply consistent colors and fonts across dashboards,
                reports and resident portals.
              </p>

            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">

              <h3 className="font-semibold text-amber-900">
                Brand Identity
              </h3>

              <p className="mt-2 text-sm leading-6 text-amber-800">
                Maintain a professional and recognizable visual identity
                for your hostel management system.
              </p>

            </div>

          </div>

        </div>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-6">

          <h2 className="text-xl font-bold text-red-900">
            Important Notice
          </h2>

          <p className="mt-3 text-sm leading-6 text-red-800">
            Branding updates will affect the login screen, dashboard,
            reports and printable documents. Review all changes before
            saving them.
          </p>

        </div>
      </div>

    </main>

  );
}