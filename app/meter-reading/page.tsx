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

  // Tab 1 filters
  const [selectedMonth, setSelectedMonth] = useState<string>(currentBillingMonth());
  const [readingSearch, setReadingSearch] = useState("");

  // Tab 2 filters
  const [studentSearch, setStudentSearch] = useState("");
  const [studentFilter, setStudentFilter] = useState<"all" | "enabled" | "disabled">("all");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReading, setEditingReading] = useState<MeterReadingRow | null>(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [newPriceInput, setNewPriceInput] = useState<string>("");
  const [savingPrice, setSavingPrice] = useState(false);

  // Form states
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

      const roomMap = new Map((roomsRes.data ?? []).map((r) => [r.id, String(r.room_number ?? "")]));
      const bedMap = new Map((bedsRes.data ?? []).map((b) => [b.id, String(b.bed_number ?? "")]));
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
          status: adm.status || "Active",
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

      const url = "/api/meter-reading";
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

  // Filtered readings
  const filteredReadings = useMemo(() => {
    return readings.filter((r) => {
      const matchesMonth = selectedMonth ? r.billing_month.startsWith(selectedMonth) : true;
      const q = readingSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        String(r.resident_name || "").toLowerCase().includes(q) ||
        String(r.resident_code || "").toLowerCase().includes(q) ||
        String(r.room_number || "").toLowerCase().includes(q) ||
        String(r.bed_number || "").toLowerCase().includes(q);

      return matchesMonth && matchesSearch;
    });
  }, [readings, selectedMonth, readingSearch]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return activeResidents.filter((s) => {
      const isEnabled = enabledResidentIds.includes(s.id);
      if (studentFilter === "enabled" && !isEnabled) return false;
      if (studentFilter === "disabled" && isEnabled) return false;

      const q = studentSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        String(s.full_name || "").toLowerCase().includes(q) ||
        String(s.resident_code || "").toLowerCase().includes(q) ||
        String(s.room_number || "").toLowerCase().includes(q) ||
        String(s.bed_number || "").toLowerCase().includes(q)
      );
    });
  }, [activeResidents, enabledResidentIds, studentFilter, studentSearch]);

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
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Top Header Card */}
        <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
              University Girls Hostel
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Meter Reading & Electricity
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Set unit rate, select students charged for electricity bills, record meter readings, and auto-sync with rent bills.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setNewPriceInput(String(defaultUnitRate));
                setShowPriceModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-100"
            >
              <span>⚡</span>
              Rate: <span className="font-bold text-indigo-950">Rs {defaultUnitRate.toFixed(2)} / unit</span>
              <span className="ml-1 text-xs font-normal text-indigo-600 underline">Edit</span>
            </button>

            <button
              type="button"
              onClick={openAddReadingModal}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              + Add New Reading
            </button>
          </div>
        </section>

        {/* Alerts */}
        {error && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 shadow-sm">
            ⚠️ {error}
          </section>
        )}

        {successMessage && (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 shadow-sm">
            ✓ {successMessage}
          </section>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Active Students
              </span>
              <span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                👥
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {activeResidents.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">Currently admitted in hostel</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Electricity Enabled
              </span>
              <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                ⚡
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-emerald-600">
              {enabledStudentsCount} <span className="text-base font-normal text-slate-400">/ {activeResidents.length}</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">Only these are charged electricity bills</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Units ({selectedMonth || "All"})
              </span>
              <span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                📊
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {monthSummary.totalUnits.toFixed(2)} <span className="text-sm font-normal text-slate-400">units</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">Across {monthSummary.totalCount} readings entered</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Meter Charges ({selectedMonth || "All"})
              </span>
              <span className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
                💰
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {formatMoney(monthSummary.totalAmount)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {monthSummary.billedCount} linked to rent bills
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 border-b border-slate-200 bg-white px-6 pt-2 rounded-2xl border shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("readings")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-bold transition ${
              activeTab === "readings"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>📋</span> Meter Readings History
            <span
              className={`ml-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                activeTab === "readings"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {readings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("students")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-bold transition ${
              activeTab === "students"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>⚡</span> Student Selection for Electricity
            <span
              className={`ml-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                activeTab === "students"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {enabledStudentsCount} selected
            </span>
          </button>
        </div>

        {/* Tab 1: Meter Readings History */}
        {activeTab === "readings" && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Month:
                  </label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {selectedMonth && (
                  <button
                    type="button"
                    onClick={() => setSelectedMonth("")}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    View All Months
                  </button>
                )}
              </div>

              <div className="w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Search student, room, bed..."
                  value={readingSearch}
                  onChange={(e) => setReadingSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <tr>
                      <th className="px-5 py-4">Month</th>
                      <th className="px-5 py-4">Student / Resident</th>
                      <th className="px-5 py-4">Room & Bed</th>
                      <th className="px-5 py-4 text-right">Prev Reading</th>
                      <th className="px-5 py-4 text-right">Curr Reading</th>
                      <th className="px-5 py-4 text-right">Units Used</th>
                      <th className="px-5 py-4 text-right">Unit Rate</th>
                      <th className="px-5 py-4 text-right">Total Charge</th>
                      <th className="px-5 py-4">Bill Status</th>
                      <th className="px-5 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={10} className="px-5 py-12 text-center text-slate-500 font-medium">
                          Loading meter readings...
                        </td>
                      </tr>
                    ) : filteredReadings.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-5 py-16 text-center">
                          <div className="mx-auto max-w-md">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 text-2xl font-bold">
                              ⚡
                            </div>
                            <h3 className="mt-3 text-lg font-bold text-slate-900">
                              No meter readings found
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {selectedMonth
                                ? `No meter readings recorded for ${selectedMonth}. Click "+ Add New Reading" to create one.`
                                : "No readings matched your search filter."}
                            </p>
                            <button
                              type="button"
                              onClick={openAddReadingModal}
                              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                            >
                              + Add First Reading
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredReadings.map((r) => (
                        <tr key={r.id} className="transition hover:bg-slate-50/80">
                          <td className="px-5 py-4 font-mono text-xs font-bold text-slate-800">
                            {r.billing_month}
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-900">
                              {r.resident_name}
                            </div>
                            {r.resident_code && (
                              <div className="font-mono text-xs text-slate-400">
                                {r.resident_code}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-medium text-slate-800">
                              Room {r.room_number || "—"}
                            </span>
                            {r.bed_number && (
                              <span className="ml-1 text-xs text-slate-500">
                                (Bed {r.bed_number})
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right font-mono text-slate-600 font-medium">
                            {Number(r.previous_reading).toFixed(2)}
                          </td>
                          <td className="px-5 py-4 text-right font-mono font-bold text-slate-900">
                            {Number(r.current_reading).toFixed(2)}
                          </td>
                          <td className="px-5 py-4 text-right font-mono font-bold text-indigo-600">
                            {Number(r.units_consumed).toFixed(2)}
                          </td>
                          <td className="px-5 py-4 text-right text-xs font-medium text-slate-500">
                            Rs {Number(r.rate_per_unit).toFixed(2)}
                          </td>
                          <td className="px-5 py-4 text-right font-bold text-emerald-600">
                            {formatMoney(Number(r.total_amount))}
                          </td>
                          <td className="px-5 py-4">
                            {r.is_billed ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                                ✓ Billed ({r.bill_number || "Rent Bill"})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                                ⏳ Ready for Rent Bill
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditReadingModal(r)}
                                className="rounded-lg p-2 text-indigo-600 transition hover:bg-indigo-50"
                                title="Edit Reading"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              {!r.is_billed && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReading(r)}
                                  className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
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

        {/* Tab 2: Student Selection for Electricity */}
        {activeTab === "students" && (
          <div className="space-y-5">
            {/* Info Banner */}
            <div className="rounded-3xl border border-indigo-200 bg-indigo-50/70 p-5 text-slate-800 shadow-sm">
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-sm">
                  ⚡
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    Electricity Billing Student Selection
                  </h4>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    Select which students are charged for electricity bills. <strong>Only selected students</strong> will have meter readings billed when creating rent bills or generating automatic monthly bills. Non-selected students will have Rs 0 electricity charge on their rent bills.
                  </p>
                </div>
              </div>
            </div>

            {/* Filter and Actions Bar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStudentFilter("all")}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition shadow-sm ${
                    studentFilter === "all"
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  All Students ({activeResidents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStudentFilter("enabled")}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition shadow-sm ${
                    studentFilter === "enabled"
                      ? "bg-emerald-600 text-white"
                      : "border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  ⚡ Enabled Only ({enabledStudentsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStudentFilter("disabled")}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition shadow-sm ${
                    studentFilter === "disabled"
                      ? "bg-slate-700 text-white"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Disabled ({activeResidents.length - enabledStudentsCount})
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Search student or room..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full sm:w-64 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  type="button"
                  onClick={() => toggleAllResidents(true)}
                  className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 shadow-sm"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => toggleAllResidents(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 shadow-sm"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <tr>
                      <th className="px-5 py-4">Student Name</th>
                      <th className="px-5 py-4">Resident Code</th>
                      <th className="px-5 py-4">Room & Bed</th>
                      <th className="px-5 py-4">Admission Status</th>
                      <th className="px-5 py-4 text-center">Electricity Billing</th>
                      <th className="px-5 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-slate-500 font-medium">
                          Loading students...
                        </td>
                      </tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-16 text-center">
                          <div className="mx-auto max-w-md">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 text-2xl font-bold">
                              👥
                            </div>
                            <h3 className="mt-3 text-lg font-bold text-slate-900">
                              {studentFilter === "enabled"
                                ? "No students currently enabled for electricity"
                                : studentFilter === "disabled"
                                ? "No disabled students found"
                                : "No students match the current filter"}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {studentFilter === "enabled" && enabledStudentsCount === 0
                                ? "Switch to 'All Students' or 'Disabled' tab above to enable students for electricity billing, or click 'Select All'."
                                : studentSearch
                                ? `No students found matching "${studentSearch}". Try clearing the search query.`
                                : "No students found."}
                            </p>
                            {studentFilter !== "all" && (
                              <button
                                type="button"
                                onClick={() => setStudentFilter("all")}
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                              >
                                View All Students ({activeResidents.length})
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s) => {
                        const isEnabled = enabledResidentIds.includes(s.id);
                        return (
                          <tr key={s.id} className="transition hover:bg-slate-50/80">
                            <td className="px-5 py-4 font-bold text-slate-900">
                              {s.full_name}
                            </td>
                            <td className="px-5 py-4 font-mono text-xs text-slate-500">
                              {s.resident_code || "—"}
                            </td>
                            <td className="px-5 py-4">
                              <span className="font-medium text-slate-800">
                                Room {s.room_number || "—"}
                              </span>
                              {s.bed_number && (
                                <span className="ml-1 text-xs text-slate-500">
                                  (Bed {s.bed_number})
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                                {s.status}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-center">
                              {isEnabled ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-bold text-emerald-800">
                                  ⚡ Charged Electricity
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1 text-xs font-medium text-slate-500">
                                  ⚪ Not Charged
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => toggleResidentElectricity(s.id, isEnabled)}
                                className={`rounded-xl px-4 py-2 text-xs font-bold shadow-sm transition ${
                                  isEnabled
                                    ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                    : "bg-emerald-600 text-white hover:bg-emerald-700"
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
          </div>
        )}

        {/* Modal: Add or Edit Reading */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {editingReading ? "Edit Meter Reading" : "Record New Meter Reading"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Units and charge are calculated automatically: (Current - Previous) × Unit Rate
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveReading} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Student / Resident *
                  </label>
                  {editingReading ? (
                    <input
                      readOnly
                      value={editingReading.resident_name}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-800"
                    />
                  ) : enabledResidentsList.length === 0 ? (
                    <div className="mt-1.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                      ⚠️ No students are enabled for electricity billing yet. Please go to the <strong>Student Selection</strong> tab and enable students first.
                    </div>
                  ) : (
                    <select
                      value={formResidentId}
                      onChange={(e) => handleStudentSelectForReading(e.target.value)}
                      required
                      className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Billing Month (YYYY-MM) *
                    </label>
                    <input
                      type="month"
                      required
                      value={formBillingMonth}
                      onChange={(e) => setFormBillingMonth(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Rate per Unit (Rs) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={formRatePerUnit}
                      onChange={(e) => setFormRatePerUnit(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
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
                      className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    <span className="text-[11px] text-slate-400">Auto-filled from prior reading</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
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
                      className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    <span className="text-[11px] text-slate-400">Must be ≥ previous reading</span>
                  </div>
                </div>

                {/* Real-time Calculation Card */}
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-semibold text-indigo-900">
                    <span>⚡ Units Consumed (Current - Previous):</span>
                    <span className="font-mono text-base font-bold">
                      {liveCalculation.units.toFixed(2)} units
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between border-t border-indigo-200 pt-2.5 text-sm font-bold text-slate-900">
                    <span>Total Calculated Charge:</span>
                    <span className="text-xl font-extrabold text-emerald-600">
                      {formatMoney(liveCalculation.total)}
                    </span>
                  </div>
                  <div className="mt-1.5 text-[11px] text-indigo-700">
                    Formula: ({liveCalculation.curr} - {liveCalculation.prev}) × Rs {liveCalculation.rate} = {formatMoney(liveCalculation.total)}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Remarks / Meter Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={formRemarks}
                    onChange={(e) => setFormRemarks(e.target.value)}
                    placeholder="e.g. Sub-meter #3, AC electricity reading"
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReading || !liveCalculation.isValid || !formResidentId}
                    className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {submittingReading ? "Saving..." : editingReading ? "Update Reading" : "Save Meter Reading"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Update Unit Price */}
        {showPriceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <h3 className="text-xl font-bold text-slate-900">
                  Update Electricity Unit Rate
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPriceModal(false)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveUnitPrice} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
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
                      className="w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 py-3 text-base font-bold text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    This rate will be the default for newly recorded meter readings and automatically applied when generating rent bills.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowPriceModal(false)}
                    className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPrice}
                    className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {savingPrice ? "Saving..." : "Save Rate"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
