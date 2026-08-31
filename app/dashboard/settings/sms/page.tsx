"use client";

import { useState } from "react";

type SmsSetting = {
  id: number;
  title: string;
  value: string;
};

export default function SmsSettingsPage() {
  const [smsSettings] = useState<SmsSetting[]>([
    {
      id: 1,
      title: "SMS Provider",
      value: "Generic SMS Gateway",
    },
    {
      id: 2,
      title: "Sender ID",
      value: "University Girls Hostel",
    },
    {
      id: 3,
      title: "Notifications",
      value: "Enabled",
    },
    {
      id: 4,
      title: "Service Status",
      value: "Active",
    },
  ]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">

      <div className="mx-auto max-w-7xl space-y-6">

        <div className="rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 p-8 text-white shadow-xl">

          <h1 className="text-3xl font-bold">
            SMS Settings
          </h1>

          <p className="mt-2 text-emerald-100">
            Configure SMS provider, sender information and notification
            preferences for the University Girls Hostel system.
          </p>

        </div>

        <div className="grid gap-6 md:grid-cols-4">

          {smsSettings.map((item) => (

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
                SMS Configuration
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage outgoing SMS details and notification options.
              </p>

            </div>

            <button
              type="button"
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Test SMS
            </button>

          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">

            {smsSettings.map((item) => (

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
                    Edit
                  </button>

                </div>

              </div>

            ))}

          </div>

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold text-slate-900">
            SMS Notification Preferences
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Select which SMS notifications should be sent automatically.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">

            {[
              "Admission Confirmation",
              "Payment Reminder",
              "Contract Notification",
              "Maintenance Update",
              "Inspection Alert",
              "General Notice",
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
              SMS Summary
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Current SMS service overview for the University Girls Hostel system.
            </p>

            <div className="mt-6 space-y-4">

              <div className="flex items-center justify-between rounded-2xl bg-emerald-50 p-4">

                <span className="font-medium text-emerald-700">
                  Provider
                </span>

                <span className="font-bold text-emerald-700">
                  Generic SMS Gateway
                </span>

              </div>

              <div className="flex items-center justify-between rounded-2xl bg-cyan-50 p-4">

                <span className="font-medium text-cyan-700">
                  Sender ID
                </span>

                <span className="font-bold text-cyan-700">
                  University Girls Hostel
                </span>

              </div>

              <div className="flex items-center justify-between rounded-2xl bg-blue-50 p-4">

                <span className="font-medium text-blue-700">
                  Service Status
                </span>

                <span className="font-bold text-blue-700">
                  Active
                </span>

              </div>

            </div>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-xl font-bold text-slate-900">
              SMS Features
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Built-in features available for SMS communication.
            </p>

            <div className="mt-6 space-y-4">

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Automatic Alerts
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Send payment reminders, notices and admission updates automatically.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Fast Delivery
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Deliver important messages quickly to resident mobile numbers.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Delivery Tracking
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Monitor sent, delivered and failed SMS activity.
                </p>

              </div>

            </div>

          </div>

        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                SMS Controls
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Manage SMS delivery, notification preferences and service
                configuration.
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <button
                type="button"
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Send Test SMS
              </button>

              <button
                type="button"
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Save Settings
              </button>

            </div>

          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">

              <h3 className="font-semibold text-emerald-900">
                Gateway Verification
              </h3>

              <p className="mt-2 text-sm leading-6 text-emerald-800">
                Verify the SMS gateway connection before sending important
                notifications.
              </p>

            </div>

            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5">

              <h3 className="font-semibold text-cyan-900">
                Delivery Monitoring
              </h3>

              <p className="mt-2 text-sm leading-6 text-cyan-800">
                Monitor successful, pending and failed SMS deliveries in
                real time.
              </p>

            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">

              <h3 className="font-semibold text-amber-900">
                Security Protection
              </h3>

              <p className="mt-2 text-sm leading-6 text-amber-800">
                Protect SMS credentials and allow configuration changes
                only for authorized administrators.
              </p>

            </div>

          </div>

        </div>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-6">

          <h2 className="text-xl font-bold text-red-900">
            Important Notice
          </h2>

          <p className="mt-3 text-sm leading-6 text-red-800">
            Changes to SMS settings may affect payment reminders,
            admission confirmations, maintenance alerts and other
            resident notifications. Verify all settings before saving.
          </p>

        </div>
      </div>

    </main>

  );
}