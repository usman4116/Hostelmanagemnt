"use client";

import { useState } from "react";

type Preference = {
  id: number;
  title: string;
  value: string;
};

export default function PreferencesSettingsPage() {
  const [preferences] = useState<Preference[]>([
    {
      id: 1,
      title: "Language",
      value: "English",
    },
    {
      id: 2,
      title: "Theme",
      value: "Light",
    },
    {
      id: 3,
      title: "Time Format",
      value: "24 Hours",
    },
    {
      id: 4,
      title: "Date Format",
      value: "DD/MM/YYYY",
    },
  ]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">

      <div className="mx-auto max-w-7xl space-y-6">

        <div className="rounded-3xl bg-gradient-to-r from-sky-700 via-cyan-700 to-teal-700 p-8 text-white shadow-xl">

          <h1 className="text-3xl font-bold">
            Preferences
          </h1>

          <p className="mt-2 text-cyan-100">
            Configure your personal application preferences and default
            experience across the StayHub system.
          </p>

        </div>

        <div className="grid gap-6 md:grid-cols-4">

          {preferences.map((item) => (

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
                Preference Settings
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage language, theme and application display settings.
              </p>

            </div>

            <button
              type="button"
              className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Reset Defaults
            </button>

          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">

            {preferences.map((item) => (

              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 p-5 transition hover:border-sky-300 hover:bg-sky-50"
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
            Preference Options
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Enable or disable commonly used application preferences.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">

            {[
              "Dark Mode",
              "Compact Layout",
              "Email Notifications",
              "SMS Notifications",
              "Auto Refresh Dashboard",
              "Remember Filters",
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
              Preference Summary
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Current application preferences used throughout StayHub.
            </p>

            <div className="mt-6 space-y-4">

              <div className="flex items-center justify-between rounded-2xl bg-sky-50 p-4">

                <span className="font-medium text-sky-700">
                  Language
                </span>

                <span className="font-bold text-sky-700">
                  English
                </span>

              </div>

              <div className="flex items-center justify-between rounded-2xl bg-cyan-50 p-4">

                <span className="font-medium text-cyan-700">
                  Theme
                </span>

                <span className="font-bold text-cyan-700">
                  Light
                </span>

              </div>

              <div className="flex items-center justify-between rounded-2xl bg-teal-50 p-4">

                <span className="font-medium text-teal-700">
                  Time Format
                </span>

                <span className="font-bold text-teal-700">
                  24 Hours
                </span>

              </div>

            </div>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-xl font-bold text-slate-900">
              Preference Features
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Customize your working experience with flexible settings.
            </p>

            <div className="mt-6 space-y-4">

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Personalized Interface
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Configure the dashboard according to your preferred
                  layout and appearance.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Notification Control
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Decide how and when you receive system updates and alerts.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Productivity
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Save your preferred settings to improve daily workflow
                  and user experience.
                </p>

              </div>

            </div>

          </div>

        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Preference Controls
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Manage application behavior, display options and personal
                preferences for StayHub.
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <button
                type="button"
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Restore Defaults
              </button>

              <button
                type="button"
                className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                Save Preferences
              </button>

            </div>

          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">

            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">

              <h3 className="font-semibold text-sky-900">
                Display Options
              </h3>

              <p className="mt-2 text-sm leading-6 text-sky-800">
                Customize dashboard appearance, layouts and theme settings
                according to your preference.
              </p>

            </div>

            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5">

              <h3 className="font-semibold text-cyan-900">
                Notification Settings
              </h3>

              <p className="mt-2 text-sm leading-6 text-cyan-800">
                Control email, SMS and system notifications for important
                hostel activities.
              </p>

            </div>

            <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5">

              <h3 className="font-semibold text-teal-900">
                User Experience
              </h3>

              <p className="mt-2 text-sm leading-6 text-teal-800">
                Save personalized settings to improve efficiency and provide
                a consistent experience every time you sign in.
              </p>

            </div>

          </div>

        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">

          <h2 className="text-xl font-bold text-amber-900">
            Important Notice
          </h2>

          <p className="mt-3 text-sm leading-6 text-amber-800">
            Preference changes affect only your user experience unless they
            are configured as system-wide settings by an administrator.
          </p>

        </div>
      </div>

    </main>

  );
}