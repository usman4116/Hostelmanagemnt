/* eslint-disable @next/next/no-img-element -- Existing Supabase photo URLs are not restricted to a configured image host. */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { maintenancePhotoUrl } from "@/lib/maintenanceStorage";

type Row = Record<string, unknown>;
type Request = {
  id: string; request_number: string; resident_id: string | null; admission_id: string | null; room_id: string | null; bed_id: string | null;
  title: string | null; description: string | null; complaint_description: string | null;
  category: string | null; priority: string | null; status: string | null; assigned_to: string | null;
  estimated_cost: number | null; actual_cost: number | null; complaint_date: string | null;
  assigned_date: string | null; completion_date: string | null; completed_at: string | null;
  work_performed: string | null; parts_replaced: string | null; notes: string | null;
  photo_url: string | null; before_photos: unknown; during_photos: unknown; after_photos: unknown;
  created_at: string; updated_at: string;
};
type Photo = { id: string; photo_type: string | null; photo_url: string; created_at: string };
const text = (value: unknown) => value == null ? "" : String(value);
const name = (row: Row | null, keys: string[], fallback = "—") => keys.map((key) => text(row?.[key]).trim()).find(Boolean) || fallback;
const list = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.length > 0) : [];
const money = (value: unknown) => new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(Number(value || 0));

export default function MaintenanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<Request | null>(null);
  const [resident, setResident] = useState<Row | null>(null);
  const [admission, setAdmission] = useState<Row | null>(null);
  const [room, setRoom] = useState<Row | null>(null);
  const [bed, setBed] = useState<Row | null>(null);
  const [photoRows, setPhotoRows] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const [requestResult, photosResult] = await Promise.all([
        supabase.from("maintenance_requests").select("id,request_number,resident_id,admission_id,room_id,bed_id,title,description,complaint_description,category,priority,status,assigned_to,estimated_cost,actual_cost,complaint_date,assigned_date,completion_date,completed_at,work_performed,parts_replaced,notes,photo_url,before_photos,during_photos,after_photos,created_at,updated_at").eq("id", id).maybeSingle(),
        supabase.from("maintenance_photos").select("id,maintenance_request_id,photo_type,photo_url,created_at").eq("maintenance_request_id", id).order("created_at", { ascending: true }),
      ]);
      if (!active) return;
      if (requestResult.error || !requestResult.data) {
        setError("The maintenance request could not be loaded. Please refresh and try again.");
        setLoading(false);
        return;
      }
      const item = requestResult.data as Request;
      const [residentResult, admissionResult, roomResult, bedResult] = await Promise.all([
        item.resident_id ? supabase.from("residents").select("id,full_name,resident_code").eq("id", item.resident_id).maybeSingle() : Promise.resolve({ data: null }),
        item.admission_id ? supabase.from("admissions").select("id,admission_date,status").eq("id", item.admission_id).maybeSingle() : Promise.resolve({ data: null }),
        item.room_id ? supabase.from("rooms").select("id,room_number,building_name,block_name,floor_number").eq("id", item.room_id).maybeSingle() : Promise.resolve({ data: null }),
        item.bed_id ? supabase.from("beds").select("id,bed_number").eq("id", item.bed_id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      if (!active) return;
      setRequest(item);
      setResident((residentResult.data ?? null) as Row | null);
      setAdmission((admissionResult.data ?? null) as Row | null);
      setRoom((roomResult.data ?? null) as Row | null);
      setBed((bedResult.data ?? null) as Row | null);
      setPhotoRows(photosResult.error ? [] : (photosResult.data ?? []) as Photo[]);
      if (photosResult.error) setError("The request loaded, but some maintenance photos could not be retrieved.");
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [id]);

  const galleries = useMemo(() => {
    if (!request) return [];
    const rows = (kind: string) => photoRows.filter((photo) => text(photo.photo_type).trim().toLowerCase() === kind).map((photo) => photo.photo_url);
    const unique = (references: string[]) => Array.from(new Set(references.filter(Boolean))).map(maintenancePhotoUrl);
    return [
      { title: "Before Photos", urls: unique([...list(request.before_photos), ...rows("before"), ...(request.photo_url ? [request.photo_url] : [])]) },
      { title: "During Work Photos", urls: unique([...list(request.during_photos), ...rows("during")]) },
      { title: "After Photos", urls: unique([...list(request.after_photos), ...rows("after")]) },
    ];
  }, [photoRows, request]);

  if (loading) return <main className="min-h-screen bg-slate-50 p-8 text-center text-slate-500">Loading maintenance request...</main>;
  if (!request) return <main className="min-h-screen bg-slate-50 p-8"><div className="mx-auto max-w-4xl rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">{error || "Maintenance request not found."}</div></main>;

  return <main className="min-h-screen bg-slate-50 p-4 sm:p-8"><div className="mx-auto max-w-5xl space-y-6">
    {error && <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</p>}
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><Link href="/maintenance" className="text-sm font-semibold text-indigo-700">Back to Maintenance</Link><div className="mt-4 flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase text-indigo-600">{request.request_number}</p><h1 className="mt-2 text-3xl font-bold">{request.title || "Maintenance Request"}</h1></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">{request.status || "Open"}</span></div></section>
    <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-3"><Info label="Resident" value={name(resident, ["full_name"])}/><Info label="Admission" value={name(admission, ["admission_date", "id"], "Not linked")}/><Info label="Room" value={name(room, ["room_number"])}/><Info label="Bed" value={name(bed, ["bed_number"], "Not linked")}/><Info label="Location" value={[name(room, ["building_name"], ""), name(room, ["block_name"], ""), name(room, ["floor_number"], "")].filter(Boolean).join(" · ") || "—"}/><Info label="Category / Issue Type" value={request.category || "Other"}/><Info label="Priority" value={request.priority || "Medium"}/><Info label="Assigned Person / Vendor" value={request.assigned_to || "Not assigned"}/><Info label="Reported Date" value={(request.complaint_date || request.created_at).slice(0, 10)}/><Info label="Completion Date" value={request.completion_date || "Not completed"}/><Info label="Estimated Cost" value={money(request.estimated_cost)}/><Info label="Actual Cost" value={money(request.actual_cost)}/></section>
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Status Timeline</h2><div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-5"><Timeline label="Created" date={request.created_at}/><Timeline label="Assigned" date={request.assigned_date}/><Timeline label="In Progress" date={["In Progress", "Completed"].includes(request.status || "") ? request.updated_at : null}/><Timeline label="Completed" date={request.completed_at || request.completion_date}/><Timeline label="Cancelled" date={request.status === "Cancelled" ? request.updated_at : null}/></div></section>
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold">Full Request Information</h2><TextBlock label="Description" value={request.description || request.complaint_description || "No description recorded."}/><TextBlock label="Work Performed" value={request.work_performed || "No work details recorded."}/><TextBlock label="Parts Replaced" value={request.parts_replaced || "No replacement parts recorded."}/><TextBlock label="Resolution Notes" value={request.notes || "No resolution notes recorded."}/></section>
    {galleries.map((gallery) => <PhotoGallery key={gallery.title} title={gallery.title} urls={gallery.urls}/>) }
  </div></main>;
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-2 font-semibold">{value}</p></div>; }
function Timeline({ label, date }: { label: string; date: string | null }) { return <div className={`rounded-2xl border p-4 ${date ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}><p className="font-semibold">{label}</p><p className="mt-1 text-xs text-slate-500">{date ? date.slice(0, 10) : "Not recorded"}</p></div>; }
function TextBlock({ label, value }: { label: string; value: string }) { return <div className="mt-5"><h3 className="text-sm font-bold">{label}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{value}</p></div>; }
function PhotoGallery({ title, urls }: { title: string; urls: string[] }) { if (urls.length === 0) return null; return <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">{title}</h2><div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">{urls.map((url, index) => <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer"><img src={url} alt={`${title} ${index + 1}`} className="h-44 w-full rounded-xl border object-cover"/></a>)}</div></section>; }
