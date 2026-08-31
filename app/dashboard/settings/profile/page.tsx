"use client";

import { useState } from "react";

export default function ProfileSettingsPage() {
  const [form, setForm] = useState({
    fullName: "Administrator",
    email: "admin@stayhub.com",
    phone: "+92 300 1234567",
    designation: "Hostel Manager",
    hostelName: "StayHub Hostel",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    alert("Profile updated successfully.");
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">

        <div className="rounded-3xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 p-8 text-white shadow-xl">

          <h1 className="text-3xl font-bold">
            Admin Profile
          </h1>

          <p className="mt-2 text-blue-100">
            Update administrator information used throughout
            the StayHub Management System.
          </p>

        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200"
        >

          <div className="grid gap-6 md:grid-cols-2">

            <div>

              <label className="mb-2 block text-sm font-semibold">
                Full Name
              </label>

              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
              />

            </div>

            <div>

              <label className="mb-2 block text-sm font-semibold">
                Email Address
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
              />

            </div>

            <div>

              <label className="mb-2 block text-sm font-semibold">
                Phone Number
              </label>

              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
              />

            </div>

            <div>

              <label className="mb-2 block text-sm font-semibold">
                Designation
              </label>

              <input
                type="text"
                name="designation"
                value={form.designation}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
              />

            </div>
            <div>

              <label className="mb-2 block text-sm font-semibold">
                Hostel Name
              </label>

              <input
                type="text"
                name="hostelName"
                value={form.hostelName}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
              />

            </div>

          </div>

          <div className="mt-10 border-t border-slate-200 pt-8">

            <h2 className="text-xl font-bold text-slate-900">
              Account Information
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              This information is displayed throughout the StayHub Admin
              Dashboard.
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-2">

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                <p className="text-sm text-slate-500">
                  Account Type
                </p>

                <h3 className="mt-2 text-lg font-bold">
                  Super Administrator
                </h3>

              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                <p className="text-sm text-slate-500">
                  Account Status
                </p>

                <h3 className="mt-2 text-lg font-bold text-green-600">
                  Active
                </h3>

              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                <p className="text-sm text-slate-500">
                  Last Login
                </p>

                <h3 className="mt-2 text-lg font-bold">
                  Today
                </h3>

              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                <p className="text-sm text-slate-500">
                  System Role
                </p>

                <h3 className="mt-2 text-lg font-bold">
                  Full Access
                </h3>

              </div>

            </div>

          </div>
          <div className="mt-10 border-t border-slate-200 pt-8">

            <h2 className="text-xl font-bold text-slate-900">
              Security Information
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Keep your administrator account secure by reviewing the
              information below.
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-2">

              <div className="rounded-2xl border border-green-200 bg-green-50 p-5">

                <p className="text-sm text-green-700">
                  Password Status
                </p>

                <h3 className="mt-2 text-lg font-bold text-green-800">
                  Strong Password
                </h3>

                <p className="mt-2 text-sm text-green-700">
                  Your password meets the recommended security requirements.
                </p>

              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">

                <p className="text-sm text-blue-700">
                  Email Verification
                </p>

                <h3 className="mt-2 text-lg font-bold text-blue-800">
                  Verified
                </h3>

                <p className="mt-2 text-sm text-blue-700">
                  Your administrator email has been verified successfully.
                </p>

              </div>

              <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5">

                <p className="text-sm text-purple-700">
                  Login Access
                </p>

                <h3 className="mt-2 text-lg font-bold text-purple-800">
                  Full Administrator
                </h3>

                <p className="mt-2 text-sm text-purple-700">
                  Complete access to all StayHub management modules.
                </p>

              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">

                <p className="text-sm text-amber-700">
                  Two-Step Verification
                </p>

                <h3 className="mt-2 text-lg font-bold text-amber-800">
                  Optional
                </h3>

                <p className="mt-2 text-sm text-amber-700">
                  Can be enabled in future releases for additional security.
                </p>

              </div>

            </div>

          </div>

          <div className="mt-10 flex items-center justify-end gap-4">

            <button
              type="button"
              className="rounded-xl border border-slate-300 px-6 py-3 font-medium transition hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
            >
              Save Changes
            </button>

          </div>
          <div className="mt-10 border-t border-slate-200 pt-8">

            <h2 className="text-xl font-bold text-slate-900">
              Profile Summary
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Review your administrator information before saving changes.
            </p>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">

              <table className="min-w-full divide-y divide-slate-200">

                <tbody className="divide-y divide-slate-100 bg-white">

                  <tr>
                    <td className="px-5 py-4 font-medium text-slate-700">
                      Administrator
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {form.fullName}
                    </td>
                  </tr>

                  <tr>
                    <td className="px-5 py-4 font-medium text-slate-700">
                      Email
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {form.email}
                    </td>
                  </tr>

                  <tr>
                    <td className="px-5 py-4 font-medium text-slate-700">
                      Phone
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {form.phone}
                    </td>
                  </tr>

                  <tr>
                    <td className="px-5 py-4 font-medium text-slate-700">
                      Designation
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {form.designation}
                    </td>
                  </tr>

                  <tr>
                    <td className="px-5 py-4 font-medium text-slate-700">
                      Hostel
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {form.hostelName}
                    </td>
                  </tr>

                </tbody>

              </table>

            </div>

          </div>

          <div className="mt-10 rounded-2xl border border-blue-200 bg-blue-50 p-5">

            <h3 className="text-lg font-semibold text-blue-900">
              Note
            </h3>

            <p className="mt-2 text-sm leading-6 text-blue-800">
              Updating your administrator profile changes the information
              displayed throughout the StayHub dashboard. These changes do not
              affect residents, billing records, payments, or historical data.
            </p>

          </div>
          <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 md:flex-row md:items-center md:justify-between">

            <div>
              <h3 className="text-lg font-semibold text-emerald-900">
                Profile Ready
              </h3>

              <p className="mt-1 text-sm text-emerald-700">
                Review your information and click <strong>Save Changes</strong>
                to update your administrator profile.
              </p>
            </div>

            <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Current Role
              </p>

              <p className="mt-1 font-bold text-slate-900">
                Super Administrator
              </p>
            </div>

          </div>

        </form>

      </div>

    </main>
  );
}