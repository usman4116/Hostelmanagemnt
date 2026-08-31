/* eslint-disable @next/next/no-img-element -- Inspection evidence uses existing Supabase public URLs. */
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { inspectionPhotoUrl } from "@/lib/inspectionStorage";
import { normalizeBedLabel } from "@/lib/bedLabels";
import { supabase } from "@/lib/supabase";
import { getSupabaseErrorMessage } from "@/lib/supabaseErrors";

type Row = Record<string, unknown>;

type Inspection = Row & {
  id: string;
  inspection_number: string | null;
  inspection_date: string;
  inspection_type: string | null;
  inspector_name: string | null;
  resident_id: string | null;
  admission_id: string | null;
  room_id: string | null;
  bed_id: string | null;
  damage_found: boolean | null;
  damage_description: string | null;
  estimated_damage_cost: number | null;
  actual_damage_cost?: number | null;
  notes: string | null;
  status: string | null;
  before_photos: unknown;
  after_photos: unknown;
  photos: unknown;
};

const text = (value: unknown) => value == null ? "" : String(value);
const display = (row: Row | null, keys: string[], fallback = "—") =>
  keys.map((key) => text(row?.[key]).trim()).find(Boolean) || fallback;
const photos = (value: unknown) =>
  (Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.length > 0)
    : []
  ).map(inspectionPhotoUrl);
const unique = (values: string[]) => Array.from(new Set(values));

export default function InspectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [resident, setResident] = useState<Row | null>(null);
  const [admission, setAdmission] = useState<Row | null>(null);
  const [room, setRoom] = useState<Row | null>(null);
  const [bed, setBed] = useState<Row | null>(null);
  const [admissionInspections, setAdmissionInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const inspectionResult = await supabase
      .from("room_inspections")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (inspectionResult.error || !inspectionResult.data) {
      setInspection(null);
      setError(
        inspectionResult.error
          ? getSupabaseErrorMessage(
              inspectionResult.error,
              "Unable to load this inspection.",
            )
          : "This inspection could not be found.",
      );
      setLoading(false);
      return;
    }

    const current = inspectionResult.data as Inspection;
    const [residentResult, admissionResult, roomResult, bedResult, historyResult] =
      await Promise.all([
        current.resident_id
          ? supabase.from("residents").select("*").eq("id", current.resident_id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        current.admission_id
          ? supabase.from("admissions").select("*").eq("id", current.admission_id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        current.room_id
          ? supabase.from("rooms").select("*").eq("id", current.room_id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        current.bed_id
          ? supabase.from("beds").select("*").eq("id", current.bed_id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        current.admission_id
          ? supabase.from("room_inspections").select("*").eq("admission_id", current.admission_id).order("inspection_date", { ascending: true })
          : Promise.resolve({ data: [], error: null }),
      ]);

    const relatedError =
      residentResult.error || admissionResult.error || roomResult.error || bedResult.error || historyResult.error;
    if (relatedError) {
      setError(
        getSupabaseErrorMessage(
          relatedError,
          "The inspection loaded, but some linked details could not be retrieved.",
        ),
      );
    }

    setInspection(current);
    setResident((residentResult.data ?? null) as Row | null);
    setAdmission((admissionResult.data ?? null) as Row | null);
    setRoom((roomResult.data ?? null) as Row | null);
    setBed((bedResult.data ?? null) as Row | null);
    setAdmissionInspections((historyResult.data ?? [current]) as Inspection[]);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  if (loading) {
    return <main className="min-h-screen bg-slate-50 p-8 text-slate-600">Loading inspection...</main>;
  }

  if (!inspection) {
    return <main className="min-h-screen bg-slate-50 p-6"><section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"><h1 className="text-2xl font-bold">Inspection</h1><p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p><Link href="/inspection" className="mt-5 inline-flex font-semibold text-indigo-700">Back to inspections</Link></section></main>;
  }

  const history = admissionInspections.length ? admissionInspections : [inspection];
  const galleries = [
    { title: "Before / Check-in Photos", urls: unique(history.flatMap((item) => photos(item.before_photos))) },
    { title: "After / Check-out Photos", urls: unique(history.flatMap((item) => photos(item.after_photos))) },
    { title: "Additional Damage Evidence", urls: unique(history.flatMap((item) => photos(item.photos))) },
  ];

  return <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">StayHub Inspection Report</p><h1 className="mt-2 text-3xl font-bold">{inspection.inspection_number || "Inspection"}</h1><p className="mt-2 text-sm text-slate-500">Permanent inspection history for the linked admission.</p></div>
          <div className="flex gap-2 print:hidden"><button type="button" onClick={() => window.print()} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Print</button><Link href="/inspection" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold">Back</Link></div>
        </div>
      </section>

      {error && <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</section>}

      <section className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <Info label="Resident" value={display(resident, ["full_name", "name"])}/>
        <Info label="Admission" value={display(admission, ["admission_number", "admission_code", "id"])}/>
        <Info label="Room" value={display(room, ["room_number", "name"])}/>
        <Info label="Bed" value={bed ? normalizeBedLabel(display(bed, ["bed_number", "name"], "")) : "—"}/>
        <Info label="Inspection Type" value={inspection.inspection_type || "—"}/>
        <Info label="Inspection Date" value={inspection.inspection_date}/>
        <Info label="Inspector" value={inspection.inspector_name || "—"}/>
        <Info label="Status" value={inspection.status || "Completed"}/>
        <Info label="Overall Condition" value={display(inspection, ["overall_status"])}/>
        <Info label="Cleanliness" value={display(inspection, ["cleanliness"])}/>
        <Info label="Electrical" value={display(inspection, ["electrical_status"])}/>
        <Info label="Plumbing" value={display(inspection, ["plumbing_status"])}/>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <TextBlock label="Damage Description" value={inspection.damage_found ? inspection.damage_description || "Damage found; no description recorded." : "No damage recorded."}/>
        <TextBlock label="Inspection Notes" value={inspection.notes || "No notes recorded."}/>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Info label="Damage Status" value={inspection.damage_found ? "Damage Found" : "No Damage"}/>
        <Info label="Estimated Damage Cost" value={`Rs ${Number(inspection.estimated_damage_cost || 0).toLocaleString()}`}/>
        <Info label="Actual Damage Cost" value={`Rs ${Number(inspection.actual_damage_cost || 0).toLocaleString()}`}/>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Admission Inspection History</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {history.map((item) => <Link key={item.id} href={`/inspection/${item.id}`} className={`rounded-2xl border p-4 transition hover:border-indigo-300 ${item.id === inspection.id ? "border-indigo-300 bg-indigo-50" : "border-slate-200"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{item.inspection_type || "Inspection"}</p><p className="mt-1 text-sm text-slate-500">{item.inspection_date} · {item.inspection_number || item.id}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{item.status || "Completed"}</span></div><p className={`mt-3 text-sm font-semibold ${item.damage_found ? "text-red-700" : "text-emerald-700"}`}>{item.damage_found ? `Damage found · Est. Rs ${Number(item.estimated_damage_cost || 0).toLocaleString()} · Actual Rs ${Number(item.actual_damage_cost || 0).toLocaleString()}` : "No damage recorded"}</p></Link>)}
        </div>
      </section>

      {galleries.map((gallery) => <section key={gallery.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">{gallery.title}</h2>{gallery.urls.length === 0 ? <p className="mt-3 text-sm text-slate-500">No photos recorded.</p> : <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{gallery.urls.map((url, index) => <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"><img src={url} alt={`${gallery.title} ${index + 1}`} className="h-48 w-full object-cover"/><p className="p-3 text-xs font-semibold text-slate-600">Photo {index + 1} · Open full size</p></a>)}</div>}</section>)}
    </div>
  </main>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 font-semibold text-slate-900">{value}</p></article>;
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold">{label}</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{value}</p></article>;
}
