import { useMemo } from "react";
import type { DashboardData } from "@/lib/dashboardData";

export default function DashboardStats({ data }: { data: DashboardData }) {
  const { residents, bills, payments, beds, rooms } = data;

  const stats = useMemo(() => {
    // 1. Total Residents (Active)
    const totalResidents = residents.filter(r => r.status === "Active").length;

    // 2. Room Occupancy & Bed Occupancy
    const occupiedBeds = beds.filter(b => b.status === "Occupied").length;
    const totalBeds = beds.length;
    const bedOccupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    // 3. Revenue (All verified payments)
    const totalRevenue = payments
      .filter(p => (p.payment_status || "").toLowerCase() === "verified")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    // 4. Outstanding Dues
    const verifiedByBill = new Map<string, number>();
    payments.forEach((payment) => {
      if ((payment.payment_status || "").toLowerCase() === "verified") {
        const id = String(payment.bill_id);
        verifiedByBill.set(id, (verifiedByBill.get(id) || 0) + Number(payment.amount || 0));
      }
    });

    let totalOutstanding = 0;
    bills.forEach((bill) => {
      if ((bill.bill_status || "").toLowerCase() !== "cancelled") {
        const paid = verifiedByBill.get(String(bill.id)) || 0;
        const total = Number(bill.total_amount || 0);
        totalOutstanding += Math.max(0, total - paid);
      }
    });

    return {
      totalResidents,
      occupiedBeds,
      totalBeds,
      bedOccupancyRate,
      totalRevenue,
      totalOutstanding,
    };
  }, [residents, bills, payments, beds]);

  const money = (val: number) => `Rs ${val.toLocaleString()}`;

  const cards = [
    { label: "Active Residents", value: stats.totalResidents, color: "text-blue-600 dark:text-blue-400" },
    { label: "Total Revenue", value: money(stats.totalRevenue), color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Outstanding Dues", value: money(stats.totalOutstanding), color: "text-red-600 dark:text-red-400" },
    { label: "Bed Occupancy", value: `${stats.bedOccupancyRate}%`, sub: `${stats.occupiedBeds} / ${stats.totalBeds} beds`, color: "text-indigo-600 dark:text-indigo-400" },
  ];

  return (
    <div className="mb-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
            {card.sub && <p className="text-sm font-medium text-slate-500 dark:text-slate-400">({card.sub})</p>}
          </div>
        </article>
      ))}
    </div>
  );
}
