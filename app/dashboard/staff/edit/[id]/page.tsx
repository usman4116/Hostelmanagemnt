"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function EditStaffPage() {
  const router = useRouter();
  const params = useParams();

  const staffId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [fullName, setFullName] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cnic, setCnic] = useState("");
  const [salary, setSalary] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState("0");
  const [joiningDate, setJoiningDate] = useState("");
  const [status, setStatus] = useState("Active");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchStaff = useCallback(async () => {
    setPageLoading(true);

    const { data, error } = await supabase
      .from("staff")
      .select(`
        id,
        full_name,
        designation,
        department,
        phone,
        email,
        cnic,
        salary,
        advance_amount,
        joining_date,
        status,
        address,
        notes
      `)
      .eq("id", Number(staffId))
      .single();

    if (error) {
      alert(error.message);
      setPageLoading(false);
      return;
    }

    setFullName(data.full_name ?? "");
    setDesignation(data.designation ?? "");
    setDepartment(data.department ?? "");
    setPhone(data.phone ?? "");
    setEmail(data.email ?? "");
    setCnic(data.cnic ?? "");

    setSalary(
      data.salary === null || data.salary === undefined
        ? ""
        : String(data.salary)
    );

    setAdvanceAmount(
      data.advance_amount === null ||
        data.advance_amount === undefined
        ? "0"
        : String(data.advance_amount)
    );

    setJoiningDate(data.joining_date ?? "");
    setStatus(data.status ?? "Active");
    setAddress(data.address ?? "");
    setNotes(data.notes ?? "");

    setPageLoading(false);
  }, [staffId]);

  useEffect(() => {
    if (staffId) {
      const timeoutId = window.setTimeout(() => void fetchStaff(), 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, [fetchStaff, staffId]);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!fullName.trim()) {
      alert("Full name is required.");
      return;
    }

    if (!designation.trim()) {
      alert("Designation is required.");
      return;
      }

    if (!joiningDate) {
      alert("Joining date is required.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("staff")
      .update({
        full_name: fullName.trim(),
        designation: designation.trim(),
        department: department.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        cnic: cnic.trim() || null,
        salary: salary === "" ? null : Number(salary),
        advance_amount:
          advanceAmount === "" ? 0 : Number(advanceAmount),
        joining_date: joiningDate,
        status,
        address: address.trim() || null,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", Number(staffId));

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Staff updated successfully.");
    router.push("/dashboard/staff");
    router.refresh();
  }

  if (pageLoading) {
    return (
      <div className="p-6">
        <p className="text-center text-gray-500">
          Loading staff details...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-3xl font-bold mb-6">Edit Staff</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">
              Full Name
            </label>

            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter full name"
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-1">
              Designation
            </label>

            <input
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter designation"
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-1">
              Department
            </label>

            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter department"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">
              Phone
            </label>

            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">
              CNIC
            </label>

            <input
              type="text"
              value={cnic}
              onChange={(e) => setCnic(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter CNIC"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">
              Monthly Salary
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter monthly salary"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">
              Advance Amount
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={advanceAmount}
              onChange={(e) => setAdvanceAmount(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter advance amount"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">
              Joining Date
            </label>

            <input
              type="date"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-1">
              Status
            </label>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">
              Address
            </label>

            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter address"
              rows={3}
            />
          </div>

          <div>
            <label className="block font-medium mb-1">
              Notes
            </label>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter notes"
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Updating..." : "Update Staff"}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => router.push("/dashboard/staff")}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
