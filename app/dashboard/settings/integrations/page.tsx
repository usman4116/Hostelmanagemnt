"use client";

import { useState } from "react";

type Integration = {
  id: number;
  name: string;
  category: string;
  description: string;
  status: "Connected" | "Disconnected";
};

export default function IntegrationsSettingsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 1,
      name: "Supabase",
      category: "Database",
      description:
        "Manage resident records, payments, contracts and system data.",
      status: "Connected",
    },
    {
      id: 2,
      name: "Email Service",
      category: "Communication",
      description:
        "Send notices, payment reminders and account notifications.",
      status: "Connected",
    },
    {
      id: 3,
      name: "Cloud Storage",
      category: "Files",
      description:
        "Store receipts, contracts and room inspection photographs.",
      status: "Disconnected",
    },
    {
      id: 4,
      name: "Payment Gateway",
      category: "Payments",
      description:
        "Receive and verify online resident payments securely.",
      status: "Disconnected",
    },
  ]);

  const connectedCount = integrations.filter(
    (integration) => integration.status === "Connected"
  ).length;

  const disconnectedCount = integrations.filter(
    (integration) => integration.status === "Disconnected"
  ).length;

  const toggleIntegration = (id: number) => {
    setIntegrations((current) =>
      current.map((integration) =>
        integration.id === id
          ? {
              ...integration,
              status:
                integration.status === "Connected"
                  ? "Disconnected"
                  : "Connected",
            }
          : integration
      )
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6">

      <div className="mx-auto max-w-7xl space-y-6">

        <div className="rounded-3xl bg-gradient-to-r from-violet-700 via-purple-700 to-fuchsia-700 p-8 text-white shadow-xl">

          <h1 className="text-3xl font-bold">
            Integration Settings
          </h1>

          <p className="mt-2 text-purple-100">
            Connect external services for database,
            communication, storage and online payments.
          </p>

        </div>

        <div className="grid gap-6 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <p className="text-sm text-slate-500">
              Total Integrations
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              {integrations.length}
            </h2>

          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">

            <p className="text-sm text-emerald-700">
              Connected
            </p>

            <h2 className="mt-2 text-3xl font-bold text-emerald-900">
              {connectedCount}
            </h2>

          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">

            <p className="text-sm text-red-700">
              Disconnected
            </p>

            <h2 className="mt-2 text-3xl font-bold text-red-900">
              {disconnectedCount}
            </h2>

          </div>

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <div>

            <h2 className="text-2xl font-bold text-slate-900">
              Available Integrations
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review and manage connected services for StayHub.
            </p>

          </div>
          <div className="mt-6 space-y-4">

            {integrations.map((integration) => (

              <div
                key={integration.id}
                className="rounded-2xl border border-slate-200 p-5 transition hover:border-violet-300 hover:bg-violet-50"
              >

                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                  <div className="flex-1">

                    <div className="flex flex-wrap items-center gap-3">

                      <h3 className="text-lg font-bold text-slate-900">
                        {integration.name}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          integration.status === "Connected"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {integration.status}
                      </span>

                    </div>

                    <p className="mt-2 text-sm font-medium text-violet-700">
                      {integration.category}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {integration.description}
                    </p>

                  </div>

                  <div className="flex gap-3">

                    <button
                      type="button"
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-100"
                    >
                      Configure
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleIntegration(integration.id)}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${
                        integration.status === "Connected"
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    >
                      {integration.status === "Connected"
                        ? "Disconnect"
                        : "Connect"}
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
              Integration Summary
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Overview of all external services connected with StayHub.
            </p>

            <div className="mt-6 space-y-4">

              <div className="flex items-center justify-between rounded-2xl bg-emerald-50 p-4">

                <span className="font-medium text-emerald-700">
                  Connected Services
                </span>

                <span className="font-bold text-emerald-700">
                  {connectedCount}
                </span>

              </div>

              <div className="flex items-center justify-between rounded-2xl bg-red-50 p-4">

                <span className="font-medium text-red-700">
                  Disconnected Services
                </span>

                <span className="font-bold text-red-700">
                  {disconnectedCount}
                </span>

              </div>

              <div className="flex items-center justify-between rounded-2xl bg-violet-50 p-4">

                <span className="font-medium text-violet-700">
                  Total Integrations
                </span>

                <span className="font-bold text-violet-700">
                  {integrations.length}
                </span>

              </div>

            </div>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-xl font-bold text-slate-900">
              Integration Benefits
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Connected services improve automation and system efficiency.
            </p>

            <div className="mt-6 space-y-4">

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Secure Database
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Keep hostel information synchronized and protected.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Faster Communication
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Deliver notices, reminders and alerts instantly.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Secure Online Payments
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Verify and manage resident payments efficiently.
                </p>

              </div>

            </div>

          </div>

        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Integration Controls
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Manage external services, monitor connectivity and keep
                integrations working properly.
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
                className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                Save Changes
              </button>

            </div>

          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">

            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">

              <h3 className="font-semibold text-violet-900">
                Connection Health
              </h3>

              <p className="mt-2 text-sm leading-6 text-violet-800">
                Verify that every connected service is available and
                responding without errors.
              </p>

            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">

              <h3 className="font-semibold text-emerald-900">
                Synchronization
              </h3>

              <p className="mt-2 text-sm leading-6 text-emerald-800">
                Keep data synchronized across connected systems to ensure
                accurate records.
              </p>

            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">

              <h3 className="font-semibold text-amber-900">
                Security Review
              </h3>

              <p className="mt-2 text-sm leading-6 text-amber-800">
                Regularly review permissions and access tokens for all
                third-party integrations.
              </p>

            </div>

          </div>

        </div>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-6">

          <h2 className="text-xl font-bold text-red-900">
            Important Notice
          </h2>

          <p className="mt-3 text-sm leading-6 text-red-800">
            Only authorized administrators should connect or disconnect
            integrations. Review permissions before enabling any external
            service.
          </p>

        </div>
      </div>

    </main>

  );
}