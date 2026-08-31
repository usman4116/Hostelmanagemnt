"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Notice = {
  id: number;
  title: string;
  description: string;
  priority: string;
  audience: string;
  publish_date: string;
  expiry_date: string;
  pinned: boolean;
  status: string;
  created_at: string;
};

export default function NoticesPage() {
  const [loading, setLoading] = useState(true);

  const [notices, setNotices] = useState<Notice[]>([]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [priorityFilter, setPriorityFilter] =
    useState("All");

  const [errorMessage, setErrorMessage] =
    useState("");

  const loadNotices = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("notices")
      .select("*")
      .order("pinned", {
        ascending: false,
      })
      .order("publish_date", {
        ascending: false,
      });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setNotices((data ?? []) as Notice[]);
    setLoading(false);
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadNotices(), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const filteredNotices = useMemo(() => {
    return notices.filter((notice) => {
      const searchMatch =
        notice.title
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        notice.description
          .toLowerCase()
          .includes(search.toLowerCase());

      const statusMatch =
        statusFilter === "All" ||
        notice.status === statusFilter;

      const priorityMatch =
        priorityFilter === "All" ||
        notice.priority === priorityFilter;

      return (
        searchMatch &&
        statusMatch &&
        priorityMatch
      );
    });
  }, [
    notices,
    search,
    statusFilter,
    priorityFilter,
  ]);

  const deleteNotice = async (
    id: number
  ) => {
    if (
      !confirm(
        "Delete this notice?"
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("notices")
        .delete()
        .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadNotices();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        Loading notices...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      <div className="mx-auto max-w-7xl">

        <div className="mb-6 flex items-center justify-between">

          <div>

            <h1 className="text-3xl font-bold">
              Notices
            </h1>

            <p className="text-gray-600 mt-1">
              Create and manage
              hostel notices.
            </p>

          </div>

          <Link
            href="/dashboard/notices/add"
            className="rounded-lg bg-blue-600 px-5 py-3 text-white font-medium"
          >
            + Add Notice
          </Link>

        </div>
        {errorMessage && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Search
              </label>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search title or description..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
              >
                <option value="All">All Statuses</option>
                <option value="Published">Published</option>
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Priority
              </label>

              <select
                value={priorityFilter}
                onChange={(event) =>
                  setPriorityFilter(event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
              >
                <option value="All">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

          </div>

          <div className="mt-4 flex items-center justify-between">

            <p className="text-sm text-gray-600">
              Showing {filteredNotices.length} of {notices.length} notices
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
                setPriorityFilter("All");
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700"
            >
              Clear Filters
            </button>

          </div>

        </div>

        {filteredNotices.length === 0 ? (

          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">

            <h2 className="text-lg font-semibold text-gray-900">
              No Notices Found
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Create your first notice or change the filters.
            </p>

          </div>

        ) : (

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

            {filteredNotices.map((notice) => {

              const priorityClass =
                notice.priority === "Urgent"
                  ? "bg-red-100 text-red-700"
                  : notice.priority === "High"
                  ? "bg-orange-100 text-orange-700"
                  : notice.priority === "Low"
                  ? "bg-gray-100 text-gray-700"
                  : "bg-blue-100 text-blue-700";

              const statusClass =
                notice.status === "Active" || notice.status === "Published"
                  ? "bg-green-100 text-green-700"
                  : notice.status === "Draft"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-700";

              return (

                <div
                  key={notice.id}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                >

                  <div className="mb-4 flex items-start justify-between">

                    <div>

                      <div className="mb-2 flex flex-wrap gap-2">

                        {notice.pinned && (
                          <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                            📌 Pinned
                          </span>
                        )}

                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${priorityClass}`}
                        >
                          {notice.priority}
                        </span>

                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass}`}
                        >
                          {notice.status}
                        </span>

                      </div>

                      <h2 className="text-lg font-semibold text-gray-900">
                        {notice.title}
                      </h2>

                    </div>

                    <span className="text-xs text-gray-500">
                      #{notice.id}
                    </span>

                  </div>

                  <p className="mb-4 whitespace-pre-line text-sm leading-6 text-gray-700">
                    {notice.description}
                  </p>
                  <div className="grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 text-sm text-gray-600 sm:grid-cols-2">

                    <div>
                      <span className="font-medium text-gray-700">
                        Audience:
                      </span>{" "}
                      {notice.audience || "All Residents"}
                    </div>

                    <div>
                      <span className="font-medium text-gray-700">
                        Publish Date:
                      </span>{" "}
                      {notice.publish_date
                        ? new Date(
                            `${notice.publish_date}T00:00:00`
                          ).toLocaleDateString()
                        : "Not set"}
                    </div>

                    <div>
                      <span className="font-medium text-gray-700">
                        Expiry Date:
                      </span>{" "}
                      {notice.expiry_date
                        ? new Date(
                            `${notice.expiry_date}T00:00:00`
                          ).toLocaleDateString()
                        : "No expiry"}
                    </div>

                    <div>
                      <span className="font-medium text-gray-700">
                        Created:
                      </span>{" "}
                      {notice.created_at
                        ? new Date(
                            notice.created_at
                          ).toLocaleDateString()
                        : "Not available"}
                    </div>

                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-end gap-3">

                    <Link
                      href={`/dashboard/notices/edit/${notice.id}`}
                      className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                    >
                      Edit
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        void deleteNotice(notice.id)
                      }
                      className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                    >
                      Delete
                    </button>

                  </div>

                </div>

              );
            })}

          </div>

        )}

      </div>

    </div>
  );
}
