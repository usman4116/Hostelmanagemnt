"use client";

import Link from "next/link";
import { ReactNode } from "react";

type SettingsItem = {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  status?: string;
};

const settingsItems: SettingsItem[] = [
  {
    title: "Hostel Information",
    description:
      "Manage hostel name, contact information, address, and business details.",
    href: "/settings",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-6 w-6"
      >
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 21v-6h6v6" />
        <path d="M9 10h.01" />
        <path d="M15 10h.01" />
      </svg>
    ),
    status: "Configured",
  },
  {
    title: "Admin Profile",
    description:
      "Update administrator profile, email address and password.",
    href: "/dashboard/settings/profile",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-6 w-6"
      >
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="8" r="4" />
      </svg>
    ),
    status: "Active",
  },
  {
    title: "Payment Methods",
    description:
      "Configure payment methods and account information for residents.",
    href: "/dashboard/settings/payment",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-6 w-6"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
      </svg>
    ),
    status: "Configured",
  },
  {
    title: "Security Deposit",
    description:
      "Manage deposit amount, refund policy and 30-day notice rule.",
    href: "/dashboard/settings/security",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-6 w-6"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v10" />
        <path d="M9 10c0-1.1 1.3-2 3-2s3 .9 3 2-1.3 2-3 2-3 .9-3 2 1.3 2 3 2 3-.9 3-2" />
      </svg>
    ),
    status: "Configured",
  },
  {
    title: "System Preferences",
    description:
      "Manage application preferences, dates, themes and defaults.",
    href: "/dashboard/settings/system",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-6 w-6"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V22h-4v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-2.8-2.8.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 2 14.2H2v-4h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2.8-2.8.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10.2 3V2h4v1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.8 2.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1H22v4h-.8a1.7 1.7 0 0 0-1.8 1Z" />
      </svg>
    ),
    status: "Default",
  },
  {
    title: "Backup & Restore",
    description:
      "Create backups and restore your hostel management data safely.",
    href: "/dashboard/settings/backup",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-6 w-6"
      >
        <path d="M12 3v12" />
        <path d="m8 11 4 4 4-4" />
        <path d="M5 20h14" />
      </svg>
    ),
    status: "Manual",
  },
  {
    title: "Hostel Data Management",
    description:
      "Securely reset operational data or permanently remove one resident and linked records.",
    href: "/dashboard/settings/data-management",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-6 w-6"
      >
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="m19 6-1 15H6L5 6" />
        <path d="M10 11v5M14 11v5" />
      </svg>
    ),
    status: "Admin Only",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 p-8 text-white shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-blue-100">
              University Girls Hostel Administration
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Settings Dashboard
            </h1>

            <p className="mt-3 max-w-2xl text-blue-100">
              Configure your hostel, payment methods, security policies,
              administrator profile and system preferences from one place.
            </p>
          </div>

          <div className="rounded-2xl bg-white/15 p-5 backdrop-blur">
            <div className="text-sm text-blue-100">
              Available Sections
            </div>

            <div className="mt-2 text-4xl font-bold">
              {settingsItems.length}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {settingsItems.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 transition group-hover:bg-indigo-600 group-hover:text-white">
                {item.icon}
              </div>

              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                {item.status}
              </span>
            </div>

            <h2 className="mt-6 text-xl font-bold text-slate-900">
              {item.title}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {item.description}
            </p>

            <div className="mt-6 flex items-center justify-between">
              <span className="text-sm font-semibold text-indigo-600">
                Open Settings
              </span>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 transition group-hover:bg-indigo-600 group-hover:text-white">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                >
                  <path d="M5 12h14" />
                  <path d="m13 6 6 6-6 6" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">
            Hostel Status
          </h3>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Hostel Profile</span>

              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Completed
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600">Admin Account</span>

              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600">Payment Setup</span>

              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                Review
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">
            Security Rules
          </h3>

          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <p>✓ Deposit records enabled</p>
            <p>✓ 30-day notice policy enabled</p>
            <p>✓ Digital records maintained</p>
            <p>✓ Manual records supported</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">
            System Summary
          </h3>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs uppercase text-slate-500">
                Settings
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {settingsItems.length}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs uppercase text-slate-500">
                Status
              </p>
              <p className="mt-2 text-2xl font-bold text-green-600">
                Ready
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs uppercase text-slate-500">
                Version
              </p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                University Girls Hostel v1.0
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs uppercase text-slate-500">
                Mode
              </p>
              <p className="mt-2 text-lg font-bold text-blue-600">
                Production
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-6 w-6"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v5" />
              <path d="M12 16h.01" />
            </svg>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Important Information
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-700">
              Changes made in this section may affect billing, deposits,
              payment instructions and resident operations. Review your
              settings carefully before saving.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700">
                Billing
              </span>

              <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700">
                Deposits
              </span>

              <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700">
                Residents
              </span>

              <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700">
                Payments
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
