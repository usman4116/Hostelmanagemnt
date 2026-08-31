"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import type { DashboardData } from "@/lib/dashboardData";

export default function DashboardCharts({ data }: { data: DashboardData }) {
  const { beds, payments } = data;

  const occupancyData = useMemo(() => {
    const totalBeds = beds.length;
    const occupiedBeds = beds.filter((bed: any) => bed.status === "Occupied").length;
    const availableBeds = beds.filter((bed: any) => bed.status === "Available" || bed.status === "Vacant").length;
    const inactiveBeds = beds.filter((bed: any) => bed.status === "Inactive").length;

    return [
      { name: "Occupied", value: occupiedBeds },
      { name: "Vacant", value: availableBeds },
      ...(inactiveBeds > 0 ? [{ name: "Inactive", value: inactiveBeds }] : []),
    ];
  }, [beds]);

  const revenueData = useMemo(() => {
    const months = new Map<string, number>();

    // Generate last 6 months labels
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString("default", { month: "short", year: "numeric" });
      months.set(label, 0);
    }

    payments.forEach((payment: any) => {
      const pStatus = (payment.payment_status || "").toLowerCase();
      if (pStatus === "verified" || pStatus === "completed" || pStatus === "approved") {
        const dateStr = payment.verified_at || payment.payment_date || payment.created_at;
        const date = new Date(dateStr);
        const label = date.toLocaleString("default", { month: "short", year: "numeric" });
        if (months.has(label)) {
          months.set(label, (months.get(label) || 0) + Number(payment.amount || 0));
        }
      }
    });

    return Array.from(months.entries()).map(([month, amount]) => ({
      month,
      amount,
    }));
  }, [payments]);

  const COLORS = ["#4f46e5", "#10b981", "#94a3b8"];

  const formatCurrency = (value: number) => `Rs ${value.toLocaleString()}`;

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl bg-white p-6 text-slate-950 shadow-lg dark:bg-slate-800 dark:text-slate-100">
        <h3 className="mb-6 text-xl font-bold">Revenue (Last 6 Months)</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={(val) => `Rs ${val >= 1000 ? val / 1000 + 'k' : val}`} 
                tick={{ fill: "#64748b", fontSize: 12 }} 
                width={70}
              />
              <Tooltip 
                cursor={{ fill: "#f8fafc" }} 
                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                formatter={(value: any) => [formatCurrency(Number(value) || 0), "Revenue"]}
              />
              <Bar dataKey="amount" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 text-slate-950 shadow-lg dark:bg-slate-800 dark:text-slate-100">
        <h3 className="mb-6 text-xl font-bold">Bed Occupancy</h3>
        <div className="flex h-[300px] w-full items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={occupancyData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {occupancyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
