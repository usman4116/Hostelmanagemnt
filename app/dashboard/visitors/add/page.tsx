"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Resident = {
  id: number;
  full_name: string;
};

export default function AddVisitorPage() {
  const router = useRouter();

  const [residents, setResidents] = useState<Resident[]>([]);
  const [residentId, setResidentId] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [cnic, setCnic] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [relation, setRelation] = useState("");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
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

    if (!residentId || !visitorName) {
      alert("Resident and visitor name are required.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("visitors").insert({
      resident_id: Number(residentId),
      visitor_name: visitorName,
      cnic: cnic || null,
      mobile_number: mobileNumber || null,
      relation: relation || null,
      purpose: purpose || null,
      notes: notes || null,
      status: "Checked In",
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Visitor checked in successfully.");
    router.push("/dashboard/visitors");
    router.refresh();
  }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-3xl font-bold mb-6">Add Visitor</h1>

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
            <label className="block font-medium mb-1">Visitor Name</label>

            <input
              type="text"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter visitor name"
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-1">CNIC</label>

            <input
              type="text"
              value={cnic}
              onChange={(e) => setCnic(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter CNIC"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Mobile Number</label>

            <input
              type="text"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter mobile number"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Relation</label>

            <input
              type="text"
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Example: Brother, Friend"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Purpose</label>

            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter visit purpose"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Notes</label>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter additional notes"
              rows={4}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Check In Visitor"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/visitors")}
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
