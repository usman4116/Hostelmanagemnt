"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ProfileDropdown from "@/components/layout/ProfileDropdown";
import Sidebar from "@/components/layout/Sidebar";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import DashboardStats from "@/components/dashboard/DashboardStats";
import { buildDashboardSummary, type DashboardData, type DashboardTask } from "@/lib/dashboardData";
import { supabase } from "@/lib/supabase";
import { getSupabaseErrorMessage } from "@/lib/supabaseErrors";
import { usePermissions } from "@/lib/usePermissions";

const emptyData: DashboardData = {
  residents: [], admissions: [], contracts: [], bills: [], payments: [],
  receipts: [], rooms: [], beds: [], maintenance: [], inspections: [], notices: [],
};

const quickActions = [
  { icon: "👤", title: "Add Resident", description: "Register a new resident.", href: "/residents" },
  { icon: "🛏️", title: "Assign Room", description: "Allocate room or bed.", href: "/admissions" },
  { icon: "💳", title: "Generate Billing", description: "Generate monthly rent and electricity bills.", href: "/billing" },
  { icon: "📄", title: "Contracts", description: "Manage resident contracts.", href: "/contracts" },
];

const taskTone: Record<DashboardTask["tone"], string> = {
  red: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200",
  amber: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
  blue: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-200",
  slate: "border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100",
};

const activityTone = {
  blue: "border-blue-600",
  green: "border-green-600",
  purple: "border-purple-600",
  orange: "border-orange-500",
  slate: "border-slate-500",
};

function formatActivityDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
}

export default function DashboardPage() {
  const { hasPermission, loading: permsLoading, isSuperAdmin } = usePermissions();
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAllActivity, setShowAllActivity] = useState(false);

  const canAccessDashboard = permsLoading || isSuperAdmin || hasPermission("dashboard");

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError("");

    const results = await Promise.all([
      supabase.from("residents").select("id,full_name,resident_code,status,created_at,updated_at").order("created_at", { ascending: false }),
      supabase.from("admissions").select("id,admission_number,resident_id,room_id,bed_id,status,deposit_status,expected_leaving_date,created_at,updated_at").order("created_at", { ascending: false }),
      supabase.from("contracts").select("id,contract_number,resident_id,admission_id,status,contract_status,resident_signature,resident_signature_url,resident_signature_status,signed_by_resident,signed_at,contract_content,terms,created_at,updated_at").order("created_at", { ascending: false }),
      supabase.from("bills").select("id,bill_number,resident_id,rent_amount,total_amount,due_date,bill_status,created_at,updated_at").order("created_at", { ascending: false }),
      supabase.from("payments").select("id,payment_number,bill_id,resident_id,amount,payment_status,verified_at,created_at,updated_at").order("created_at", { ascending: false }),
      supabase.from("payment_receipts").select("id,resident_id,bill_id,status,verified_at,created_at,updated_at").order("created_at", { ascending: false }),
      supabase.from("maintenance_requests").select("id,request_number,resident_id,title,priority,status,completed_at,created_at,updated_at").order("created_at", { ascending: false }),
      supabase.from("room_inspections").select("id,inspection_number,resident_id,inspection_type,status,inspection_date,created_at,updated_at").order("created_at", { ascending: false }),
      supabase.from("notices").select("id,notice_number,title,status,is_active,publish_date,expiry_date,created_at,updated_at").order("created_at", { ascending: false }),
      supabase.from("rooms").select("id,status"),
      supabase.from("beds").select("id,room_id,status"),
    ]);

    const failed = results.find((result) => result.error)?.error;
    if (failed) {
      setError(getSupabaseErrorMessage(failed, "Dashboard data could not be loaded. Please refresh and try again."));
    } else {
      setData({
        residents: results[0].data ?? [], admissions: results[1].data ?? [],
        contracts: results[2].data ?? [], bills: results[3].data ?? [],
        payments: results[4].data ?? [], receipts: results[5].data ?? [],
        maintenance: results[6].data ?? [], inspections: results[7].data ?? [],
        notices: results[8].data ?? [], rooms: results[9].data ?? [],
        beds: results[10].data ?? [],
      });
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadDashboardData(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadDashboardData]);

  const summary = useMemo(() => buildDashboardSummary(data), [data]);
  const visibleActivities = showAllActivity
    ? summary.activities
    : summary.activities.slice(0, 3);

  return (
    <main className="min-h-screen bg-gray-100 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex">
        <Sidebar />
        <section className="min-w-0 flex-1 p-6 sm:p-10">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-4xl font-bold text-slate-950 dark:text-white">Welcome Back 👋</h2>
              <p className="mt-2 text-gray-600 dark:text-slate-300">University Girls Hostel Dashboard</p>
            </div>
            <ProfileDropdown />
          </header>

          {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200">{error}</div>}

          {!canAccessDashboard ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m4.93 4.93 14.14 14.14" />
                </svg>
              </div>
              <h3 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Dashboard Access Restricted</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Your staff account does not have permission to view the main hostel dashboard. Please select an authorized module from the sidebar navigation.
              </p>
            </div>
          ) : (
            <>
              <DashboardStats data={data} />

              <h3 className="mb-6 text-2xl font-semibold text-gray-800 dark:text-slate-100">Quick Actions</h3>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {quickActions.map((action) => (
                  <Link key={action.href} href={action.href} className="rounded-2xl bg-white p-6 text-slate-950 shadow-lg transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-200 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-800">
                    <div className="text-4xl" aria-hidden="true">{action.icon}</div>
                    <h4 className="mt-4 text-xl font-bold">{action.title}</h4>
                    <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">{action.description}</p>
                  </Link>
                ))}
              </div>

              <div className="mt-10 grid gap-6 lg:grid-cols-2">
                <section className="rounded-2xl bg-white p-6 text-slate-950 shadow-lg dark:bg-slate-800 dark:text-slate-100">
                  <h3 className="text-xl font-bold">Today&apos;s Tasks</h3>
                  <div className="mt-5 space-y-3">
                    {loading ? <p className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">Loading current tasks...</p> : summary.tasks.length === 0 ? <p className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">No urgent tasks right now.</p> : summary.tasks.map((item) => (
                      <Link key={item.id} href={item.href} className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition hover:brightness-95 ${taskTone[item.tone]}`}>
                        <span className="font-medium">{item.count} {item.label}</span><span aria-hidden="true" className="text-lg">→</span>
                      </Link>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl bg-white p-6 text-slate-950 shadow-lg dark:bg-slate-800 dark:text-slate-100">
                  <h3 className="text-xl font-bold">Recent Activity</h3>
                  <div className="mt-5 space-y-4">
                    {loading ? <p className="text-sm text-slate-600 dark:text-slate-300">Loading recent activity...</p> : summary.activities.length === 0 ? <p className="text-sm text-slate-600 dark:text-slate-300">No recent activity is available.</p> : visibleActivities.map((activity) => (
                      <Link key={activity.id} href={activity.href} className={`block border-l-4 pl-4 transition hover:bg-slate-50 dark:hover:bg-slate-700/70 ${activityTone[activity.tone]}`}>
                        <p className="font-medium text-slate-800 dark:text-slate-100">{activity.description}</p>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{formatActivityDate(activity.occurredAt)}</p>
                      </Link>
                    ))}
                  </div>
                  {!loading && summary.activities.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setShowAllActivity((current) => !current)}
                      className="mt-5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-blue-300 dark:hover:bg-slate-700"
                    >
                      {showAllActivity ? "Show Less" : "View All Recent Activity"}
                    </button>
                  )}
                </section>
              </div>
              
              <DashboardCharts data={data} />
            </>
          )}
          
        </section>
      </div>
    </main>
  );
}
