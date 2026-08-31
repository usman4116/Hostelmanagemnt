"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  resolveAuthenticatedResident,
  type AuthenticatedResident,
} from "@/lib/residentPortalAuth";
import { loadResidentPortalData } from "@/lib/residentPortalData";
import {
  deriveBillStatus,
  roundMoney,
  type BillLifecycleStatus,
} from "@/lib/financials";

// The portal API never serves unapproved bills, but the shared lifecycle type
// keeps this page in step with deriveBillStatus.
type BillStatus = BillLifecycleStatus;

type Bill = {
  id: string;
  bill_number: string;
  resident_id: string;
  billing_month: string;
  due_date: string;
  rent_amount: number;
  electricity_amount: number;
  ac_amount: number;
  other_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  bill_status: BillStatus;
  notes: string | null;
};

type Payment = {
  bill_id: string;
  amount: number;
  payment_status: string;
};

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

function normalized(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function money(value: unknown) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function monthLabel(value: string) {
  const parsed = new Date(`${value.slice(0, 7)}-01T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("en-PK", { month: "long", year: "numeric" });
}

function statusClass(status: BillStatus) {
  if (status === "Paid") return "bg-emerald-100 text-emerald-700";
  if (status === "Partially Paid") return "bg-blue-100 text-blue-700";
  if (status === "Overdue") return "bg-red-100 text-red-700";
  if (status === "Cancelled") return "bg-slate-200 text-slate-700";
  return "bg-amber-100 text-amber-700";
}

export default function ResidentBillsPage() {
  const [resident, setResident] = useState<AuthenticatedResident | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBills = useCallback(async () => {
    setLoading(true);
    setError("");

    const resolved = await resolveAuthenticatedResident();
    if (!resolved.resident) {
      setResident(null);
      setBills([]);
      setError(resolved.error ?? "Your resident profile could not be verified.");
      setLoading(false);
      return;
    }

    const portalResult = await loadResidentPortalData();
    if (
      !portalResult.data ||
      portalResult.data.resident.id !== resolved.resident.id
    ) {
      setError(portalResult.error || "Your resident account could not be verified.");
      setLoading(false);
      return;
    }

    const payments = portalResult.data.payments as Payment[];
    const verifiedByBill = new Map<string, number>();
    for (const payment of payments) {
      if (normalized(payment.payment_status) !== "verified") continue;
      verifiedByBill.set(
        payment.bill_id,
        roundMoney((verifiedByBill.get(payment.bill_id) ?? 0) + Number(payment.amount || 0)),
      );
    }

    const calculatedBills = (portalResult.data.bills as Bill[]).map((bill) => {
      const paid = verifiedByBill.get(bill.id) ?? 0;
      const total = Number(bill.total_amount || 0);
      const cancelled = normalized(bill.bill_status) === "cancelled";
      return {
        ...bill,
        paid_amount: paid,
        balance_amount: Math.max(roundMoney(total - paid), 0),
        bill_status: cancelled
          ? "Cancelled"
          : deriveBillStatus(total, paid, bill.due_date, bill.bill_status),
      } as Bill;
    });

    setResident(portalResult.data.resident);
    setBills(calculatedBills);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadBills(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadBills]);

  const filteredBills = useMemo(() => {
    const query = search.trim().toLowerCase();
    return bills.filter((bill) => {
      const matchesStatus = statusFilter === "All" || bill.bill_status === statusFilter;
      const matchesSearch =
        !query ||
        bill.bill_number.toLowerCase().includes(query) ||
        monthLabel(bill.billing_month).toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [bills, search, statusFilter]);

  async function openBill(billId: string, print = false) {
    const portalResult = await loadResidentPortalData();
    if (!portalResult.data) {
      setError(portalResult.error);
      return;
    }

    const currentBill = (portalResult.data.bills as Bill[]).find(
      (bill) => bill.id === billId,
    );
    if (!currentBill) {
      setError("This bill could not be opened. Refresh and try again.");
      return;
    }

    const paid = roundMoney(
      (portalResult.data.payments as Payment[])
        .filter(
          (payment) =>
            payment.bill_id === billId &&
            normalized(payment.payment_status) === "verified",
        )
        .reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0,
      ),
    );
    const total = Number(currentBill.total_amount || 0);
    const cancelled = normalized(currentBill.bill_status) === "cancelled";
    const calculated: Bill = {
      ...currentBill,
      paid_amount: paid,
      balance_amount: Math.max(roundMoney(total - paid), 0),
      bill_status: cancelled
        ? "Cancelled"
        : deriveBillStatus(total, paid, currentBill.due_date, currentBill.bill_status),
    };

    setSelectedBill(calculated);
    if (print) window.setTimeout(() => window.print(), 0);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm print:border-0 print:shadow-none">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">University Girls Hostel</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">My Bills</h1>
          <p className="mt-1 text-sm text-slate-500">
            {resident ? `Financial records for ${resident.full_name ?? "Resident"}.` : "Your bill history and outstanding balances."}
          </p>
          <div className="mt-4 flex gap-3 print:hidden">
            <Link href="/resident-portal" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Portal Home</Link>
            <Link href="/resident-portal/payments" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Payments & Receipts</Link>
          </div>
        </section>

        {error && <section className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</section>}

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm print:hidden">
          <div className="grid gap-3 border-b border-slate-200 p-5 md:grid-cols-[1fr_220px_auto]">
            <input value={search} onChange={(event) => setSearch(event.target.value)} className={inputClass} placeholder="Search bill number or month" />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={inputClass}>
              {['All', 'Pending', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'].map((status) => <option key={status}>{status}</option>)}
            </select>
            <button type="button" onClick={() => void loadBills()} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold">Refresh</button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50"><tr>{["Bill", "Month", "Due", "Rent", "Electricity", "AC", "Other", "Discount", "Total", "Verified Paid", "Outstanding", "Status", "Actions"].map((heading) => <th key={heading} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? <tr><td colSpan={13} className="px-5 py-12 text-center text-sm text-slate-500">Loading your bills...</td></tr> : filteredBills.length === 0 ? <tr><td colSpan={13} className="px-5 py-12 text-center text-sm text-slate-500">No bills found.</td></tr> : filteredBills.map((bill) => (
                  <tr key={bill.id}>
                    <td className="px-4 py-4 text-sm font-semibold">{bill.bill_number}</td>
                    <td className="px-4 py-4 text-sm">{monthLabel(bill.billing_month)}</td>
                    <td className="px-4 py-4 text-sm">{bill.due_date}</td>
                    <td className="px-4 py-4 text-sm">{money(bill.rent_amount)}</td>
                    <td className="px-4 py-4 text-sm">{money(bill.electricity_amount)}</td>
                    <td className="px-4 py-4 text-sm">{money(bill.ac_amount)}</td>
                    <td className="px-4 py-4 text-sm">{money(bill.other_amount)}</td>
                    <td className="px-4 py-4 text-sm">{money(bill.discount_amount)}</td>
                    <td className="px-4 py-4 text-sm font-semibold">{money(bill.total_amount)}</td>
                    <td className="px-4 py-4 text-sm text-emerald-700">{money(bill.paid_amount)}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-red-700">{money(bill.balance_amount)}</td>
                    <td className="px-4 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(bill.bill_status)}`}>{bill.bill_status}</span></td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => void openBill(bill.id)} className="rounded-lg border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">View</button>
                        <button type="button" onClick={() => void openBill(bill.id, true)} className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">Print</button>
                        <button type="button" onClick={() => void openBill(bill.id, true)} className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">Download Voucher</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {selectedBill && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm print:border-0 print:shadow-none">
            <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">University Girls Hostel Bill</p><h2 className="mt-2 text-2xl font-bold">{selectedBill.bill_number}</h2><p className="mt-1 text-sm text-slate-500">{monthLabel(selectedBill.billing_month)} · Due {selectedBill.due_date}</p></div><button type="button" onClick={() => setSelectedBill(null)} className="rounded-lg border px-3 py-2 text-sm print:hidden">Close</button></div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[['Monthly Rent', selectedBill.rent_amount], ['Electricity', selectedBill.electricity_amount], ['AC Charges', selectedBill.ac_amount], ['Other Charges', selectedBill.other_amount], ['Discount', -selectedBill.discount_amount], ['Total', selectedBill.total_amount], ['Verified Paid', selectedBill.paid_amount], ['Outstanding', selectedBill.balance_amount]].map(([label, value]) => <article key={String(label)} className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-2 font-bold">{money(value)}</p></article>)}
            </div>
            <p className="mt-5 text-sm font-semibold">Status: {selectedBill.bill_status}</p>
            {selectedBill.notes && <p className="mt-3 text-sm text-slate-600">{selectedBill.notes}</p>}
          </section>
        )}
      </div>
    </main>
  );
}
