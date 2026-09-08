"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  AVAILABLE_PERMISSIONS,
  ALL_PERMISSION_IDS,
  isSuperAdmin,
  type PermissionDefinition,
} from "@/lib/permissions";

export type StaffUser = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  status: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
};

type UserFormData = {
  id?: string;
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: string;
  status: string;
  permissions: string[];
};

const defaultFormData: UserFormData = {
  email: "",
  password: "",
  full_name: "",
  phone: "",
  role: "Staff",
  status: "Active",
  permissions: ["dashboard", "admissions", "residents", "rent_bills"],
};

export default function StaffUserManager() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserFormData>(defaultFormData);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const getAuthToken = useCallback(async () => {
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !data.session?.access_token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    return data.session.access_token;
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user?.email) {
        setCurrentUserEmail(authData.user.email.toLowerCase());
      }

      const token = await getAuthToken();
      const res = await fetch("/api/admin/staff-users", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load staff users");
      }
      setUsers(data.staffUsers ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load staff users");
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !query ||
        (user.full_name ?? "").toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.phone ?? "").toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "All" ||
        (roleFilter === "Super Admin" && isSuperAdmin(user.role)) ||
        (roleFilter === "Staff" && !isSuperAdmin(user.role));

      const matchesStatus =
        statusFilter === "All" ||
        user.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const summary = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status.toLowerCase() === "active").length;
    const inactive = users.filter((u) => u.status.toLowerCase() !== "active").length;
    const admins = users.filter((u) => isSuperAdmin(u.role)).length;
    const staff = total - admins;
    return { total, active, inactive, admins, staff };
  }, [users]);

  function openCreateModal() {
    setIsEditing(false);
    setFormData(defaultFormData);
    setModalError("");
    setModalOpen(true);
  }

  function openEditModal(user: StaffUser) {
    setIsEditing(true);
    setFormData({
      id: user.id,
      email: user.email,
      password: "",
      full_name: user.full_name || "",
      phone: user.phone || "",
      role: isSuperAdmin(user.role) ? "Super Admin" : "Staff",
      status: user.status || "Active",
      permissions: isSuperAdmin(user.role) ? ALL_PERMISSION_IDS : user.permissions || [],
    });
    setModalError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (submitting) return;
    setModalOpen(false);
    setModalError("");
  }

  function togglePermission(id: string) {
    setFormData((prev) => {
      const exists = prev.permissions.includes(id);
      const next = exists
        ? prev.permissions.filter((p) => p !== id)
        : [...prev.permissions, id];
      return { ...prev, permissions: next };
    });
  }

  function selectAllPermissions() {
    setFormData((prev) => ({
      ...prev,
      permissions: [...ALL_PERMISSION_IDS],
    }));
  }

  function clearAllPermissions() {
    setFormData((prev) => ({
      ...prev,
      permissions: [],
    }));
  }

  async function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setModalError("");
    setError("");
    setSuccess("");

    try {
      const token = await getAuthToken();
      const method = isEditing ? "PUT" : "POST";
      const payload: Record<string, unknown> = {
        ...formData,
        role: formData.role,
        permissions: formData.role === "Super Admin" ? ALL_PERMISSION_IDS : formData.permissions,
      };

      if (isEditing && !formData.password) {
        delete payload.password;
      }

      const res = await fetch("/api/admin/staff-users", {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save staff user");
      }

      setSuccess(
        isEditing
          ? `Staff user ${formData.full_name} updated successfully.`
          : `Staff user ${formData.full_name} created successfully. They can now log in via the Staff Portal (/admin123).`,
      );
      closeModal();
      await loadUsers();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleUserStatus(user: StaffUser) {
    const nextStatus = user.status.toLowerCase() === "active" ? "Inactive" : "Active";
    setError("");
    setSuccess("");
    try {
      const token = await getAuthToken();
      const res = await fetch("/api/admin/staff-users", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          full_name: user.full_name || "",
          phone: user.phone || "",
          role: user.role,
          status: nextStatus,
          permissions: user.permissions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      setSuccess(`User ${user.email} marked as ${nextStatus}.`);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed");
    }
  }

  async function deleteUser(user: StaffUser) {
    if (!window.confirm(`Are you sure you want to permanently delete staff user ${user.full_name || user.email}?`)) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      const token = await getAuthToken();
      const res = await fetch(
        `/api/admin/staff-users?id=${encodeURIComponent(user.id)}&email=${encodeURIComponent(user.email)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");
      setSuccess(`Staff user ${user.email} deleted successfully.`);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Staff Users</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{summary.total}</p>
          <p className="mt-1 text-xs text-slate-500">{summary.staff} Staff · {summary.admins} Admins</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Staff Accounts</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">{summary.active}</p>
          <p className="mt-1 text-xs text-slate-500">Authorized to log in at /admin123</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Inactive Accounts</p>
          <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400">{summary.inactive}</p>
          <p className="mt-1 text-xs text-slate-500">Temporarily locked out</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Super Administrators</p>
          <p className="mt-2 text-3xl font-bold text-indigo-600 dark:text-indigo-400">{summary.admins}</p>
          <p className="mt-1 text-xs text-slate-500">Full system & revenue access</p>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Main Staff Management Card */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Header and Action */}
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Staff Users & Permissions</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Create and manage staff accounts who log in through the Staff Portal (/admin123). Assign custom sidebar module permissions.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            + Create Staff User
          </button>
        </div>

        {/* Filters */}
        <div className="grid gap-3 border-b border-slate-200 p-5 sm:grid-cols-[1fr_180px_180px_auto] dark:border-slate-800">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-950"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-950"
          >
            <option value="All">All Roles</option>
            <option value="Super Admin">Super Admin</option>
            <option value="Staff">Staff</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-950"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button
            type="button"
            onClick={() => void loadUsers()}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Refresh
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Staff Member
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Role
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Status
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Assigned Permissions
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500">
                    Loading staff users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500">
                    No staff users found matching the search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isAdmin = isSuperAdmin(user.role);
                  const isCurrentUser = user.email.toLowerCase() === currentUserEmail;
                  const isPrimaryAdmin = user.email.toLowerCase() === "admin@admin.com";
                  const perms = isAdmin ? ALL_PERMISSION_IDS : user.permissions || [];

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            {(user.full_name || user.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {user.full_name || "Staff Member"}
                              {isCurrentUser && (
                                <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                            {user.phone && (
                              <p className="text-xs text-slate-400 dark:text-slate-500">{user.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                            isAdmin
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300"
                          }`}
                        >
                          {isAdmin ? "Super Admin" : "Staff"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                            user.status.toLowerCase() === "active"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300"
                              : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {isAdmin ? (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
                            <span>✨ Full System Access (All 15 Modules + Revenue)</span>
                          </div>
                        ) : perms.length === 0 ? (
                          <span className="text-xs text-slate-400">No permissions assigned</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 max-w-lg">
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {perms.length} of 15
                            </span>
                            {perms.slice(0, 6).map((pid) => {
                              const p = AVAILABLE_PERMISSIONS.find((item) => item.id === pid);
                              return (
                                <span
                                  key={pid}
                                  className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                                >
                                  {p?.name || pid}
                                </span>
                              );
                            })}
                            {perms.length > 6 && (
                              <span className="text-[11px] text-slate-500 font-medium self-center">
                                +{perms.length - 6} more
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            Edit
                          </button>
                          {!isPrimaryAdmin && !isCurrentUser && (
                            <>
                              <button
                                type="button"
                                onClick={() => void toggleUserStatus(user)}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                                  user.status.toLowerCase() === "active"
                                    ? "border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900/60 dark:text-amber-300"
                                    : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/60 dark:text-emerald-300"
                                }`}
                              >
                                {user.status.toLowerCase() === "active" ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                type="button"
                                onClick={() => void deleteUser(user)}
                                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-900/60 dark:text-red-300"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Staff User Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !submitting) closeModal();
          }}
        >
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {isEditing ? "Modify Account" : "New Staff Registration"}
                </p>
                <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {isEditing ? `Edit: ${formData.full_name || formData.email}` : "Create Staff User"}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="rounded-xl p-2 text-2xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                ×
              </button>
            </div>

            {modalError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300">
                {modalError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-5 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="e.g. Fatima Ali"
                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Login Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    disabled={isEditing}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@hostel.com"
                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:disabled:bg-slate-800/50"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Staff member will log in with this email at <code>/admin123</code>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0300-1234567"
                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {isEditing ? "Update Password (Optional)" : "Password *"}
                  </label>
                  <input
                    type="password"
                    required={!isEditing}
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={isEditing ? "Leave blank to keep unchanged" : "Minimum 6 characters"}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Account Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Staff">Staff</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Account Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Active">Active (Can log in)</option>
                    <option value="Inactive">Inactive (Access suspended)</option>
                  </select>
                </div>
              </div>

              {/* Permissions Checklist */}
              {formData.role === "Super Admin" ? (
                <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4 dark:border-purple-900/60 dark:bg-purple-950/30">
                  <p className="font-bold text-purple-900 dark:text-purple-200">
                    🌟 Super Administrator Role
                  </p>
                  <p className="mt-1 text-xs text-purple-800 dark:text-purple-300">
                    Super Administrators have unrestricted access to all 15 sidebar modules and all financial revenue figures. Permissions are granted automatically.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3 dark:border-slate-700">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        Sidebar Module Permissions
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Select which navigation modules this staff member can access.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={selectAllPermissions}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      >
                        Select All (15)
                      </button>
                      <button
                        type="button"
                        onClick={clearAllPermissions}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  {/* Revenue Masking Guarantee Notice */}
                  <div className="my-3 rounded-xl border border-blue-200 bg-blue-50/80 p-3 text-xs text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                    <span className="font-bold">🔒 Financial Privacy Guard:</span> When granting <strong>Rent Bills</strong> permission to Staff, overall revenue metrics (<code>Pending Balance</code> and <code>Collected</code>) are automatically masked and hidden.
                  </div>

                  {/* Permissions Checklist Grid */}
                  <div className="mt-3 grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                    {AVAILABLE_PERMISSIONS.map((perm) => {
                      const isChecked = formData.permissions.includes(perm.id);
                      return (
                        <label
                          key={perm.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                            isChecked
                              ? "border-blue-500 bg-blue-50/60 dark:border-blue-500 dark:bg-blue-950/40"
                              : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(perm.id)}
                            className="mt-0.5 h-4 w-4 rounded accent-blue-600"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {perm.name}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-400">
                                {perm.category}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                              {perm.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Submit / Cancel Buttons */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end dark:border-slate-800">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={closeModal}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting
                    ? "Saving Staff User..."
                    : isEditing
                    ? "Update Staff Member"
                    : "Create Staff User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
