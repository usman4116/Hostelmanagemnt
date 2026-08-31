"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Complaint = {
  id: number;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  residents: {
    full_name: string;
  } | null;
};

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchComplaints() {
    const { data, error } = await supabase
      .from("complaints")
      .select(`
        id,
        subject,
        category,
        priority,
        status,
        created_at,
        residents (
          full_name
        )
      `)
      .order("id", { ascending: false });

    if (error) {
      alert(error.message);
    } else {
      setComplaints((data as unknown as Complaint[]) || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void fetchComplaints(), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);
async function updateStatus(id: number, status: string) {
  const { error } = await supabase
    .from("complaints")
    .update({
      status,
      resolved_at:
        status === "Resolved" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  fetchComplaints();
}
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Complaints</h1>

        <Link
          href="/dashboard/complaints/add"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Complaint
        </Link>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2">ID</th>
              <th className="border px-4 py-2">Resident</th>
              <th className="border px-4 py-2">Subject</th>
              <th className="border px-4 py-2">Category</th>
              <th className="border px-4 py-2">Priority</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Created At</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-6">
                  Loading...
                </td>
              </tr>
            ) : complaints.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-6 text-gray-500">
                  No complaints found.
                </td>
              </tr>
            ) : (
              complaints.map((complaint) => (
                <tr key={complaint.id}>
                  <td className="border px-4 py-2">{complaint.id}</td>

                  <td className="border px-4 py-2">
                    {complaint.residents?.full_name ?? "-"}
                  </td>

                  <td className="border px-4 py-2">
                    {complaint.subject}
                  </td>

                  <td className="border px-4 py-2">
                    {complaint.category}
                  </td>

                  <td className="border px-4 py-2">
                    {complaint.priority}
                  </td>

                  <td className="border px-4 py-2">
                    {complaint.status}
                  </td>
<td className="border px-4 py-2">
  <select
    value={complaint.status}
    onChange={(e) =>
      updateStatus(complaint.id, e.target.value)
    }
    className="border rounded px-2 py-1"
  >
    <option value="Open">Open</option>
    <option value="In Progress">In Progress</option>
    <option value="Resolved">Resolved</option>
  </select>
</td>
                  <td className="border px-4 py-2">
                    {new Date(complaint.created_at).toLocaleString()}
                  </td>
                  <td className="border px-4 py-2">
                 <button
  onClick={() => updateStatus(complaint.id, "Resolved")}
  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
>
  Resolve
</button>
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
