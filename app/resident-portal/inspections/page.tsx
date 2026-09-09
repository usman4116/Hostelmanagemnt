/* eslint-disable @next/next/no-img-element -- Existing Supabase photo URLs are not restricted to a configured image host. */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { resolveAuthenticatedResident } from "@/lib/residentPortalAuth";
import { normalizeBedLabel } from "@/lib/bedLabels";
import { inspectionPhotoUrl } from "@/lib/inspectionStorage";

type Row = Record<string, unknown>;

type ResidentInspection = {
  id: string;
  inspection_number: string | null;
  inspection_date: string;
  inspection_type: string | null;
  inspector_name: string | null;
  room_id: string | null;
  bed_id: string | null;
  cleanliness: string | null;
  electrical_status: string | null;
  plumbing_status: string | null;
  furniture_condition: string | null;
  wall_floor_status: string | null;
  overall_status: string | null;
  notes: string | null;
  damage_found: boolean | null;
  damage_description: string | null;
  estimated_damage_cost: number | null;
  actual_damage_cost: number | null;
  status: string | null;
  before_photos: unknown;
  after_photos: unknown;
  photos: unknown;
  created_at: string;
  room_number?: string;
  bed_number?: string;
};

type LegacyInspection = {
  id: string;
  inspection_date: string;
  damage_notes: string | null;
  before_photo: string | null;
  after_photo: string | null;
};

const text = (value: unknown) => (value == null ? "" : String(value));
const photos = (input: unknown) =>
  (Array.isArray(input)
    ? input.filter((item): item is string => typeof item === "string" && item.length > 0)
    : []
  ).map(inspectionPhotoUrl);
const unique = (values: string[]) => Array.from(new Set(values));

function money(value: unknown) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function statusBadgeClass(status: string | null) {
  const s = String(status || "").toLowerCase();
  if (s === "completed") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (s === "pending") return "bg-amber-100 text-amber-800 border-amber-200";
  if (s === "cancelled") return "bg-slate-200 text-slate-700 border-slate-300";
  return "bg-blue-100 text-blue-800 border-blue-200";
}

export default function ResidentInspectionsPage() {
  const [inspections, setInspections] = useState<ResidentInspection[]>([]);
  const [legacy, setLegacy] = useState<LegacyInspection[]>([]);
  const [selectedInspection, setSelectedInspection] = useState<ResidentInspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const auth = await resolveAuthenticatedResident();
      if (!auth.resident) {
        setError(auth.error || "Your resident profile could not be verified.");
        setLoading(false);
        return;
      }

      // Query room_inspections using valid columns only
      const [currentResult, legacyResult, roomsResult, bedsResult] = await Promise.all([
        supabase
          .from("room_inspections")
          .select(
            "id,inspection_number,inspection_date,inspection_type,inspector_name,room_id,bed_id,cleanliness,electrical_status,plumbing_status,furniture_condition,wall_floor_status,overall_status,notes,damage_found,damage_description,estimated_damage_cost,actual_damage_cost,status,before_photos,after_photos,photos,created_at"
          )
          .eq("resident_id", auth.resident.id)
          .order("inspection_date", { ascending: false }),
        supabase
          .from("inspections")
          .select("id,inspection_date,damage_notes,before_photo,after_photo")
          .eq("resident_id", auth.resident.id)
          .order("inspection_date", { ascending: false }),
        supabase.from("rooms").select("id,room_number"),
        supabase.from("beds").select("id,bed_number"),
      ]);

      if (currentResult.error) {
        console.error("Inspections load error:", currentResult.error);
        setError("Your inspection records could not be loaded. Please refresh and try again.");
        setLoading(false);
        return;
      }

      const roomMap = new Map((roomsResult.data ?? []).map((r) => [r.id, String(r.room_number ?? "")]));
      const bedMap = new Map((bedsResult.data ?? []).map((b) => [b.id, String(b.bed_number ?? "")]));

      const enriched: ResidentInspection[] = (currentResult.data ?? []).map((item) => ({
        ...item,
        room_number: item.room_id ? roomMap.get(item.room_id) || "—" : "—",
        bed_number: item.bed_id ? normalizeBedLabel(bedMap.get(item.bed_id) || "") : "—",
      }));

      setInspections(enriched);
      setLegacy((legacyResult.data ?? []) as LegacyInspection[]);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Failed to load inspection history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const modalGalleries = useMemo(() => {
    if (!selectedInspection) return [];
    return [
      {
        title: "Before / Check-in Photos",
        urls: unique(photos(selectedInspection.before_photos)),
      },
      {
        title: "After / Check-out Photos",
        urls: unique(photos(selectedInspection.after_photos)),
      },
      {
        title: "Damage & Inspection Evidence",
        urls: unique(photos(selectedInspection.photos)),
      },
    ];
  }, [selectedInspection]);

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
              University Girls Hostel Resident Portal
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">My Inspections</h1>
            <p className="mt-1 text-sm text-slate-500">
              View your room inspection reports, condition findings, and damage assessments.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              href="/resident-portal"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              ← Back to Portal
            </Link>
          </div>
        </section>

        {error && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 shadow-sm">
            ⚠️ {error}
          </section>
        )}

        {loading ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 text-xl font-bold">
              📋
            </div>
            <p className="mt-4 font-semibold text-slate-700">Loading your inspections...</p>
          </section>
        ) : inspections.length + legacy.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 text-xl font-bold">
              📋
            </div>
            <h3 className="mt-4 font-bold text-slate-800 text-lg">No Inspection Records Found</h3>
            <p className="mt-1 text-sm text-slate-500">
              Your room has not had any inspection reports recorded yet.
            </p>
          </section>
        ) : (
          <section className="space-y-4">
            {inspections.map((item) => {
              const allPhotos = [
                ...photos(item.before_photos),
                ...photos(item.after_photos),
                ...photos(item.photos),
              ];

              return (
                <article
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <p className="font-mono text-xs font-bold uppercase tracking-wider text-indigo-600">
                        {item.inspection_number || "INS-RECORD"}
                      </p>
                      <h2 className="mt-1 text-xl font-bold text-slate-900">
                        {item.inspection_type || "Room Inspection"}
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        Date: <strong>{item.inspection_date.slice(0, 10)}</strong> · Room:{" "}
                        <strong>{item.room_number || "—"}</strong> · Bed:{" "}
                        <strong>{item.bed_number || "—"}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border ${statusBadgeClass(
                          item.status
                        )}`}
                      >
                        {item.status || "Completed"}
                      </span>

                      <button
                        type="button"
                        onClick={() => setSelectedInspection(item)}
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700"
                      >
                        View Full Report
                      </button>

                      <Link
                        href={`/resident-portal/inspections/${item.id}`}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Print / Share
                      </Link>
                    </div>
                  </div>

                  {/* Condition Summary */}
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    <ScoreCard label="Overall" value={item.overall_status || "Good"} />
                    <ScoreCard label="Cleanliness" value={item.cleanliness || "Good"} />
                    <ScoreCard label="Electrical" value={item.electrical_status || "Good"} />
                    <ScoreCard label="Plumbing" value={item.plumbing_status || "Good"} />
                    <ScoreCard label="Furniture" value={item.furniture_condition || "Good"} />
                    <ScoreCard label="Wall & Floor" value={item.wall_floor_status || "Good"} />
                  </div>

                  {/* Damage Alert if any */}
                  {Boolean(item.damage_found) && (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                      <div className="flex items-start gap-2">
                        <span className="font-bold">⚠️ Damage Noted:</span>
                        <span>{item.damage_description || "Damage detected during inspection."}</span>
                      </div>
                      {(Number(item.estimated_damage_cost || 0) > 0 || Number(item.actual_damage_cost || 0) > 0) && (
                        <div className="mt-2 text-xs font-semibold">
                          Estimated Cost: {money(item.estimated_damage_cost)} · Actual Cost:{" "}
                          {money(item.actual_damage_cost)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {item.notes && (
                    <p className="mt-4 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <strong>Inspector Notes:</strong> {item.notes}
                    </p>
                  )}

                  {/* Photos preview */}
                  {allPhotos.length > 0 && (
                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                        Inspection Evidence Photos ({allPhotos.length})
                      </p>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {allPhotos.slice(0, 4).map((url, index) => (
                          <a
                            key={`${url}-${index}`}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="overflow-hidden rounded-xl border border-slate-200 group"
                          >
                            <img
                              src={url}
                              alt={`Inspection Evidence ${index + 1}`}
                              className="h-28 w-full object-cover transition group-hover:scale-105"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}

            {legacy.map((item) => (
              <article
                key={`legacy-${item.id}`}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="text-xs font-bold uppercase text-slate-500">Historical Inspection</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">{item.inspection_date.slice(0, 10)}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  {item.damage_notes || "No damage notes recorded."}
                </p>
              </article>
            ))}
          </section>
        )}

        {/* Detailed Inspection Report Modal */}
        {selectedInspection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl my-8">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
                    Official Inspection Report
                  </p>
                  <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
                    {selectedInspection.inspection_number || "Room Inspection Report"}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                  >
                    Print Report
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedInspection(null)}
                    className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 transition"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="mt-6 space-y-6">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 rounded-2xl bg-slate-50 p-4 border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-500 uppercase font-bold">Inspection Type</span>
                    <p className="mt-1 font-bold text-slate-900 text-sm">{selectedInspection.inspection_type || "—"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-bold">Inspection Date</span>
                    <p className="mt-1 font-bold text-slate-900 text-sm">{selectedInspection.inspection_date.slice(0, 10)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-bold">Room & Bed</span>
                    <p className="mt-1 font-bold text-slate-900 text-sm">
                      Room {selectedInspection.room_number || "—"} ({selectedInspection.bed_number || "—"})
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-bold">Inspector</span>
                    <p className="mt-1 font-bold text-slate-900 text-sm">{selectedInspection.inspector_name || "Hostel Staff"}</p>
                  </div>
                </div>

                {/* Score conditions */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
                    Condition Ratings & Checks
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <ScoreCard label="Overall Condition" value={selectedInspection.overall_status || "Good"} />
                    <ScoreCard label="Cleanliness" value={selectedInspection.cleanliness || "Good"} />
                    <ScoreCard label="Electrical Fixtures" value={selectedInspection.electrical_status || "Good"} />
                    <ScoreCard label="Plumbing & Water" value={selectedInspection.plumbing_status || "Good"} />
                    <ScoreCard label="Furniture Condition" value={selectedInspection.furniture_condition || "Good"} />
                    <ScoreCard label="Walls & Flooring" value={selectedInspection.wall_floor_status || "Good"} />
                  </div>
                </div>

                {/* Damage assessment */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Damage Assessment
                  </h3>
                  <div
                    className={`rounded-2xl border p-4 text-sm ${
                      selectedInspection.damage_found
                        ? "border-red-200 bg-red-50 text-red-800"
                        : "border-emerald-200 bg-emerald-50 text-emerald-800"
                    }`}
                  >
                    <p className="font-bold">
                      {selectedInspection.damage_found ? "⚠️ Damage Detected" : "✓ No Damage Found"}
                    </p>
                    {selectedInspection.damage_found && (
                      <>
                        <p className="mt-1.5 text-xs text-red-700 leading-relaxed">
                          {selectedInspection.damage_description || "No specific damage description recorded."}
                        </p>
                        <div className="mt-3 flex gap-4 text-xs font-bold">
                          <span>Estimated Cost: {money(selectedInspection.estimated_damage_cost)}</span>
                          <span>Actual Cost: {money(selectedInspection.actual_damage_cost)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selectedInspection.notes && (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Inspector Notes & Recommendations
                    </h3>
                    <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 whitespace-pre-wrap">
                      {selectedInspection.notes}
                    </p>
                  </div>
                )}

                {/* Galleries */}
                {modalGalleries.map((gal) => {
                  if (gal.urls.length === 0) return null;
                  return (
                    <div key={gal.title}>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-2">
                        {gal.title}
                      </h3>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {gal.urls.map((url, i) => (
                          <a
                            key={`${url}-${i}`}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl overflow-hidden border border-slate-200"
                          >
                            <img src={url} alt={`${gal.title} ${i + 1}`} className="h-32 w-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-4">
                <Link
                  href={`/resident-portal/inspections/${selectedInspection.id}`}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  Open Dedicated Report Page →
                </Link>

                <button
                  type="button"
                  onClick={() => setSelectedInspection(null)}
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition"
                >
                  Close Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function ScoreCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-center">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-slate-900 text-sm">{value}</p>
    </div>
  );
}
