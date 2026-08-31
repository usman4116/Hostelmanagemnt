import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-lg">
        <h1 className="text-5xl font-bold text-blue-600">
          StayHub
        </h1>

        <h2 className="mt-4 text-xl font-semibold text-slate-800">
          Smart Hostel Management System
        </h2>

        <p className="mx-auto mt-3 max-w-md text-slate-600">
          Manage Residents, Rooms, Bills, Contracts and Payments
          from one dashboard.
        </p>

        <Link
          href="/dashboard"
          className="mt-8 inline-flex rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Get Started
        </Link>
      </div>
    </main>
  );
}