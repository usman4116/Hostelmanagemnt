"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Resident = {
  id: number;
  full_name: string;
};

export default function AddComplaintPage() {
  const router = useRouter();

  const [residents, setResidents] = useState<Resident[]>([]);
  const [residentId, setResidentId] = useState("");
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [assignedStaff, setAssignedStaff] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchResidents() {
    const { data, error } = await supabase
      .from("residents")
      .select("id, full_name")
      .order("full_name", { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    setResidents(data || []);
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void fetchResidents(), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!residentId || !category || !subject || !description) {
      alert("Please fill all required fields.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("complaints").insert({
      resident_id: Number(residentId),
      category,
      subject,
      description,
      priority,
      status: "Open",
      assigned_staff: assignedStaff || null,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Complaint added successfully.");
    router.push("/dashboard/complaints");
    router.refresh();
  }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-3xl font-bold mb-6">Add Complaint</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Resident</label>

            <select
              value={residentId}
              onChange={(e) => setResidentId(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">Select Resident</option>

              {residents.map((resident) => (
                <option key={resident.id} value={resident.id}>
                  {resident.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">Category</label>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">Select Category</option>
              <option value="Room">Room</option>
              <option value="Food">Food</option>
              <option value="Electricity">Electricity</option>
              <option value="Water">Water</option>
              <option value="Internet">Internet</option>
              <option value="Security">Security</option>
              <option value="Cleanliness">Cleanliness</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">Subject</label>

            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter complaint subject"
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Description</label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter complaint details"
              rows={5}
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Priority</label>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">Assigned Staff</label>

            <input
              type="text"
              value={assignedStaff}
              onChange={(e) => setAssignedStaff(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter staff name"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Add Complaint"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/complaints")}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
