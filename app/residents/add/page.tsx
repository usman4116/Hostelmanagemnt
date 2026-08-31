"use client";
import { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import { supabase } from "@/lib/supabase";
export default function AddResidentPage() {
  const [, setSaved] = useState(false);
  const [name, setName] = useState("");
const [phone, setPhone] = useState("");
const [room, setRoom] = useState("");
const [bed, setBed] = useState("");
const handleSubmit = async () => {
  alert("handleSubmit Started");
  const { data, error } = await supabase
    .from("residents")
    .insert([
      {
        full_name: name,
        phone: phone,
        room_id: null,
        bed: bed,
      },
    ]);
  console.log("Data:", data);
  console.log("Error:", error);
  if (error) {
    alert("Error: " + error.message);
  } else {
    alert("Resident Saved Successfully!");
    setSaved(true);

    setName("");
    setPhone("");
    setRoom("");
    setBed("");
  }
};
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex">

        <Sidebar />

        <section className="flex-1 p-10">

          {/* Header */}

          <div className="mb-8 flex items-center justify-between">

            <div>

              <h1 className="text-4xl font-bold">
                Add Resident
              </h1>

              <p className="mt-2 text-gray-600">
                Register a new hostel resident
              </p>

            </div>

          </div>

          {/* Form */}

          <div className="rounded-2xl bg-white p-8 shadow-lg">

            <h2 className="mb-6 text-2xl font-bold">
              Personal Information
            </h2>

            <div className="grid gap-6 md:grid-cols-2">

              <div>

                <label className="mb-2 block font-medium">
                  Full Name
                </label>

                <input
                 type="text"
                className="w-full rounded-xl border p-3"
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
               />

              </div>

              <div>

                <label className="mb-2 block font-medium">
                  Father / Guardian Name
                </label>

                <input
                  type="text"
                  className="w-full rounded-xl border p-3"
                  placeholder="Guardian name"
                />

              </div>

              <div>

                <label className="mb-2 block font-medium">
                  CNIC
                </label>

                <input
                  type="text"
                  className="w-full rounded-xl border p-3"
                  placeholder="35202-1234567-1"
                />

              </div>

              <div>

                <label className="mb-2 block font-medium">
                  Phone Number
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border p-3"
                  placeholder="03XX-XXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />

              </div>

              <div>

                <label className="mb-2 block font-medium">
                  Emergency Contact
                </label>

                <input
                  type="text"
                  className="w-full rounded-xl border p-3"
                  placeholder="Emergency contact"
                />

              </div>

              <div>

                <label className="mb-2 block font-medium">
                  Address
                </label>

                <input
                  type="text"
                  className="w-full rounded-xl border p-3"
                  placeholder="Complete address"
                />

              </div>

            </div>

            <h2 className="mt-10 mb-6 text-2xl font-bold">
              Hostel Details
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <div>

                <label className="mb-2 block font-medium">
                  Room
                </label>

                <select
                  className="w-full rounded-xl border p-3"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
              >
                  <option value="">Select Room</option>
                  <option>Room 101</option>
                  <option>Room 102</option>
                  <option>Room 201</option>
                </select>

              </div>

              <div>

                <label className="mb-2 block font-medium">
                  Bed
                </label>

                <select
                  className="w-full rounded-xl border p-3"
                  value={bed}
                  onChange={(e) => setBed(e.target.value)}
                >
                  <option value="">Select Bed</option>
                  <option>Bed A</option>
                  <option>Bed B</option>
                  <option>Bed C</option>
                </select>

              </div>

              <div>

                <label className="mb-2 block font-medium">
                  Check-in Date
                </label>

                <input
                  type="date"
                  className="w-full rounded-xl border p-3"
                />

              </div>

              <div>

                <label className="mb-2 block font-medium">
                  Monthly Rent
                </label>

                <input
                  type="number"
                  className="w-full rounded-xl border p-3"
                  placeholder="Monthly rent"
                />

              </div>

              <div>

                <label className="mb-2 block font-medium">
                  Security Deposit
                </label>

                <input
                  type="number"
                  className="w-full rounded-xl border p-3"
                  placeholder="Security deposit"
                />

              </div>

              <div>

                <label className="mb-2 block font-medium">
                  Payment Method
                </label>

                <select className="w-full rounded-xl border p-3">
                  <option>Cash</option>
                  <option>Bank Transfer</option>
                  <option>Online Payment</option>
                </select>

              </div>

              <div>

                <label className="mb-2 block font-medium">
                  Status
                </label>

                <select className="w-full rounded-xl border p-3">
                  <option>Active</option>
                  <option>Notice Served</option>
                  <option>Checked Out</option>
                </select>

              </div>

              <div>

                <label className="mb-2 block font-medium">
                  Contract Duration (Months)
                </label>

                <input
                  type="number"
                  className="w-full rounded-xl border p-3"
                  placeholder="12"
                />

              </div>

            </div>

            <h2 className="mt-10 mb-6 text-2xl font-bold">
              Documents
            </h2>

            <div className="grid gap-6 md:grid-cols-2">

              <div>

                <label className="mb-2 block font-medium">
                  Resident Photo
                </label>

                <input
                  type="file"
                  className="w-full rounded-xl border p-3"
                />

              </div>

              <div>

                <label className="mb-2 block font-medium">
                  CNIC / Passport Copy
                </label>

                <input
                  type="file"
                  className="w-full rounded-xl border p-3"
                />

              </div>

            </div>

            <div className="mt-10 flex gap-4">

            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-xl bg-blue-600 px-8 py-3 text-white hover:bg-blue-700"
            >
              Save Resident
            </button>

              <Link
              href="/residents"
             className="rounded-xl border px-8 py-3 hover:bg-gray-100"
            >
             Cancel
          </Link>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}
