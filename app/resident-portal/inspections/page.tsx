/* eslint-disable @next/next/no-img-element -- Existing Supabase photo URLs are not restricted to a configured image host. */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { resolveAuthenticatedResident } from "@/lib/residentPortalAuth";

type Row = Record<string, unknown>;
const text = (value: unknown) => value == null ? "" : String(value);
const value = (row: Row, keys: string[], fallback = "—") => keys.map((key) => text(row[key]).trim()).find(Boolean) || fallback;
const photos = (input: unknown) => Array.isArray(input) ? input.filter((item): item is string => typeof item === "string" && item.length > 0) : [];

export default function ResidentInspectionsPage() {
  const [current, setCurrent] = useState<Row[]>([]);
  const [legacy, setLegacy] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const auth = await resolveAuthenticatedResident();
    if (!auth.resident) { setError(auth.error || "Your resident profile could not be verified."); setLoading(false); return; }
    const [currentResult, legacyResult] = await Promise.all([
      supabase.from("room_inspections").select("id,inspection_number,inspection_date,inspection_type,area_type,area_name,overall_status,cleanliness,electrical_status,plumbing_status,furniture_condition,damage_found,damage_description,recommendations,status,before_photos,after_photos,photos").eq("resident_id", auth.resident.id).order("inspection_date", { ascending: false }),
      supabase.from("inspections").select("id,inspection_date,damage_notes,before_photo,after_photo").eq("resident_id", auth.resident.id).order("inspection_date", { ascending: false }),
    ]);
    if (currentResult.error || legacyResult.error) setError("Your inspection history could not be loaded. Please refresh and try again.");
    else { setCurrent((currentResult.data ?? []) as Row[]); setLegacy((legacyResult.data ?? []) as Row[]); }
    setLoading(false);
  }, []);

  useEffect(() => { const timeout = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timeout); }, [load]);

  return <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-6xl space-y-6">
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">University Girls Hostel Resident Portal</p><h1 className="mt-2 text-3xl font-bold">My Inspections</h1><p className="mt-1 text-sm text-slate-500">View your room inspection history and condition findings.</p><Link href="/resident-portal" className="mt-4 inline-flex text-sm font-semibold text-indigo-700">Back to portal</Link></section>
    {error && <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p>}
    {loading ? <p className="rounded-3xl bg-white p-8 text-center text-slate-500">Loading your inspections...</p> : current.length + legacy.length === 0 ? <p className="rounded-3xl bg-white p-8 text-center text-slate-500">No inspection history is available.</p> : <section className="space-y-4">
      {current.map((item) => { const gallery = [...photos(item.before_photos), ...photos(item.after_photos), ...photos(item.photos)]; return <article key={text(item.id)} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase text-indigo-600">{value(item, ["inspection_number"], "Inspection")}</p><h2 className="mt-1 text-xl font-bold">{value(item, ["inspection_type"], "Room inspection")}</h2><p className="mt-1 text-sm text-slate-500">{value(item, ["inspection_date"]).slice(0, 10)} · {value(item, ["area_name", "area_type"], "Room")}</p></div><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">{value(item, ["status"], "Completed")}</span></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Info label="Overall condition" value={value(item, ["overall_status"])}/><Info label="Cleanliness" value={value(item, ["cleanliness"])}/><Info label="Electrical" value={value(item, ["electrical_status"])}/><Info label="Plumbing" value={value(item, ["plumbing_status"])}/></div>{Boolean(item.damage_found) && <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">Damage noted: {value(item, ["damage_description"])}</p>}{value(item, ["recommendations"], "") && <p className="mt-4 text-sm text-slate-600">Recommendations: {value(item, ["recommendations"])}</p>}{gallery.length > 0 && <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">{gallery.map((url, index) => <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer"><img src={url} alt={`Inspection photo ${index + 1}`} className="h-36 w-full rounded-xl border object-cover"/></a>)}</div>}</article>; })}
      {legacy.map((item) => <article key={`legacy-${text(item.id)}`} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase text-slate-500">Historical inspection</p><h2 className="mt-2 text-lg font-bold">{value(item, ["inspection_date"]).slice(0, 10)}</h2><p className="mt-2 text-sm text-slate-600">{value(item, ["damage_notes"], "No damage notes recorded.")}</p></article>)}
    </section>}
  </div></main>;
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-2 font-semibold">{value}</p></div>; }
