"use client";

import Sidebar from "@/components/layout/Sidebar";

export default function ResidentProfilePage() {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex">

        <Sidebar />

        <section className="flex-1 p-10">

          <h1 className="text-4xl font-bold">
            Resident Profile
          </h1>

          <p className="mt-2 text-gray-600">
            Resident details will appear here.
          </p>

        </section>

      </div>
    </main>
  );
}