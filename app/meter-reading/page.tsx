"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  calculateMeterUnits,
  calculateMeterCharge,
  roundMoney,
  DEFAULT_UNIT_RATE,
} from "@/lib/meterReading";
import { usePermissions } from "@/lib/usePermissions";

type MeterReadingRow = {
  id: string;
  bill_id: string | null;
  resident_id: string;
  admission_id: string | null;
  billing_month: string;
  previous_reading: number;
  current_reading: number;
  units_consumed: number;
  rate_per_unit: number;
  total_amount: number;
  remarks: string | null;
  created_at: string;
  resident_name: string;
  resident_code: string | null;
  resident_phone: string | null;
  room_number: string | null;
  bed_number: string | null;
  bill_number: string | null;
  bill_status: string | null;
  is_billed: boolean;
};

type ResidentOption = {
  id: string;
  full_name: string;
  resident_code: string | null;
  room_number: string | null;
  bed_number: string | null;
  admission_id: string | null;
  status: string;
};

function formatMoney(value: number): string {
  return `Rs ${value.toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function currentBillingMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export default function MeterReadingPage() {
  const { isSuperAdmin } = usePermissions();

  const [activeTab, setActiveTab] = useState<"readings" | "students">("readings");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [readings, setReadings] = useState<MeterReadingRow[]>([]);
  const [activeResidents, setActiveResidents] = useState<ResidentOption[]>([]);
  const [defaultUnitRate, setDefaultUnitRate] = useState<number>(DEFAULT_UNIT_RATE);
  const [enabledResidentIds, setEnabledResidentIds] = useState<string[]>([]);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentBillingMonth());
  const [searchQuery, setSearchQuery] = useState("");
  const [studentFilter, setStudentFilter] = useState<"all" | "enabled" | "disabled">("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReading, setEditingReading] = useState<MeterReadingRow | null>(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [newPriceInput, setNewPriceInput] = useState<string>("");
  const [savingPrice, setSavingPrice] = useState(false);

  const [formResidentId, setFormResidentId] = useState("");
  const [formBillingMonth, setFormBillingMonth] = useState(currentBillingMonth());
  const [formPreviousReading, setFormPreviousReading] = useState("0");
  const [formCurrentReading, setFormCurrentReading] = useState("");
  const [formRatePerUnit, setFormRatePerUnit] = useState(String(DEFAULT_UNIT_RATE));
  const [formRemarks, setFormRemarks] = useState("");
  const [submittingReading, setSubmittingReading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const configRes = await fetch("/api/meter-reading/config");
      if (configRes.ok) {
        const configJson = await configRes.json();
        if (configJson.config) {
          setDefaultUnitRate(configJson.config.default_unit_rate ?? DEFAULT_UNIT_RATE);
          setEnabledResidentIds(configJson.config.enabled_resident_ids ?? []);
        }
      }

      const readingsRes = await fetch("/api/meter-reading");
      if (readingsRes.ok) {
        const readingsJson = await readingsRes.json();
        setReadings(readingsJson.readings ?? []);
      }

      const [admissionsRes, residentsRes, roomsRes, bedsRes] = await Promise.all([
        supabase
          .from("admissions")
          .select("id, resident_id, room_id, bed_id, status")
          .eq("status", "Active"),
        supabase
          .from("residents")
          .select("id, full_name, resident_code, status")
          .neq("status", "Archived"),
        supabase.from("rooms").select("id, room_number"),
        supabase.from("beds").select("id, bed_number"),
      ]);

      const roomMap = new Map((roomsRes.data ?? []).map((r) => [r.id, r.room_number]));
      const bedMap = new Map((bedsRes.data ?? []).map((b) => [b.id, b.bed_number]));
      const resMap = new Map((residentsRes.data ?? []).map((r) => [r.id, r]));

      const studentList: ResidentOption[] = (admissionsRes.data ?? []).map((adm) => {
        const res = resMap.get(adm.resident_id);
        return {
          id: adm.resident_id,
          admission_id: adm.id,
          full_name: res?.full_name || "Unknown Resident",
          resident_code: res?.resident_code || null,
          room_number: adm.room_id ? roomMap.get(adm.room_id) || null : null,
          bed_number: adm.bed_id ? bedMap.get(adm.bed_id) || null : null,
          status: adm.status,
        };
      });

      setActiveResidents(studentList);
    } catch (err) {
      console.error("Error loading meter reading data:", err);
      setError("Failed to load meter reading data. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function getAccessToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || "";
  }

  async function toggleResidentElectricity(residentId: string, currentEnabled: boolean) {
    const updated = currentEnabled
      ? enabledResidentIds.filter((id) => id !== residentId)
      : [...new Set([...enabledResidentIds, residentId])];

    setEnabledResidentIds(updated);

    try {
      const token = await getAccessToken();
      const res = await fetch("/api/meter-reading/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled_resident_ids: updated }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to update electricity billing status.");
      }

      setSuccessMessage(
        currentEnabled
          ? "Student removed from electricity billing."
          : "Student enabled for electricity billing! Meter readings can now be recorded."
      );
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setEnabledResidentIds(enabledResidentIds);
      setError(err instanceof Error ? err.message : "Failed to toggle status.");
      setTimeout(() => setError(""), 5000);
    }
  }

  async function toggleAllResidents(enable: boolean) {
    const activeIds = activeResidents.map((r) => r.id);
    const updated = enable ? [...new Set([...enabledResidentIds, ...activeIds])] : [];

    setEnabledResidentIds(updated);

    try {
      const token = await getAccessToken();
      const res = await fetch("/api/meter-reading/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled_resident_ids: updated }),
      });

      if (!res.ok) {
        throw new Error("Failed to batch update electricity billing.");
      }

      setSuccessMessage(
        enable
          ? `Enabled electricity billing for all ${activeIds.length} active students.`
          : "Disabled electricity billing for all students."
      );
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setError("Failed to batch update electricity billing status.");
      setTimeout(() => setError(""), 5000);
      void loadData();
    }
  }

  async function handleSaveUnitPrice(e: React.FormEvent) {
    e.preventDefault();
    const rate = Number(newPriceInput);
    if (!Number.isFinite(rate) || rate <= 0) {
      setError("Please enter a valid price per unit greater than zero.");
      return;
    }

    setSavingPrice(true);
    try {
      const token = await getAccessToken();
      const res = await fetch("/api/meter-reading/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ default_unit_rate: rate }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to update unit rate.");
      }

      setDefaultUnitRate(rate);
      setShowPriceModal(false);
      setSuccessMessage(`Electricity unit rate updated to Rs ${rate.toFixed(2)} / unit.`);
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save unit rate.");
    } finally {
      setSavingPrice(false);
    }
  }

  function handleStudentSelectForReading(residentId: string) {
    setFormResidentId(residentId);
    const studentReadings = readings
      .filter((r) => r.resident_id === residentId)
      .sort((a, b) => b.billing_month.localeCompare(a.billing_month));

    if (studentReadings.length > 0) {
      setFormPreviousReading(String(studentReadings[0].current_reading));
    } else {
      setFormPreviousReading("0");
    }
  }

  function openAddReadingModal() {
    setEditingReading(null);
    setFormBillingMonth(selectedMonth || currentBillingMonth());
    setFormRatePerUnit(String(defaultUnitRate));
    setFormCurrentReading("");
    setFormRemarks("");

    const firstEnabled = activeResidents.find((r) => enabledResidentIds.includes(r.id));
    if (firstEnabled) {
      handleStudentSelectForReading(firstEnabled.id);
    } else {
      setFormResidentId("");
      setFormPreviousReading("0");
    }

    setShowAddModal(true);
  }

  function openEditReadingModal(reading: MeterReadingRow) {
    setEditingReading(reading);
    setFormResidentId(reading.resident_id);
    setFormBillingMonth(reading.billing_month);
    setFormPreviousReading(String(reading.previous_reading));
    setFormCurrentReading(String(reading.current_reading));
    setFormRatePerUnit(String(reading.rate_per_unit));
    setFormRemarks(reading.remarks || "");
    setShowAddModal(true);
  }

  const liveCalculation = useMemo(() => {
    const prev = Number(formPreviousReading) || 0;
    const curr = Number(formCurrentReading) || 0;
    const rate = Number(formRatePerUnit) || 0;

    const units = calculateMeterUnits(prev, curr);
    const total = calculateMeterCharge(units, rate);
    const isValid = curr >= prev && rate > 0;

    return { prev, curr, rate, units, total, isValid };
  }, [formPreviousReading, formCurrentReading, formRatePerUnit]);

  async function handleSaveReading(e: React.FormEvent) {
    e.preventDefault();
    if (!formResidentId) {
      setError("Please select a student.");
      return;
    }
    if (!liveCalculation.isValid) {
      setError("Current reading must be greater than or equal to previous reading, and rate must be > 0.");
      return;
    }

    setSubmittingReading(true);
    setError("");

    try {
      const token = await getAccessToken();
      const residentAdm = activeResidents.find((r) => r.id === formResidentId);

      const payload = {
        resident_id: formResidentId,
        admission_id: residentAdm?.admission_id || null,
        billing_month: formBillingMonth,
        previous_reading: liveCalculation.prev,
        current_reading: liveCalculation.curr,
        rate_per_unit: liveCalculation.rate,
        remarks: formRemarks.trim() || undefined,
      };

      const url = editingReading ? "/api/meter-reading" : "/api/meter-reading";
      const method = editingReading ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingReading ? { ...payload, id: editingReading.id } : payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save meter reading.");
      }

      setShowAddModal(false);
      setSuccessMessage(
        editingReading
          ? "Meter reading updated successfully!"
          : `Meter reading saved! ${liveCalculation.units.toFixed(2)} units = ${formatMoney(liveCalculation.total)}`
      );
      setTimeout(() => setSuccessMessage(""), 5000);
      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit meter reading.");
    } finally {
      setSubmittingReading(false);
    }
  }

  async function handleDeleteReading(reading: MeterReadingRow) {
    if (reading.is_billed) {
      alert("This meter reading is already linked to a generated rent bill. Cancel or delete the bill first.");
      return;
    }

    if (!confirm(`Are you sure you want to delete the meter reading for ${reading.resident_name} (${reading.billing_month})?`)) {
      return;
    }

    try {
      const token = await getAccessToken();
      const res = await fetch(`/api/meter-reading?id=${reading.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to delete reading.");
      }

      setSuccessMessage("Meter reading removed.");
      setTimeout(() => setSuccessMessage(""), 4000);
      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete reading.");
    }
  }

  const filteredReadings = useMemo(() => {
    return readings.filter((r) => {
      const matchesMonth = selectedMonth ? r.billing_month.startsWith(selectedMonth) : true;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.resident_name.toLowerCase().includes(q) ||
        (r.resident_code && r.resident_code.toLowerCase().includes(q)) ||
        (r.room_number && r.room_number.toLowerCase().includes(q)) ||
        (r.bed_number && r.bed_number.toLowerCase().includes(q));

      return matchesMonth && matchesSearch;
    });
  }, [readings, selectedMonth, searchQuery]);

  const filteredStudents = useMemo(() => {
    return activeResidents.filter((s) => {
      const isEnabled = enabledResidentIds.includes(s.id);
      if (studentFilter === "enabled" && !isEnabled) return false;
      if (studentFilter === "disabled" && isEnabled) return false;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        s.full_name.toLowerCase().includes(q) ||
        (s.resident_code && s.resident_code.toLowerCase().includes(q)) ||
        (s.room_number && s.room_number.toLowerCase().includes(q)) ||
        (s.bed_number && s.bed_number.toLowerCase().includes(q))
      );
    });
  }, [activeResidents, enabledResidentIds, studentFilter, searchQuery]);

  const enabledStudentsCount = useMemo(() => {
    return activeResidents.filter((r) => enabledResidentIds.includes(r.id)).length;
  }, [activeResidents, enabledResidentIds]);

  const monthSummary = useMemo(() => {
    const monthReadings = readings.filter((r) =>
      selectedMonth ? r.billing_month.startsWith(selectedMonth) : true
    );
    const totalUnits = monthReadings.reduce((sum, r) => sum + (Number(r.units_consumed) || 0), 0);
    const totalAmount = monthReadings.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);
    const billedCount = monthReadings.filter((r) => r.is_billed).length;

    return { totalUnits, totalAmount, totalCount: monthReadings.length, billedCount };
  }, [readings, selectedMonth]);

  const enabledResidentsList = useMemo(() => {
    return activeResidents.filter((r) => enabledResidentIds.includes(r.id));
  }, [activeResidents, enabledResidentIds]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Meter Reading & Electricity Module
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Set unit rate, select students charged for electricity bills, record meter readings, and auto-sync with rent bills.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setNewPriceInput(String(defaultUnitRate));
              setShowPriceModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <span className="text-amber-500">⚡</span>
            Rate: <span className="font-bold text-slate-900 dark:text-white">Rs {defaultUnitRate.toFixed(2)}/unit</span>
            <span className="text-xs text-blue-600 dark:text-blue-400 underline ml-1">Edit</span>
          </button>

          <button
            onClick={openAddReadingModal}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            Add New Reading
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          ⚠️ {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
          ✓ {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Students
            </span>
            <span className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              👥
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {activeResidents.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Currently admitted in hostel</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Electricity Enabled
            </span>
            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              ⚡
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {enabledStudentsCount} <span className="text-sm font-normal text-slate-500">/ {activeResidents.length}</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">Only these are charged electricity bills</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Units ({selectedMonth})
            </span>
            <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              📊
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {monthSummary.totalUnits.toFixed(2)} <span className="text-sm font-normal text-slate-500">units</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">Across {monthSummary.totalCount} readings entered</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Meter Charges ({selectedMonth})
            </span>
            <span className="rounded-lg bg-purple-50 p-2 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              💰
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {formatMoney(monthSummary.totalAmount)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {monthSummary.billedCount} linked to rent bills
          </p>
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("readings")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition ${
            activeTab === "readings"
              ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <span>📋</span> Meter Readings History
          <span className="ml-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {readings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("students")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition ${
            activeTab === "students"
              ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <span>⚡</span> Student Selection for Electricity
          <span className="ml-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            {enabledStudentsCount} selected
          </span>
        </button>
      </div>

      {activeTab === "readings" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Month:
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              {selectedMonth && (
                <button
                  onClick={() => setSelectedMonth("")}
                  className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                  View All Months
                </button>
              )}
            </div>

            <div className="w-full sm:w-72">
              <input
                type="text"
                placeholder="Search student, room, bed..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5">Month</th>
                    <th className="px-5 py-3.5">Student / Resident</th>
                    <th className="px-5 py-3.5">Room & Bed</th>
                    <th className="px-5 py-3.5 text-right">Prev Reading</th>
                    <th className="px-5 py-3.5 text-right">Curr Reading</th>
                    <th className="px-5 py-3.5 text-right">Units Used</th>
                    <th className="px-5 py-3.5 text-right">Unit Rate</th>
                    <th className="px-5 py-3.5 text-right">Total Amount</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="px-5 py-8 text-center text-slate-400">
                        Loading meter readings...
                      </td>
                    </tr>
                  ) : filteredReadings.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-5 py-12 text-center">
                        <div className="mx-auto max-w-sm">
                          <p className="text-3xl">⚡</p>
                          <p className="mt-2 font-bold text-slate-800 dark:text-slate-200">
                            No meter readings found
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {selectedMonth
                              ? `No meter readings recorded for ${selectedMonth}. Click "Add New Reading" to add one.`
                              : "No readings found matching your search."}
                          </p>
                          <button
                            onClick={openAddReadingModal}
                            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                          >
                            + Add First Reading for {selectedMonth || "This Month"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredReadings.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                        <td className="px-5 py-4 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                          {r.billing_month}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {r.resident_name}
                          </div>
                          {r.resident_code && (
                            <div className="text-xs text-slate-400 font-mono">
                              {r.resident_code}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            Room {r.room_number || "—"}
                          </span>
                          {r.bed_number && (
                            <span className="ml-1 text-xs text-slate-500">
                              (Bed {r.bed_number})
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right font-mono font-medium text-slate-600 dark:text-slate-400">
                          {Number(r.previous_reading).toFixed(2)}
                        </td>
                        <td className="px-5 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {Number(r.current_reading).toFixed(2)}
                        </td>
                        <td className="px-5 py-4 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {Number(r.units_consumed).toFixed(2)}
                        </td>
                        <td className="px-5 py-4 text-right text-xs text-slate-500">
                          Rs {Number(r.rate_per_unit).toFixed(2)}
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {formatMoney(Number(r.total_amount))}
                        </td>
                        <td className="px-5 py-4">
                          {r.is_billed ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              ✓ Billed ({r.bill_number || "Rent Bill"})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              ⏳ Ready for Bill
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditReadingModal(r)}
                              className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-slate-800"
                              title="Edit Reading"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            {!r.is_billed && (
                              <button
                                onClick={() => handleDeleteReading(r)}
                                className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-slate-800"
                                title="Delete Reading"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "students" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-sm text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
            <div className="flex items-start gap-3">
              <span className="text-xl">ℹ️</span>
              <div>
                <p className="font-bold">Electricity Billing Student Selection</p>
                <p className="mt-1 text-xs text-blue-800/80 dark:text-blue-300/80">
                  Select which students are charged for electricity bills. <strong>Only selected students</strong> will have meter readings charged when creating rent bills or generating automatic monthly bills. Non-selected students will not be charged for electricity (amount = Rs 0).
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setStudentFilter("all")}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  studentFilter === "all"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                All Students ({activeResidents.length})
              </button>
              <button
                onClick={() => setStudentFilter("enabled")}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  studentFilter === "enabled"
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300"
                }`}
              >
                ⚡ Enabled Only ({enabledStudentsCount})
              </button>
              <button
                onClick={() => setStudentFilter("disabled")}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  studentFilter === "disabled"
                    ? "bg-slate-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                Disabled ({activeResidents.length - enabledStudentsCount})
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Search student or room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <button
                onClick={() => toggleAllResidents(true)}
                className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              >
                Select All
              </button>
              <button
                onClick={() => toggleAllResidents(false)}
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Deselect All
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">Student Name</th>
                  <th className="px-5 py-3.5">Resident Code</th>
                  <th className="px-5 py-3.5">Room & Bed</th>
                  <th className="px-5 py-3.5">Admission Status</th>
                  <th className="px-5 py-3.5 text-center">Electricity Billing</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      No students match the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
                    const isEnabled = enabledResidentIds.includes(s.id);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                        <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                          {s.full_name}
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-slate-500">
                          {s.resident_code || "—"}
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            Room {s.room_number || "—"}
                          </span>
                          {s.bed_number && (
                            <span className="ml-1 text-xs text-slate-500">
                              (Bed {s.bed_number})
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            {s.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          {isEnabled ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              ⚡ Charged Electricity
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              ⚪ Not Charged
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => toggleResidentElectricity(s.id, isEnabled)}
                            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold shadow-sm transition ${
                              isEnabled
                                ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300"
                                : "border border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-700 dark:border-emerald-600"
                            }`}
                          >
                            {isEnabled ? "Disable Billing" : "⚡ Enable for Electricity"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingReading ? "Edit Meter Reading" : "Record New Meter Reading"}
                </h3>
                <p className="text-xs text-slate-500">
                  Units and charge are calculated automatically: (Current - Previous) × Unit Rate
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveReading} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Student / Resident *
                </label>
                {editingReading ? (
                  <input
                    readOnly
                    value={editingReading.resident_name}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-800 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                  />
                ) : enabledResidentsList.length === 0 ? (
                  <div className="mt-1.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                    ⚠️ No students are enabled for electricity billing yet. Please go to the <strong>Student Selection</strong> tab and enable students first.
                  </div>
                ) : (
                  <select
                    value={formResidentId}
                    onChange={(e) => handleStudentSelectForReading(e.target.value)}
                    required
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">-- Select Enabled Student --</option>
                    {enabledResidentsList.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.full_name} {r.room_number ? `(Room ${r.room_number})` : ""} {r.bed_number ? `[Bed ${r.bed_number}]` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Billing Month (YYYY-MM) *
                  </label>
                  <input
                    type="month"
                    required
                    value={formBillingMonth}
                    onChange={(e) => setFormBillingMonth(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Rate per Unit (Rs) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formRatePerUnit}
                    onChange={(e) => setFormRatePerUnit(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Previous Reading *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formPreviousReading}
                    onChange={(e) => setFormPreviousReading(e.target.value)}
                    placeholder="e.g. 100"
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <span className="text-[11px] text-slate-400">Auto-filled from prior reading</span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Current Reading *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formCurrentReading}
                    onChange={(e) => setFormCurrentReading(e.target.value)}
                    placeholder="e.g. 150"
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <span className="text-[11px] text-slate-400">Must be ≥ previous reading</span>
                </div>
              </div>

              <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/40">
                <div className="flex items-center justify-between text-xs font-semibold text-indigo-900 dark:text-indigo-300">
                  <span>⚡ Units Consumed (Current - Previous):</span>
                  <span className="font-mono text-base font-bold">
                    {liveCalculation.units.toFixed(2)} units
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm font-bold text-indigo-950 dark:text-indigo-200 border-t border-indigo-200/60 pt-2 dark:border-indigo-800/60">
                  <span>Total Calculated Charge:</span>
                  <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatMoney(liveCalculation.total)}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-indigo-700 dark:text-indigo-400">
                  Formula: ({liveCalculation.curr} - {liveCalculation.prev}) × Rs {liveCalculation.rate} = {formatMoney(liveCalculation.total)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Remarks / Meter Notes (Optional)
                </label>
                <input
                  type="text"
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  placeholder="e.g. Sub-meter #3, AC electricity reading"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReading || !liveCalculation.isValid || !formResidentId}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {submittingReading ? "Saving..." : editingReading ? "Update Reading" : "Save Meter Reading"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPriceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Update Electricity Unit Rate
              </h3>
              <button
                onClick={() => setShowPriceModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUnitPrice} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Rate per Unit (PKR)
                </label>
                <div className="relative mt-2">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 font-bold text-slate-400">
                    Rs
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={newPriceInput}
                    onChange={(e) => setNewPriceInput(e.target.value)}
                    placeholder="50"
                    className="w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 py-2.5 text-base font-bold text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  This rate will be the default for newly recorded meter readings and automatically applied when generating rent bills.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPriceModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPrice}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingPrice ? "Saving..." : "Save Rate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
