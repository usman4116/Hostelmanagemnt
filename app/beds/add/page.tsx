"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import { supabase } from "@/lib/supabase";
import { addSingleBed } from "@/lib/bedProvisioning";
import { getNextCanonicalBedLabels } from "@/lib/bedLabels";
import { isOperationalBedStatus } from "@/lib/statuses";

type RoomOption = {
  id: string;
  room_number: string;
  capacity: number;
  total_beds: number;
  status: string;
  active_beds_count: number;
};

export default function AddBedPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [bedNumber, setBedNumber] = useState("");
  const [mattressCondition, setMattressCondition] = useState("Good");
  const [mattressCover, setMattressCover] = useState("Available");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");

      const [{ data: roomsData, error: roomsError }, { data: bedsData }] =
        await Promise.all([
          supabase
            .from("rooms")
            .select("id, room_number, capacity, total_beds, status")
            .neq("status", "Inactive")
            .order("room_number", { ascending: true }),
          supabase.from("beds").select("id, room_id, bed_number, status"),
        ]);

      if (roomsError) {
        setError("Failed to load rooms. Please refresh the page.");
        setLoading(false);
        return;
      }

      const allBeds = bedsData ?? [];
      const options: RoomOption[] = (roomsData ?? []).map((r) => {
        const count = allBeds.filter(
          (b) => b.room_id === r.id && isOperationalBedStatus(b.status),
        ).length;
        return {
          id: r.id,
          room_number: r.room_number,
          capacity: Number(r.capacity) || 1,
          total_beds: Number(r.total_beds) || 1,
          status: r.status,
          active_beds_count: count,
        };
      });

      setRooms(options);

      if (options.length > 0) {
        const firstRoom = options[0];
        setSelectedRoomId(firstRoom.id);
        const existingLabels = allBeds
          .filter((b) => b.room_id === firstRoom.id)
          .map((b) => b.bed_number);
        const nextLabels = getNextCanonicalBedLabels(
          1,
          existingLabels,
          firstRoom.room_number,
        );
        setBedNumber(nextLabels[0] || `${firstRoom.room_number} A`);
      }

      setLoading(false);
    }

    void loadData();
  }, []);

  async function handleRoomChange(roomId: string) {
    setSelectedRoomId(roomId);
    const selected = rooms.find((r) => r.id === roomId);
    if (!selected) return;

    const { data: currentBeds } = await supabase
      .from("beds")
      .select("bed_number")
      .eq("room_id", roomId);

    const existingLabels = (currentBeds ?? []).map((b) => b.bed_number);
    const nextLabels = getNextCanonicalBedLabels(
      1,
      existingLabels,
      selected.room_number,
    );
    setBedNumber(nextLabels[0] || `${selected.room_number} A`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRoomId) {
      setError("Please select a room.");
      return;
    }
    if (!bedNumber.trim()) {
      setError("Bed number / label is required.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const result = await addSingleBed({
      roomId: selectedRoomId,
      bedNumber: bedNumber.trim(),
      mattressCondition,
      mattressCover,
    });

    if (!result.success) {
      setError(result.error || "The bed could not be created.");
      setSaving(false);
    } else {
      setMessage(
        `Bed created successfully!${
          result.newCapacity
            ? ` Room capacity automatically updated to ${result.newCapacity}.`
            : ""
        }`,
      );
      setTimeout(() => {
        router.push("/beds");
      }, 1200);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="flex">
        <Sidebar />

        <section className="flex-1 p-6 md:p-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Add Bed</h1>
            <p className="mt-1 text-sm text-slate-500">
              Create and allocate a new bed to a room.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
              {message}
            </div>
          )}

          <div className="max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
            <h2 className="mb-6 text-xl font-bold text-slate-900">
              Bed Information
            </h2>

            {loading ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Loading rooms...
              </p>
            ) : rooms.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No active rooms found. Please create an active room first.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Room *
                    </label>
                    <select
                      value={selectedRoomId}
                      onChange={(e) => void handleRoomChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    >
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          Room {room.room_number} ({room.active_beds_count} /{" "}
                          {room.capacity} beds)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Bed Number / Label *
                    </label>
                    <input
                      type="text"
                      value={bedNumber}
                      onChange={(e) => setBedNumber(e.target.value)}
                      placeholder="e.g. 106 E"
                      className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                    <p className="mt-1 text-xs text-slate-400">
                      Auto-suggested for this room. You can also customize the
                      label.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Mattress Condition
                    </label>
                    <select
                      value={mattressCondition}
                      onChange={(e) => setMattressCondition(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Damaged">Damaged</option>
                      <option value="Not Available">Not Available</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Mattress Cover
                    </label>
                    <select
                      value={mattressCover}
                      onChange={(e) => setMattressCover(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Available">Available</option>
                      <option value="Not Available">Not Available</option>
                      <option value="Damaged">Damaged</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Bed"}
                  </button>

                  <Link
                    href="/beds"
                    className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
