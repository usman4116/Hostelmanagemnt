"use client";

import { useState } from "react";

type PrivacySetting = {
  id: number;
  title: string;
  status: string;
};

export default function PrivacySettingsPage() {
  const [privacySettings] = useState<PrivacySetting[]>([
    {
      id: 1,
      title: "Data Encryption",
      status: "Enabled",
    },
    {
      id: 2,
      title: "Two-Factor Authentication",
      status: "Enabled",
    },
    {
      id: 3,
      title: "Session Protection",
      status: "Enabled",
    },
    {
      id: 4,
      title: "Activity Tracking",
      status: "Enabled",
    },
  ]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">

      <div className="mx-auto max-w-7xl space-y-6">

        <div className="rounded-3xl bg-gradient-to-r from-slate-800 via-slate-700 to-gray-800 p-8 text-white shadow-xl">

          <h1 className="text-3xl font-bold">
            Privacy Settings
          </h1>

          <p className="mt-2 text-slate-200">
            Configure privacy, data protection and user security settings
            for StayHub Hostel Management System.
          </p>

        </div>

        <div className="grid gap-6 md:grid-cols-4">

          {privacySettings.map((item) => (

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
                Privacy Controls
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage data privacy, access protection and security options.
              </p>

            </div>

            <button
              type="button"
              className="rounded-xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
            >
              Update Privacy
            </button>

          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">

            {privacySettings.map((item) => (

              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 p-5 transition hover:border-slate-400 hover:bg-slate-50"
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
                    Configure
                  </button>

                </div>

              </div>

            ))}

          </div>

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold text-slate-900">
            Privacy Options
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Enable or disable privacy features for your StayHub system.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">

            {[
              "Encrypt Resident Data",
              "Mask Sensitive Information",
              "Require Two-Factor Authentication",
              "Automatic Session Timeout",
              "Audit User Activity",
              "Data Export Protection",
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
              Privacy Summary
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Current privacy and security status for StayHub.
            </p>

            <div className="mt-6 space-y-4">

              <div className="flex items-center justify-between rounded-2xl bg-slate-100 p-4">

                <span className="font-medium text-slate-700">
                  Encryption
                </span>

                <span className="font-bold text-slate-900">
                  Enabled
                </span>

              </div>

              <div className="flex items-center justify-between rounded-2xl bg-green-50 p-4">

                <span className="font-medium text-green-700">
                  Protected Accounts
                </span>

                <span className="font-bold text-green-700">
                  Active
                </span>

              </div>

              <div className="flex items-center justify-between rounded-2xl bg-blue-50 p-4">

                <span className="font-medium text-blue-700">
                  Session Security
                </span>

                <span className="font-bold text-blue-700">
                  Enabled
                </span>

              </div>

            </div>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-xl font-bold text-slate-900">
              Privacy Features
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Features that help protect user data and system access.
            </p>

            <div className="mt-6 space-y-4">

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Data Encryption
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Encrypt sensitive resident and payment information to
                  protect confidential records.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Secure Authentication
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Use strong authentication methods to reduce unauthorized
                  access to the system.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Audit Monitoring
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Track user activity and security events for compliance
                  and monitoring purposes.
                </p>

              </div>

            </div>

          </div>

        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Privacy Controls
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Manage privacy protection, security policies and data access
                across the StayHub system.
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <button
                type="button"
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Reset Settings
              </button>

              <button
                type="button"
                className="rounded-xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-black"
              >
                Save Changes
              </button>

            </div>

          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">

            <div className="rounded-2xl border border-slate-300 bg-slate-100 p-5">

              <h3 className="font-semibold text-slate-900">
                Data Protection
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-700">
                Protect confidential resident information using strong
                encryption and secure storage practices.
              </p>

            </div>

            <div className="rounded-2xl border border-green-200 bg-green-50 p-5">

              <h3 className="font-semibold text-green-900">
                User Privacy
              </h3>

              <p className="mt-2 text-sm leading-6 text-green-800">
                Restrict access to sensitive information according to user
                roles and permissions.
              </p>

            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">

              <h3 className="font-semibold text-blue-900">
                Compliance
              </h3>

              <p className="mt-2 text-sm leading-6 text-blue-800">
                Maintain audit records and security policies to support
                organizational compliance requirements.
              </p>

            </div>

          </div>

        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">

          <h2 className="text-xl font-bold text-amber-900">
            Important Notice
          </h2>

          <p className="mt-3 text-sm leading-6 text-amber-800">
            Privacy settings help protect resident and staff information.
            Review all security options carefully before applying changes.
          </p>

        </div>
      </div>

    </main>

  );
}