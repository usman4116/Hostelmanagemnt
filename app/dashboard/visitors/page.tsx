"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Visitor = {
  id: number;
  visitor_name: string;
  entry_time: string;
  exit_time: string | null;
  status: string;
  cnic?: string;
  residents: {
    full_name: string;
  } | null;
};

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchVisitors() {
    const { data, error } = await supabase
      .from("visitors")
      .select(`
        id,
        visitor_name,
        entry_time,
        exit_time,
        status,
        residents (
          full_name
        )
      `)
      .order("id", { ascending: false });

    if (error) {
      alert(error.message);
    } else {
     setVisitors((data as unknown as Visitor[]) || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void fetchVisitors(), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);
async function handleCheckout(id: number) {
  const { error } = await supabase
    .from("visitors")
    .update({
      status: "Checked Out",
      exit_time: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  fetchVisitors();
}
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Visitors</h1>

        <Link
          href="/dashboard/visitors/add"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Visitor
        </Link>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2">ID</th>
              <th className="border px-4 py-2">Resident</th>
              <th className="border px-4 py-2">Visitor</th>
              <th className="border px-4 py-2">Entry Time</th>
              <th className="border px-4 py-2">Exit Time</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-6">
                  Loading...
                </td>
              </tr>
            ) : visitors.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-500">
                  No visitors found.
                </td>
              </tr>
            ) : (
              visitors.map((visitor) => (
                <tr key={visitor.id}>
                  <td className="border px-4 py-2">{visitor.id}</td>
                  <td className="border px-4 py-2">
                    {visitor.residents?.full_name ?? "-"}
                  </td>
                  <td className="border px-4 py-2">
                    {visitor.visitor_name}
                  </td>
                  <td className="border px-4 py-2">
                    {new Date(visitor.entry_time).toLocaleString()}
                  </td>
                  <td className="border px-4 py-2">
                    {visitor.exit_time
                      ? new Date(visitor.exit_time).toLocaleString()
                      : "-"}
                  </td>
                  <td className="border px-4 py-2">
                    {visitor.status}
                  </td>
                  <td className="border px-4 py-2">
  {visitor.status === "Checked In" ? (
    <button
      onClick={() => handleCheckout(visitor.id)}
      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
    >
      Check Out
    </button>
  ) : (
    <span className="text-green-600 font-semibold">
      Completed
    </span>
  )}
</td>
                  
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
