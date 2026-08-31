"use client";

import { useState } from "react";

type ApiKey = {
  id: number;
  name: string;
  status: string;
};

export default function ApiSettingsPage() {
  const [apiKeys] = useState<ApiKey[]>([
    {
      id: 1,
      name: "Payment Gateway API",
      status: "Active",
    },
    {
      id: 2,
      name: "SMS Service API",
      status: "Active",
    },
    {
      id: 3,
      name: "Email Service API",
      status: "Inactive",
    },
    {
      id: 4,
      name: "Cloud Storage API",
      status: "Active",
    },
  ]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">

      <div className="mx-auto max-w-7xl space-y-6">

        <div className="rounded-3xl bg-gradient-to-r from-cyan-700 via-sky-700 to-blue-700 p-8 text-white shadow-xl">

          <h1 className="text-3xl font-bold">
            API Settings
          </h1>

          <p className="mt-2 text-cyan-100">
            Manage API keys, external services and integrations for
            StayHub Hostel Management System.
          </p>

        </div>

        <div className="grid gap-6 md:grid-cols-4">

          {apiKeys.map((item) => (

            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >

              <p className="text-sm text-slate-500">
                {item.name}
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
                API Configuration
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Configure API credentials and monitor integration status.
              </p>

            </div>

            <button
              type="button"
              className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
            >
              Add API Key
            </button>

          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">

            {apiKeys.map((item) => (

              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 p-5 transition hover:border-cyan-300 hover:bg-cyan-50"
              >

                <div className="flex items-center justify-between">

                  <div>

                    <h3 className="text-lg font-bold text-slate-900">
                      {item.name}
                    </h3>

                    <p
                      className={`mt-2 font-medium ${
                        item.status === "Active"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {item.status}
                    </p>

                  </div>

                  <button
                    type="button"
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-100"
                  >
                    Configure
                  </button>

                </div>

              </div>

            ))}

          </div>

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold text-slate-900">
            Integration Services
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Enable or disable external services connected to StayHub.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">

            {[
              "Payment Gateway",
              "SMS Notifications",
              "Email Service",
              "Cloud Storage",
              "Google Maps",
              "Backup Service",
            ].map((service) => (

              <label
                key={service}
                className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"
              >

                <span className="font-medium text-slate-700">
                  {service}
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
              API Security
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Keep API credentials protected and review access regularly.
            </p>

            <div className="mt-6 space-y-4">

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Secret Key Protection
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Store secret keys securely and never expose them in
                  client-side code.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Access Restrictions
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Limit API access to approved services, users and server
                  environments.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Key Rotation
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Replace old or compromised keys to maintain secure
                  integrations.
                </p>

              </div>

            </div>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-xl font-bold text-slate-900">
              Integration Summary
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Current status of external services connected to StayHub.
            </p>

            <div className="mt-6 space-y-4">

              <div className="flex items-center justify-between rounded-2xl bg-cyan-50 p-4">

                <span className="font-medium text-cyan-700">
                  Total API Services
                </span>

                <span className="font-bold text-cyan-700">
                  4
                </span>

              </div>

              <div className="flex items-center justify-between rounded-2xl bg-green-50 p-4">

                <span className="font-medium text-green-700">
                  Active Services
                </span>

                <span className="font-bold text-green-700">
                  3
                </span>

              </div>

              <div className="flex items-center justify-between rounded-2xl bg-red-50 p-4">

                <span className="font-medium text-red-700">
                  Inactive Services
                </span>

                <span className="font-bold text-red-700">
                  1
                </span>

              </div>

            </div>

          </div>

        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                API Controls
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Manage API connections, authentication and external
                integrations securely.
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <button
                type="button"
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Test Connection
              </button>

              <button
                type="button"
                className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
              >
                Save Changes
              </button>

            </div>

          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">

            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5">

              <h3 className="font-semibold text-cyan-900">
                Authentication
              </h3>

              <p className="mt-2 text-sm leading-6 text-cyan-800">
                Verify API credentials before enabling production access.
              </p>

            </div>

            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">

              <h3 className="font-semibold text-sky-900">
                Monitoring
              </h3>

              <p className="mt-2 text-sm leading-6 text-sky-800">
                Monitor request activity, failures and service availability
                in real time.
              </p>

            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">

              <h3 className="font-semibold text-blue-900">
                Security
              </h3>

              <p className="mt-2 text-sm leading-6 text-blue-800">
                Rotate API keys regularly and disable unused integrations
                for improved security.
              </p>

            </div>

          </div>

        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">

          <h2 className="text-xl font-bold text-amber-900">
            Important Notice
          </h2>

          <p className="mt-3 text-sm leading-6 text-amber-800">
            Never expose secret API keys in client-side code. Store sensitive
            credentials securely on the server and restrict access to
            authorized administrators only.
          </p>

        </div>
      </div>

    </main>

  );
}