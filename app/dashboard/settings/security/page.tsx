"use client";

import { useState } from "react";

export default function SecuritySettingsPage() {
  const [form, setForm] = useState({
    securityDeposit: "10000",
    noticePeriod: "30",
    refundPolicy:
      "Security deposit will only be refunded if the resident provides a 30-day notice before leaving.",
    allowDigitalRecord: true,
    allowManualRecord: true,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    alert("Security settings saved successfully.");
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6">

      <div className="mx-auto max-w-5xl space-y-6">

        <div className="rounded-3xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 p-8 text-white shadow-xl">

          <h1 className="text-3xl font-bold">
            Security Deposit Settings
          </h1>

          <p className="mt-2 text-red-100">
            Configure security deposit rules, refund policy and mandatory
            notice period for all residents.
          </p>

        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
        >

          <div className="grid gap-6 md:grid-cols-2">

            <div>

              <label className="mb-2 block text-sm font-semibold">
                Security Deposit Amount
              </label>

              <input
                type="number"
                name="securityDeposit"
                value={form.securityDeposit}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-red-500"
              />

            </div>

            <div>

              <label className="mb-2 block text-sm font-semibold">
                Notice Period (Days)
              </label>

              <input
                type="number"
                name="noticePeriod"
                value={form.noticePeriod}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-red-500"
              />

            </div>

            <div className="md:col-span-2">

              <label className="mb-2 block text-sm font-semibold">
                Refund Policy
              </label>

              <textarea
                name="refundPolicy"
                rows={5}
                value={form.refundPolicy}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-red-500"
              />

            </div>
            <div className="md:col-span-2">

              <h2 className="mb-5 text-xl font-bold text-slate-900">
                Deposit Record Options
              </h2>

              <div className="grid gap-5 md:grid-cols-2">

                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-5 cursor-pointer">

                  <input
                    type="checkbox"
                    name="allowDigitalRecord"
                    checked={form.allowDigitalRecord}
                    onChange={handleChange}
                    className="mt-1 h-5 w-5 rounded"
                  />

                  <div>

                    <h3 className="font-semibold text-slate-900">
                      Digital Record
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Store security deposit information digitally inside
                      StayHub for future reference.
                    </p>

                  </div>

                </label>

                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-5 cursor-pointer">

                  <input
                    type="checkbox"
                    name="allowManualRecord"
                    checked={form.allowManualRecord}
                    onChange={handleChange}
                    className="mt-1 h-5 w-5 rounded"
                  />

                  <div>

                    <h3 className="font-semibold text-slate-900">
                      Manual Record
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Allow keeping manual paper records alongside digital
                      records for verification purposes.
                    </p>

                  </div>

                </label>

              </div>

            </div>

          </div>

          <div className="mt-10 border-t border-slate-200 pt-8">

            <h2 className="text-xl font-bold text-slate-900">
              Current Rules
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              These rules will apply to all future admissions.
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-2">

              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

                <p className="text-sm text-red-700">
                  Deposit Amount
                </p>

                <h3 className="mt-2 text-2xl font-bold text-red-900">
                  Rs. {form.securityDeposit}
                </h3>

              </div>

              <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">

                <p className="text-sm text-orange-700">
                  Notice Period
                </p>

                <h3 className="mt-2 text-2xl font-bold text-orange-900">
                  {form.noticePeriod} Days
                </h3>

              </div>

            </div>

          </div>
          <div className="mt-10 border-t border-slate-200 pt-8">

            <h2 className="text-xl font-bold text-slate-900">
              Refund Conditions
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              These conditions are displayed during resident admission and discharge.
            </p>

            <div className="mt-6 space-y-5">

              <div className="rounded-2xl border border-green-200 bg-green-50 p-5">

                <h3 className="font-semibold text-green-900">
                  Eligible For Refund
                </h3>

                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-green-800">
                  <li>Resident submits a written notice at least 30 days before leaving.</li>
                  <li>All pending rent and utility bills are cleared.</li>
                  <li>No room damages remain unpaid.</li>
                  <li>Room inspection is successfully completed.</li>
                </ul>

              </div>

              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

                <h3 className="font-semibold text-red-900">
                  Deposit Will Not Be Refunded
                </h3>

                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-red-800">
                  <li>Resident leaves without completing the notice period.</li>
                  <li>Outstanding hostel dues remain unpaid.</li>
                  <li>Major damages are found during inspection.</li>
                  <li>Management rejects the discharge request.</li>
                </ul>

              </div>

            </div>

          </div>

          <div className="mt-10 border-t border-slate-200 pt-8">

            <h2 className="text-xl font-bold text-slate-900">
              Security Summary
            </h2>

            <div className="mt-6 grid gap-6 md:grid-cols-3">

              <div className="rounded-2xl bg-slate-50 p-5">

                <p className="text-sm text-slate-500">
                  Deposit
                </p>

                <h3 className="mt-2 text-2xl font-bold">
                  Rs. {form.securityDeposit}
                </h3>

              </div>

              <div className="rounded-2xl bg-slate-50 p-5">

                <p className="text-sm text-slate-500">
                  Notice
                </p>

                <h3 className="mt-2 text-2xl font-bold">
                  {form.noticePeriod} Days
                </h3>

              </div>

              <div className="rounded-2xl bg-slate-50 p-5">

                <p className="text-sm text-slate-500">
                  Records
                </p>

                <h3 className="mt-2 text-lg font-bold">
                  Manual + Digital
                </h3>

              </div>

            </div>

          </div>
          <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6">

            <div className="flex items-start gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white">

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-6 w-6"
                >
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                  <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                </svg>

              </div>

              <div>

                <h3 className="text-lg font-bold text-amber-900">
                  Important Notice
                </h3>

                <p className="mt-2 text-sm leading-6 text-amber-800">
                  Changing these settings only affects future admissions.
                  Existing residents and completed security deposit records
                  remain unchanged unless edited manually.
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
              className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
            >
              Save Security Settings
            </button>

          </div>
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-emerald-900">
                  Security Policy Ready
                </h3>

                <p className="mt-2 text-sm leading-6 text-emerald-800">
                  Review the deposit amount, notice period, refund policy,
                  and record options before saving your changes.
                </p>
              </div>

              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Current Notice Period
                </p>

                <p className="mt-2 text-lg font-bold text-slate-900">
                  {form.noticePeriod} Days
                </p>
              </div>
            </div>
          </div>

        </form>

      </div>

    </main>
  );
}