"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminLogoutButton() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError("");

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setLogoutError(error.message || "Unable to log out. Please try again.");
        return;
      }

      router.replace("/admin123");
      router.refresh();
    } catch {
      setLogoutError("Unable to log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void handleLogout()}
        disabled={loggingOut}
        className="rounded-xl border border-red-200 bg-white px-5 py-3 font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60 dark:border-red-900 dark:bg-slate-800 dark:text-red-300 dark:hover:bg-red-950/60"
      >
        {loggingOut ? "Logging out..." : "Logout"}
      </button>
      {logoutError && (
        <p role="alert" className="max-w-xs text-right text-sm text-red-600 dark:text-red-300">
          {logoutError}
        </p>
      )}
    </div>
  );
}
