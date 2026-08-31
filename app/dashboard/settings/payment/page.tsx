"use client";

import { useState } from "react";

export default function PaymentSettingsPage() {
  const [form, setForm] = useState({
    paymentMethod: "Bank Transfer",
    accountTitle: "StayHub Hostel",
    accountNumber: "",
    bankName: "",
    iban: "",
    instructions:
      "After payment, upload your payment receipt from the resident portal for verification.",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

    alert("Payment settings saved successfully.");
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6">

      <div className="mx-auto max-w-5xl space-y-6">

        <div className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8 text-white shadow-xl">

          <h1 className="text-3xl font-bold">
            Payment Settings
          </h1>

          <p className="mt-2 text-emerald-100">
            Configure payment information that will be displayed
            to residents before they submit their monthly payments.
          </p>

        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
        >

          <div className="grid gap-6 md:grid-cols-2">

            <div>

              <label className="mb-2 block text-sm font-semibold">
                Payment Method
              </label>

              <input
                type="text"
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
              />

            </div>

            <div>

              <label className="mb-2 block text-sm font-semibold">
                Account Title
              </label>

              <input
                type="text"
                name="accountTitle"
                value={form.accountTitle}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
              />

            </div>

            <div>

              <label className="mb-2 block text-sm font-semibold">
                Account Number
              </label>

              <input
                type="text"
                name="accountNumber"
                value={form.accountNumber}
                onChange={handleChange}
                placeholder="Enter account number"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
              />

            </div>

            <div>

              <label className="mb-2 block text-sm font-semibold">
                Bank Name
              </label>

              <input
                type="text"
                name="bankName"
                value={form.bankName}
                onChange={handleChange}
                placeholder="Enter bank name"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
              />

            </div>
            <div>

              <label className="mb-2 block text-sm font-semibold">
                IBAN
              </label>

              <input
                type="text"
                name="iban"
                value={form.iban}
                onChange={handleChange}
                placeholder="Enter IBAN"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
              />

            </div>

          </div>

          <div className="mt-8">

            <label className="mb-2 block text-sm font-semibold">
              Payment Instructions
            </label>

            <textarea
              name="instructions"
              rows={5}
              value={form.instructions}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
            />

          </div>

          <div className="mt-10 border-t border-slate-200 pt-8">

            <h2 className="text-xl font-bold text-slate-900">
              Resident Information
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              The following information will be shown to residents before
              they upload their payment receipt.
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-2">

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">

                <p className="text-sm text-emerald-700">
                  Payment Method
                </p>

                <h3 className="mt-2 text-lg font-bold text-emerald-900">
                  {form.paymentMethod}
                </h3>

              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">

                <p className="text-sm text-blue-700">
                  Account Title
                </p>

                <h3 className="mt-2 break-all text-lg font-bold text-blue-900">
                  {form.accountTitle}
                </h3>

              </div>

              <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5">

                <p className="text-sm text-purple-700">
                  Account Number
                </p>

                <h3 className="mt-2 break-all text-lg font-bold text-purple-900">
                  {form.accountNumber || "Not Configured"}
                </h3>

              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">

                <p className="text-sm text-amber-700">
                  Bank Name
                </p>

                <h3 className="mt-2 break-all text-lg font-bold text-amber-900">
                  {form.bankName || "Not Configured"}
                </h3>

              </div>

            </div>

          </div>
          <div className="mt-10 border-t border-slate-200 pt-8">

            <h2 className="text-xl font-bold text-slate-900">
              Payment Policy
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              These rules will be displayed in the resident portal.
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-2">

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                <h3 className="font-semibold text-slate-900">
                  Receipt Upload
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Residents must upload a payment receipt after completing
                  payment. Payments remain pending until verified by the
                  administrator.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                <h3 className="font-semibold text-slate-900">
                  Verification
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  The administrator reviews uploaded receipts before marking
                  a payment as verified.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                <h3 className="font-semibold text-slate-900">
                  Payment Method
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  The system uses a generic <strong>Payment Method</strong>
                  instead of naming specific wallet providers.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                <h3 className="font-semibold text-slate-900">
                  Account Details
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Residents can view the configured account title,
                  account number and IBAN before making payment.
                </p>

              </div>

            </div>

          </div>

          <div className="mt-10 border-t border-slate-200 pt-8">

            <h2 className="text-xl font-bold text-slate-900">
              Payment Preview
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              This is how payment information will appear inside the
              resident portal.
            </p>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">

              <div className="space-y-4">

                <div className="flex justify-between border-b border-slate-200 pb-3">
                  <span className="font-medium text-slate-600">
                    Payment Method
                  </span>

                  <span className="font-semibold">
                    {form.paymentMethod}
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-200 pb-3">
                  <span className="font-medium text-slate-600">
                    Account Title
                  </span>

                  <span className="font-semibold">
                    {form.accountTitle}
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-200 pb-3">
                  <span className="font-medium text-slate-600">
                    Account Number
                  </span>

                  <span className="font-semibold break-all">
                    {form.accountNumber || "-"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-3">
                  <span className="font-medium text-slate-600">
                    Bank Name
                  </span>

                  <span className="font-semibold break-all">
                    {form.bankName || "-"}
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-200 pb-3">
                  <span className="font-medium text-slate-600">
                    IBAN
                  </span>

                  <span className="font-semibold break-all">
                    {form.iban || "-"}
                  </span>
                </div>

                <div>
                  <span className="font-medium text-slate-600">
                    Instructions
                  </span>

                  <div className="mt-3 rounded-xl bg-white p-4 text-sm leading-6 text-slate-700 shadow-sm">
                    {form.instructions}
                  </div>
                </div>

              </div>

            </div>

          </div>

          <div className="mt-10 rounded-2xl border border-blue-200 bg-blue-50 p-6">

            <h2 className="text-lg font-bold text-blue-900">
              Important Notice
            </h2>

            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-blue-800">
              <li>
                Residents will only see the configured payment information.
              </li>

              <li>
                Payment receipts must be uploaded after every payment.
              </li>

              <li>
                Payments remain pending until verified by the administrator.
              </li>

              <li>
                Existing payment records are not changed by updating these
                settings.
              </li>
            </ul>

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
              className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700"
            >
              Save Payment Settings
            </button>

          </div>
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>

                <h3 className="text-lg font-semibold text-emerald-900">
                  Payment Configuration Ready
                </h3>

                <p className="mt-2 text-sm leading-6 text-emerald-800">
                  Review all payment information before saving. Residents
                  will immediately see the updated payment details inside
                  their portal.
                </p>

              </div>

              <div className="rounded-xl bg-white p-4 shadow">

                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Current Method
                </p>

                <p className="mt-2 text-lg font-bold text-slate-900">
                  {form.paymentMethod}
                </p>

              </div>

            </div>

          </div>

        </form>

      </div>

    </main>
  );
}