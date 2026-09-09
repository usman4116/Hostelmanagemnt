/* eslint-disable @next/next/no-img-element -- Inspection evidence uses existing Supabase public URLs. */
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { inspectionPhotoUrl } from "@/lib/inspectionStorage";
import { normalizeBedLabel } from "@/lib/bedLabels";
import { supabase } from "@/lib/supabase";
import { resolveAuthenticatedResident } from "@/lib/residentPortalAuth";

type Row = Record<string, unknown>;

type ResidentInspection = {
  id: string;
  inspection_number: string | null;
  inspection_date: string;
  inspection_type: string | null;
  inspector_name: string | null;
  resident_id: string | null;
  admission_id: string | null;
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
};

const text = (value: unknown) => (value == null ? "" : String(value));
const photos = (value: unknown) =>
  (Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.length > 0)
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

export default function ResidentInspectionReportPage() {
  const { id } = useParams<{ id: string }>();
  const [inspection, setInspection] = useState<ResidentInspection | null>(null);
  const [resident, setResident] = useState<Row | null>(null);
  const [room, setRoom] = useState<Row | null>(null);
  const [bed, setBed] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const auth = await resolveAuthenticatedResident();
      if (!auth.resident) {
        setError("Your resident profile could not be verified.");
        setLoading(false);
        return;
      }

      const { data, error: inspError } = await supabase
        .from("room_inspections")
        .select(
          "id,inspection_number,inspection_date,inspection_type,inspector_name,resident_id,admission_id,room_id,bed_id,cleanliness,electrical_status,plumbing_status,furniture_condition,wall_floor_status,overall_status,notes,damage_found,damage_description,estimated_damage_cost,actual_damage_cost,status,before_photos,after_photos,photos,created_at"
        )
        .eq("id", id)
        .maybeSingle();

      if (inspError || !data) {
        setError("Inspection report not found or could not be loaded.");
        setLoading(false);
        return;
      }

      // Verify this inspection belongs to this resident
      if (data.resident_id && data.resident_id !== auth.resident.id) {
        setError("You do not have access to view this inspection report.");
        setLoading(false);
        return;
      }

      const current = data as ResidentInspection;

      const [residentResult, roomResult, bedResult] = await Promise.all([
        current.resident_id
          ? supabase.from("residents").select("id,full_name,resident_code,phone").eq("id", current.resident_id).maybeSingle()
          : Promise.resolve({ data: null }),
        current.room_id
          ? supabase.from("rooms").select("id,room_number,building_name,block_name,floor_number").eq("id", current.room_id).maybeSingle()
          : Promise.resolve({ data: null }),
        current.bed_id
          ? supabase.from("beds").select("id,bed_number").eq("id", current.bed_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      setInspection(current);
      setResident(residentResult.data as Row | null);
      setRoom(roomResult.data as Row | null);
      setBed(bedResult.data as Row | null);
    } catch (err) {
      console.error("Load error:", err);
      setError("Failed to load inspection report.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8 text-center text-slate-600">
        <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="font-semibold">Loading inspection report...</p>
        </div>
      </main>
    );
  }

  if (!inspection) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Inspection Report</h1>
          <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error || "Inspection report not found."}</p>
          <Link
            href="/resident-portal/inspections"
            className="mt-5 inline-flex font-semibold text-indigo-700 hover:underline"
          >
            ← Back to Inspections
          </Link>
        </section>
      </main>
    );
  }

  const galleries = [
    { title: "Before / Check-in Photos", urls: unique(photos(inspection.before_photos)) },
    { title: "After / Check-out Photos", urls: unique(photos(inspection.after_photos)) },
    { title: "Damage & Evidence Photos", urls: unique(photos(inspection.photos)) },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Printable Header */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
                University Girls Hostel
              </p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">
                {inspection.inspection_number || "Room Inspection Report"}
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Official room condition and inspection record.
              </p>
            </div>
            <div className="flex gap-2 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
              >
                Print Report
              </button>
              <Link
                href="/resident-portal/inspections"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
              >
                Back
              </Link>
            </div>
          </div>
        </section>

        {/* Key Info Grid */}
        <section className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          <Info label="Resident" value={text(resident?.full_name) || "—"} />
          <Info label="Room" value={room ? `Room ${text(room.room_number)}` : "—"} />
          <Info label="Bed" value={bed ? normalizeBedLabel(text(bed.bed_number)) : "—"} />
          <Info label="Inspection Type" value={inspection.inspection_type || "—"} />
          <Info label="Inspection Date" value={inspection.inspection_date.slice(0, 10)} />
          <Info label="Inspector" value={inspection.inspector_name || "Hostel Staff"} />
          <Info label="Status" value={inspection.status || "Completed"} />
          <Info label="Damage Found?" value={inspection.damage_found ? "Yes (Damages Noted)" : "No Damage"} />
        </section>

        {/* Condition Ratings */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-700 mb-4">
            Room Condition Assessment
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <RatingCard label="Overall" value={inspection.overall_status || "Good"} />
            <RatingCard label="Cleanliness" value={inspection.cleanliness || "Good"} />
            <RatingCard label="Electrical" value={inspection.electrical_status || "Good"} />
            <RatingCard label="Plumbing" value={inspection.plumbing_status || "Good"} />
            <RatingCard label="Furniture" value={inspection.furniture_condition || "Good"} />
            <RatingCard label="Wall & Floor" value={inspection.wall_floor_status || "Good"} />
          </div>
        </section>

        {/* Damage & Notes */}
        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Damage Assessment</h3>
            <p
              className={`mt-3 rounded-2xl p-4 text-sm ${
                inspection.damage_found ? "bg-red-50 text-red-800 border border-red-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
              }`}
            >
              {inspection.damage_found
                ? inspection.damage_description || "Damage recorded."
                : "No damages were recorded during this inspection."}
            </p>
            {inspection.damage_found && (
              <div className="mt-4 flex gap-4 text-xs font-bold text-slate-700">
                <span>Estimated Cost: {money(inspection.estimated_damage_cost)}</span>
                <span>Actual Cost: {money(inspection.actual_damage_cost)}</span>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Inspector Notes</h3>
            <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 border border-slate-100 whitespace-pre-wrap">
              {inspection.notes || "No additional notes recorded for this inspection."}
            </p>
          </div>
        </section>

        {/* Photo Galleries */}
        {galleries.map((gallery) => {
          if (gallery.urls.length === 0) return null;
          return (
            <section key={gallery.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">{gallery.title}</h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {gallery.urls.map((url, i) => (
                  <a
                    key={`${url}-${i}`}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm"
                  >
                    <img src={url} alt={`${gallery.title} ${i + 1}`} className="h-44 w-full object-cover" />
                  </a>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900 text-sm">{value}</p>
    </div>
  );
}

function RatingCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-slate-900 text-sm">{value}</p>
    </div>
  );
}
