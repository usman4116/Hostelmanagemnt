"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { resolveAuthenticatedResident } from "@/lib/residentPortalAuth";
import { isNoticeVisibleToResident } from "@/lib/noticeVisibility";

type Notice = { id: string; title: string; description: string; notice_type: string | null; target_audience: string | null; audience: string | null; resident_id: string | null; room_id: string | null; priority: string | null; status: string | null; publish_date: string | null; expiry_date: string | null; is_active: boolean | null; pinned: boolean | null };
const text = (value: unknown) => value == null ? "" : String(value);

export default function ResidentNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    const auth = await resolveAuthenticatedResident();
    if (!auth.resident) { setError(auth.error || "Your resident profile could not be verified."); setLoading(false); return; }
    const [noticeResult, admissionResult, recipientResult] = await Promise.all([
      supabase.from("notices").select("id,title,description,notice_type,target_audience,audience,resident_id,room_id,priority,status,publish_date,expiry_date,is_active,pinned").eq("status", "Published").order("pinned", { ascending: false }).order("publish_date", { ascending: false }),
      supabase.from("admissions").select("room_id,status").eq("resident_id", auth.resident.id).ilike("status", "Active").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("notice_recipients").select("notice_id").eq("resident_id", auth.resident.id),
    ]);
    if (noticeResult.error || admissionResult.error || recipientResult.error) { setError("Your notices could not be loaded. Please refresh and try again."); setLoading(false); return; }
    const roomId = text(admissionResult.data?.room_id);
    const selectedNoticeIds = new Set((recipientResult.data ?? []).map((row) => text(row.notice_id)));
    const visible = ((noticeResult.data ?? []) as Notice[]).filter((notice) =>
      isNoticeVisibleToResident(notice, auth.resident.id, roomId, undefined, selectedNoticeIds),
    );
    setNotices(visible); setLoading(false);
  }, []);
  useEffect(() => { const timeout = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timeout); }, [load]);

  return <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-5xl space-y-6"><section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">University Girls Hostel Resident Portal</p><h1 className="mt-2 text-3xl font-bold">Notices</h1><p className="mt-1 text-sm text-slate-500">Published hostel announcements intended for you or your room.</p><Link href="/resident-portal" className="mt-4 inline-flex text-sm font-semibold text-indigo-700">Back to portal</Link></section>{error && <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p>}<section className="space-y-4">{loading ? <p className="rounded-3xl bg-white p-10 text-center text-slate-500">Loading notices...</p> : notices.length === 0 ? <p className="rounded-3xl bg-white p-10 text-center text-slate-500">No current notices are available.</p> : notices.map((notice) => <article key={notice.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div>{notice.pinned && <p className="text-xs font-bold uppercase text-indigo-600">Pinned Notice</p>}<h2 className="mt-1 text-xl font-bold">{notice.title}</h2></div><span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">{notice.priority || notice.notice_type || "General"}</span></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{notice.description}</p><div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-2"><p><strong>Published:</strong> {notice.publish_date || "—"}</p><p><strong>Expires:</strong> {notice.expiry_date || "No expiry"}</p></div></article>)}</section></div></main>;
}
