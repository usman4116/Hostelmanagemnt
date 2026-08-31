"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  compareNoticeProminence,
  type NoticeVisibilityRecord,
} from "@/lib/noticeVisibility";

type PopupNotice = NoticeVisibilityRecord & {
  title?: string | null;
  description?: string | null;
  notice_type?: string | null;
};

const acknowledgementKey = (residentId: string, noticeId: string) =>
  `stayhub:notice-popup:${residentId}:${noticeId}`;

export default function ResidentNoticePopup({
  notices,
  residentId,
}: {
  notices: PopupNotice[];
  residentId: string;
}) {
  const popupNotices = useMemo(
    () =>
      notices
        .filter((notice) => notice.show_as_popup === true)
        .sort(compareNoticeProminence),
    [notices],
  );
  const [activeNotice, setActiveNotice] = useState<PopupNotice | null>(null);

  const nextUnacknowledged = useCallback(
    () =>
      popupNotices.find(
        (notice) =>
          window.sessionStorage.getItem(
            acknowledgementKey(residentId, notice.id),
          ) !== "acknowledged",
      ) ?? null,
    [popupNotices, residentId],
  );

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setActiveNotice(nextUnacknowledged()),
      0,
    );
    return () => window.clearTimeout(timeout);
  }, [nextUnacknowledged]);

  function acknowledge() {
    if (!activeNotice) return;
    window.sessionStorage.setItem(
      acknowledgementKey(residentId, activeNotice.id),
      "acknowledged",
    );
    setActiveNotice(null);
  }

  if (!activeNotice) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="resident-notice-popup-title"
        className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide">
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">
            {activeNotice.notice_type || "General"}
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">
            {activeNotice.priority || "Normal"}
          </span>
        </div>
        <h2
          id="resident-notice-popup-title"
          className="mt-5 text-2xl font-bold text-slate-900"
        >
          {activeNotice.title || "Hostel Notice"}
        </h2>
        <p className="mt-4 max-h-[50vh] overflow-y-auto whitespace-pre-wrap text-sm leading-7 text-slate-600">
          {activeNotice.description || "No additional notice details were provided."}
        </p>
        <button
          type="button"
          onClick={acknowledge}
          autoFocus
          className="mt-7 w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Close / Acknowledge
        </button>
      </section>
    </div>
  );
}
