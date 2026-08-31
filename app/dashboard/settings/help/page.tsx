"use client";

import { useState } from "react";

type HelpItem = {
  id: number;
  title: string;
  status: string;
};

export default function HelpSettingsPage() {
  const [helpItems] = useState<HelpItem[]>([
    {
      id: 1,
      title: "Documentation",
      status: "Available",
    },
    {
      id: 2,
      title: "Support Center",
      status: "Online",
    },
    {
      id: 3,
      title: "Video Tutorials",
      status: "Updated",
    },
    {
      id: 4,
      title: "FAQs",
      status: "Available",
    },
  ]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">

      <div className="mx-auto max-w-7xl space-y-6">

        <div className="rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 p-8 text-white shadow-xl">

          <h1 className="text-3xl font-bold">
            Help & Support
          </h1>

          <p className="mt-2 text-orange-100">
            Access documentation, tutorials and support resources for
            University Girls Hostel Hostel Management System.
          </p>

        </div>

        <div className="grid gap-6 md:grid-cols-4">

          {helpItems.map((item) => (

            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >

              <p className="text-sm text-slate-500">
                {item.title}
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-900">
                {item.status}
              </h2>

            </div>

          ))}

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-2xl font-bold text-slate-900">
                Help Center
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Find guides, documentation and support resources for
                using University Girls Hostel efficiently.
              </p>

            </div>

            <button
              type="button"
              className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
            >
              Contact Support
            </button>

          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">

            {helpItems.map((item) => (

              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 p-5 transition hover:border-orange-300 hover:bg-orange-50"
              >

                <div className="flex items-center justify-between">

                  <div>

                    <h3 className="text-lg font-bold text-slate-900">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-slate-600">
                      {item.status}
                    </p>

                  </div>

                  <button
                    type="button"
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-100"
                  >
                    Open
                  </button>

                </div>

              </div>

            ))}

          </div>

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold text-slate-900">
            Help Resources
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Access learning resources and support documentation.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">

            {[
              "Getting Started Guide",
              "User Manual",
              "Video Tutorials",
              "Frequently Asked Questions",
              "Contact Support",
              "Release Notes",
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
              Support Summary
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Quick overview of available support resources.
            </p>

            <div className="mt-6 space-y-4">

              <div className="flex items-center justify-between rounded-2xl bg-orange-50 p-4">

                <span className="font-medium text-orange-700">
                  Documentation
                </span>

                <span className="font-bold text-orange-700">
                  Available
                </span>

              </div>

              <div className="flex items-center justify-between rounded-2xl bg-amber-50 p-4">

                <span className="font-medium text-amber-700">
                  Tutorials
                </span>

                <span className="font-bold text-amber-700">
                  Updated
                </span>

              </div>

              <div className="flex items-center justify-between rounded-2xl bg-yellow-50 p-4">

                <span className="font-medium text-yellow-700">
                  Support Status
                </span>

                <span className="font-bold text-yellow-700">
                  Online
                </span>

              </div>

            </div>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-xl font-bold text-slate-900">
              Support Features
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Learn how University Girls Hostel helps administrators and staff.
            </p>

            <div className="mt-6 space-y-4">

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Knowledge Base
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Browse detailed articles covering every University Girls Hostel feature.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Video Guides
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Watch step-by-step tutorials for daily hostel management.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Technical Support
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Contact support whenever you need assistance with the
                  system or troubleshooting.
                </p>

              </div>

            </div>

          </div>

        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Help Center Controls
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Access support resources, documentation and learning
                materials for University Girls Hostel.
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <button
                type="button"
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                View Documentation
              </button>

              <button
                type="button"
                className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
              >
                Contact Support
              </button>

            </div>

          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">

            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">

              <h3 className="font-semibold text-orange-900">
                Documentation
              </h3>

              <p className="mt-2 text-sm leading-6 text-orange-800">
                Read complete guides covering every module of the University Girls Hostel
                Hostel Management System.
              </p>

            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">

              <h3 className="font-semibold text-amber-900">
                Tutorials
              </h3>

              <p className="mt-2 text-sm leading-6 text-amber-800">
                Learn through step-by-step tutorials designed for new and
                experienced users.
              </p>

            </div>

            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">

              <h3 className="font-semibold text-yellow-900">
                Customer Support
              </h3>

              <p className="mt-2 text-sm leading-6 text-yellow-800">
                Reach the support team for technical guidance, troubleshooting
                and system-related assistance.
              </p>

            </div>

          </div>

        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">

          <h2 className="text-xl font-bold text-amber-900">
            Important Notice
          </h2>

          <p className="mt-3 text-sm leading-6 text-amber-800">
            For the best experience, always refer to the latest documentation
            before changing system settings or performing administrative tasks.
          </p>

        </div>
      </div>

    </main>

  );
}