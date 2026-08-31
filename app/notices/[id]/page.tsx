"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getSupabaseErrorMessage } from "@/lib/supabaseErrors";

type Notice = {
  id: string;
  notice_number: string | null;
  title: string;
  description: string;
  notice_type: string | null;
  target_audience: string | null;
  audience: string | null;
  resident_id: string | null;
  room_id: string | null;
  priority: string | null;
  status: string | null;
  publish_date: string | null;
  expiry_date: string | null;
  is_active: boolean | null;
  pinned: boolean | null;
  show_as_popup: boolean | null;
};

export default function NoticeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const result = await supabase
      .from("notices")
      .select(
        "id,notice_number,title,description,notice_type,target_audience,audience,resident_id,room_id,priority,status,publish_date,expiry_date,is_active,pinned,show_as_popup",
      )
      .eq("id", id)
      .maybeSingle();

    if (result.error || !result.data) {
      setNotice(null);
      setError(
        getSupabaseErrorMessage(result.error, "This notice could not be found."),
      );
    } else {
      setNotice(result.data as Notice);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href="/notices"
          className="inline-flex text-sm font-semibold text-indigo-700"
        >
          Back to notices
        </Link>

        {loading ? (
          <p className="rounded-3xl bg-white p-10 text-center text-slate-500">
            Loading notice...
          </p>
        ) : error || !notice ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error || "This notice could not be found."}
          </p>
        ) : (
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
                  {notice.notice_number || "Historical notice"}
                </p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900">
                  {notice.title}
                </h1>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                {notice.status || "Legacy"}
              </span>
            </div>

            <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {notice.description}
            </p>

            <dl className="mt-8 grid gap-4 rounded-2xl bg-slate-50 p-5 text-sm sm:grid-cols-2">
              <Detail label="Type" value={notice.notice_type || "General"} />
              <Detail label="Priority" value={notice.priority || "Normal"} />
              <Detail
                label="Audience"
                value={notice.audience || notice.target_audience || "Legacy"}
              />
              <Detail label="Published" value={notice.publish_date || "Not set"} />
              <Detail label="Expires" value={notice.expiry_date || "No expiry"} />
              <Detail label="Popup" value={notice.show_as_popup ? "Enabled" : "Disabled"} />
              <Detail label="Pinned" value={notice.pinned ? "Yes" : "No"} />
              <Detail label="Active flag" value={notice.is_active === false ? "No" : "Yes"} />
            </dl>

            <p className="mt-6 rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
              This is a read-only record. Edit or archive current notices from the
              Notices list; archived history cannot be changed or deleted.
            </p>
          </article>
        )}
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-slate-900">{label}</dt>
      <dd className="mt-1 text-slate-600">{value}</dd>
    </div>
  );
}
