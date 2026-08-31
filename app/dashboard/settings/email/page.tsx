"use client";

import { useState } from "react";

type EmailSetting = {
  id: number;
  title: string;
  value: string;
};

export default function EmailSettingsPage() {
  const [emailSettings] = useState<EmailSetting[]>([
    {
      id: 1,
      title: "Email Provider",
      value: "SMTP",
    },
    {
      id: 2,
      title: "Sender Email",
      value: "admin@stayhub.com",
    },
    {
      id: 3,
      title: "Notifications",
      value: "Enabled",
    },
    {
      id: 4,
      title: "Email Status",
      value: "Active",
    },
  ]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">

      <div className="mx-auto max-w-7xl space-y-6">

        <div className="rounded-3xl bg-gradient-to-r from-indigo-700 via-blue-700 to-cyan-700 p-8 text-white shadow-xl">

          <h1 className="text-3xl font-bold">
            Email Settings
          </h1>

          <p className="mt-2 text-blue-100">
            Configure email provider, sender information and notification
            settings for the StayHub system.
          </p>

        </div>

        <div className="grid gap-6 md:grid-cols-4">

          {emailSettings.map((item) => (

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
                Email Configuration
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage outgoing email configuration and notification options.
              </p>

            </div>

            <button
              type="button"
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Test Email
            </button>

          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">

            {emailSettings.map((item) => (

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
            Notification Preferences
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Select which system emails should be delivered automatically.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">

            {[
              "Admission Confirmation",
              "Payment Reminder",
              "Contract Notification",
              "Maintenance Update",
              "Inspection Report",
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
              Email Summary
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Current email service overview for the StayHub system.
            </p>

            <div className="mt-6 space-y-4">

              <div className="flex items-center justify-between rounded-2xl bg-indigo-50 p-4">

                <span className="font-medium text-indigo-700">
                  Provider
                </span>

                <span className="font-bold text-indigo-700">
                  SMTP
                </span>

              </div>

              <div className="flex items-center justify-between rounded-2xl bg-emerald-50 p-4">

                <span className="font-medium text-emerald-700">
                  Status
                </span>

                <span className="font-bold text-emerald-700">
                  Active
                </span>

              </div>

              <div className="flex items-center justify-between rounded-2xl bg-blue-50 p-4">

                <span className="font-medium text-blue-700">
                  Notifications
                </span>

                <span className="font-bold text-blue-700">
                  Enabled
                </span>

              </div>

            </div>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-xl font-bold text-slate-900">
              Email Features
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Built-in features available for email communication.
            </p>

            <div className="mt-6 space-y-4">

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Automatic Notifications
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Send payment reminders, admission confirmations and notices automatically.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Secure Delivery
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Deliver system emails securely using authenticated email services.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Activity Tracking
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Monitor outgoing email activity for better communication management.
                </p>

              </div>

            </div>

          </div>

        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Email Controls
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Manage email delivery, notification settings and system
                communication.
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <button
                type="button"
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Send Test Email
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
                SMTP Verification
              </h3>

              <p className="mt-2 text-sm leading-6 text-indigo-800">
                Verify email server configuration before sending system
                notifications.
              </p>

            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">

              <h3 className="font-semibold text-emerald-900">
                Delivery Monitoring
              </h3>

              <p className="mt-2 text-sm leading-6 text-emerald-800">
                Track successful deliveries and identify failed email
                attempts quickly.
              </p>

            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">

              <h3 className="font-semibold text-amber-900">
                Security Protection
              </h3>

              <p className="mt-2 text-sm leading-6 text-amber-800">
                Protect email credentials and restrict access to authorized
                administrators only.
              </p>

            </div>

          </div>

        </div>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-6">

          <h2 className="text-xl font-bold text-red-900">
            Important Notice
          </h2>

          <p className="mt-3 text-sm leading-6 text-red-800">
            Changes to email settings may affect payment reminders,
            admission confirmations, maintenance updates and other system
            notifications. Review all settings before saving.
          </p>

        </div>
      </div>

    </main>

  );
}