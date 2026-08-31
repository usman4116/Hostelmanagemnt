"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Staff = {
  id: number;
  full_name: string;
  designation: string;
  department: string | null;
  phone: string | null;
  salary: number | null;
  advance_amount: number | null;
  joining_date: string;
  status: string;
};

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function fetchStaff() {
    setLoading(true);

    const { data, error } = await supabase
      .from("staff")
      .select(`
        id,
        full_name,
        designation,
        department,
        phone,
        salary,
        advance_amount,
        joining_date,
        status
      `)
      .order("id", { ascending: false });

    if (error) {
      alert(error.message);
      setStaff([]);
    } else {
      setStaff((data as unknown as Staff[]) || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void fetchStaff(), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  async function handleDelete(id: number, name: string) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${name}?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);

    const { error } = await supabase
      .from("staff")
      .delete()
      .eq("id", id);

    setDeletingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Staff deleted successfully.");
    fetchStaff();
  }

  function formatAmount(amount: number | null) {
    return Number(amount || 0).toLocaleString();
  }

  function formatDate(date: string) {
    if (!date) {
      return "-";
    }

    return new Date(`${date}T00:00:00`).toLocaleDateString();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Staff</h1>

        <Link
          href="/dashboard/staff/add"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Staff
        </Link>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2">ID</th>
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Designation</th>
              <th className="border px-4 py-2">Department</th>
              <th className="border px-4 py-2">Phone</th>
              <th className="border px-4 py-2">Salary</th>
              <th className="border px-4 py-2">Advance</th>
              <th className="border px-4 py-2">Joining Date</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="text-center py-6">
                  Loading...
                </td>
              </tr>
            ) : staff.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-6 text-gray-500">
                  No staff found.
                </td>
              </tr>
            ) : (
              staff.map((member) => (
<tr key={member.id}>
  <td className="border px-4 py-2">{member.id}</td>

  <td className="border px-4 py-2">
    {member.full_name}
  </td>

  <td className="border px-4 py-2">
    {member.designation}
  </td>

  <td className="border px-4 py-2">
    {member.department}
  </td>

  <td className="border px-4 py-2">
    {member.phone}
  </td>

  <td className="border px-4 py-2">
    {formatAmount(member.salary)}
  </td>

  <td className="border px-4 py-2">
    {formatAmount(member.advance_amount)}
  </td>

  <td className="border px-4 py-2">
    {formatDate(member.joining_date)}
  </td>

  <td className="border px-4 py-2">
    {member.status}
  </td>

  <td className="border px-4 py-2 space-x-2">
    <Link
      href={`/dashboard/staff/edit/${member.id}`}
      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
    >
      Edit
    </Link>

    <button
      onClick={() => handleDelete(member.id, member.full_name)}
      disabled={deletingId === member.id}
      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
    >
      {deletingId === member.id ? "Deleting..." : "Delete"}
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
