"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type DeliveryLog = {
  id: string; event_type: string; entity_id: string; resident_id: string | null;
  requested_channels: string[]; email_status: string | null;
  whatsapp_status: string | null; sms_status: string | null; status: string;
  attempt_count: number; last_error_code: string | null; created_at: string;
  residents: { full_name?: string | null; email?: string | null } | null;
};

const label = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
const statusClass = (status: string | null) => {
  if (status === "sent" || status === "complete") return "bg-emerald-100 text-emerald-700";
  if (status === "failed") return "bg-red-100 text-red-700";
  if (status === "configuration_required" || status === "partial") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
};

export default function NotificationsPage() {
  const [logs, setLogs] = useState<DeliveryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLogs = useCallback(async () => {
    setLoading(true); setError("");
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) { setError("Your admin session could not be verified."); setLoading(false); return; }
    const response = await fetch("/api/notifications/events", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as { logs?: DeliveryLog[]; error?: string } | null;
    if (!response.ok) setError(payload?.error || "Notification logs could not be loaded.");
    else setLogs(payload?.logs ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { const timeout = window.setTimeout(() => void loadLogs(), 0); return () => window.clearTimeout(timeout); }, [loadLogs]);

  const summary = useMemo(() => ({
    total: logs.length,
    complete: logs.filter((item) => item.status === "complete").length,
    attention: logs.filter((item) => !["complete", "processing"].includes(item.status)).length,
  }), [logs]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 p-8 text-white shadow-xl">
          <div><h1 className="text-3xl font-bold">Notification Logs</h1><p className="mt-2 text-blue-100">Email, WhatsApp, and SMS delivery tracking by resident.</p></div>
          <button type="button" onClick={() => void loadLogs()} className="rounded-xl bg-white/15 px-5 py-3 text-sm font-semibold hover:bg-white/25">Refresh</button>
        </section>
        <section className="grid gap-4 sm:grid-cols-3">
          {([['Total deliveries', summary.total], ['Completed', summary.complete], ['Needs attention', summary.attention]] as const).map(([title, value]) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{title}</p><p className="mt-2 text-3xl font-bold text-slate-900">{value}</p></div>
          ))}
        </section>
        {error && <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p>}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-600"><tr><th className="px-5 py-3">Resident / Event</th><th className="px-5 py-3">Channels</th><th className="px-5 py-3">Delivery</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Created</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">Loading notification logs...</td></tr> : logs.length === 0 ? <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">No delivery logs are available.</td></tr> : logs.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-4"><p className="font-semibold text-slate-900">{item.residents?.full_name || item.residents?.email || item.resident_id || "Resident"}</p><p className="mt-1 text-xs text-slate-500">{label(item.event_type)}</p></td>
                  <td className="px-5 py-4 text-slate-600">{(item.requested_channels ?? []).map(label).join(", ") || "—"}</td>
                  <td className="px-5 py-4"><div className="flex flex-wrap gap-2">{([['Email', item.email_status], ['WhatsApp', item.whatsapp_status], ['SMS', item.sms_status]] as const).map(([channel, channelStatus]) => <span key={channel} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(channelStatus)}`}>{channel}: {label(channelStatus || "not requested")}</span>)}</div></td>
                  <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(item.status)}`}>{label(item.status)}</span>{item.attempt_count > 1 && <p className="mt-1 text-xs text-slate-500">{item.attempt_count} attempts</p>}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-600">{new Date(item.created_at).toLocaleString("en-PK")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></section>
      </div>
    </main>
  );
}
