import Sidebar from "@/components/layout/Sidebar";
import Link from "next/link";

export default function AddBedPage() {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex">

        <Sidebar />

        <section className="flex-1 p-10">

          {/* Header */}

          <div className="mb-8">

            <h1 className="text-4xl font-bold">
              Add Bed
            </h1>

            <p className="mt-2 text-gray-600">
              Create a new bed
            </p>

          </div>

          {/* Form */}

          <div className="rounded-2xl bg-white p-8 shadow-lg">

            <h2 className="mb-6 text-2xl font-bold">
              Bed Information
            </h2>

            <div className="grid gap-6 md:grid-cols-2">

              <div>

                <label className="mb-2 block font-medium">
                  Bed Number
                </label>

                <input
                  type="text"
                  placeholder="Bed A"
                  className="w-full rounded-xl border p-3"
                />

              </div>

              <div>

                <label className="mb-2 block font-medium">
                  Room
                </label>

                <select className="w-full rounded-xl border p-3">
                  <option>Room 101</option>
                  <option>Room 102</option>
                  <option>Room 201</option>
                </select>

              </div>

              <div>

                <label className="mb-2 block font-medium">
                  Floor
                </label>

                <select className="w-full rounded-xl border p-3">
                  <option>Ground Floor</option>
                  <option>First Floor</option>
                  <option>Second Floor</option>
                </select>

              </div>

              <div>

                <label className="mb-2 block font-medium">
                  Status
                </label>

                <select className="w-full rounded-xl border p-3">
                  <option>Vacant</option>
                  <option>Occupied</option>
                  <option>Inactive</option>
                </select>

              </div>

              <div className="md:col-span-2">

                <label className="mb-2 block font-medium">
                  Notes
                </label>

                <textarea
                  rows={4}
                  placeholder="Bed notes..."
                  className="w-full rounded-xl border p-3"
                ></textarea>

              </div>

            </div>

            <div className="mt-10 flex gap-4"><button className="rounded-xl bg-blue-600 px-8 py-3 text-white hover:bg-blue-700">
                Save Bed
              </button>

              <Link
                href="/beds"
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
