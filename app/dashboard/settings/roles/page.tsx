"use client";

import { useState } from "react";

type Role = {
  id: number;
  title: string;
  users: string;
};

export default function RolesSettingsPage() {
  const [roles] = useState<Role[]>([
    {
      id: 1,
      title: "Administrator",
      users: "2 Users",
    },
    {
      id: 2,
      title: "Manager",
      users: "4 Users",
    },
    {
      id: 3,
      title: "Reception Staff",
      users: "6 Users",
    },
    {
      id: 4,
      title: "Accountant",
      users: "2 Users",
    },
  ]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">

      <div className="mx-auto max-w-7xl space-y-6">

        <div className="rounded-3xl bg-gradient-to-r from-rose-700 via-pink-700 to-fuchsia-700 p-8 text-white shadow-xl">

          <h1 className="text-3xl font-bold">
            Roles & Permissions
          </h1>

          <p className="mt-2 text-rose-100">
            Manage user roles and permission levels across the University Girls Hostel
            hostel management system.
          </p>

        </div>

        <div className="grid gap-6 md:grid-cols-4">

          {roles.map((item) => (

            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >

              <p className="text-sm text-slate-500">
                {item.title}
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-900">
                {item.users}
              </h2>

            </div>

          ))}

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-2xl font-bold text-slate-900">
                Role Management
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Create, edit and review user roles and permission groups.
              </p>

            </div>

            <button
              type="button"
              className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              Add New Role
            </button>

          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">

            {roles.map((item) => (

              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 p-5 transition hover:border-rose-300 hover:bg-rose-50"
              >

                <div className="flex items-center justify-between">

                  <div>

                    <h3 className="text-lg font-bold text-slate-900">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-slate-600">
                      {item.users}
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
            Permission Groups
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Select the permissions available for each user role.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">

            {[
              "Resident Management",
              "Room Management",
              "Billing & Payments",
              "Contracts",
              "Reports",
              "System Settings",
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
              Roles Summary
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Overview of user roles currently configured in University Girls Hostel.
            </p>

            <div className="mt-6 space-y-4">

              <div className="flex items-center justify-between rounded-2xl bg-rose-50 p-4">

                <span className="font-medium text-rose-700">
                  Administrators
                </span>

                <span className="font-bold text-rose-700">
                  2 Users
                </span>

              </div>

              <div className="flex items-center justify-between rounded-2xl bg-pink-50 p-4">

                <span className="font-medium text-pink-700">
                  Managers
                </span>

                <span className="font-bold text-pink-700">
                  4 Users
                </span>

              </div>

              <div className="flex items-center justify-between rounded-2xl bg-fuchsia-50 p-4">

                <span className="font-medium text-fuchsia-700">
                  Staff Members
                </span>

                <span className="font-bold text-fuchsia-700">
                  8 Users
                </span>

              </div>

            </div>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-xl font-bold text-slate-900">
              Permission Features
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Role-based access keeps your hostel management system secure.
            </p>

            <div className="mt-6 space-y-4">

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Access Control
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Assign permissions based on each staff member&apos;s
                  responsibilities.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Secure Operations
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Restrict sensitive actions to authorized users only.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 p-4">

                <h3 className="font-semibold text-slate-900">
                  Easy Management
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Update user roles and permissions anytime without
                  affecting existing records.
                </p>

              </div>

            </div>

          </div>

        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Role Controls
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Create, update and manage roles with secure permission
                assignments.
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <button
                type="button"
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Refresh Roles
              </button>

              <button
                type="button"
                className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Save Changes
              </button>

            </div>

          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">

            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">

              <h3 className="font-semibold text-rose-900">
                Permission Review
              </h3>

              <p className="mt-2 text-sm leading-6 text-rose-800">
                Review assigned permissions regularly to ensure users only
                have access required for their responsibilities.
              </p>

            </div>

            <div className="rounded-2xl border border-pink-200 bg-pink-50 p-5">

              <h3 className="font-semibold text-pink-900">
                User Assignment
              </h3>

              <p className="mt-2 text-sm leading-6 text-pink-800">
                Assign staff members to the correct roles for secure and
                organized system access.
              </p>

            </div>

            <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-5">

              <h3 className="font-semibold text-fuchsia-900">
                Security Management
              </h3>

              <p className="mt-2 text-sm leading-6 text-fuchsia-800">
                Protect sensitive modules by limiting access to authorized
                administrators and managers.
              </p>

            </div>

          </div>

        </div>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-6">

          <h2 className="text-xl font-bold text-red-900">
            Important Notice
          </h2>

          <p className="mt-3 text-sm leading-6 text-red-800">
            Changes to roles and permissions take effect immediately and
            may impact user access across the University Girls Hostel system. Review all
            assignments before saving.
          </p>

        </div>
      </div>

    </main>

  );
}
