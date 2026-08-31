"use client";

import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import { getSupabaseErrorMessage } from "@/lib/supabaseErrors";

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  status: string | null;
  notes: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ProfileForm = {
  full_name: string;
  email: string;
  phone: string;
  notes: string;
};

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100";

const emptyForm: ProfileForm = {
  full_name: "",
  email: "",
  phone: "",
  notes: "",
};

function text(value: unknown) {
  return value == null ? "" : String(value);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "A";

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<UserRow | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data: authData, error: authError } = await supabase.auth.getUser();
    const authEmail = authData.user?.email;

    if (authError || !authEmail) {
      setError("Your authenticated profile could not be loaded. Please sign in again.");
      setLoading(false);
      return;
    }

    const profileResult = await supabase
      .from("staff_users")
      .select("*")
      .ilike("email", authEmail)
      .maybeSingle();

    const selectedProfile = profileResult.data as UserRow | null;
    const selectedError = profileResult.error;

    if (selectedError) {
      setError(getSupabaseErrorMessage(selectedError, "The administrator profile could not be loaded."));
    } else if (!selectedProfile) {
      setError(
        "No staff profile is linked to your authenticated email."
      );
    } else {
      setProfile(selectedProfile);
      setForm({
        full_name: text(selectedProfile.full_name),
        email: text(selectedProfile.email),
        phone: text(selectedProfile.phone),
        notes: text(selectedProfile.notes),
      });
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadProfile(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadProfile]);

  function updateField<K extends keyof ProfileForm>(
    key: K,
    value: ProfileForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function cancelEdit() {
    if (!profile) return;

    setForm({
      full_name: text(profile.full_name),
      email: text(profile.email),
      phone: text(profile.phone),
      notes: text(profile.notes),
    });

    setEditing(false);
    setMessage("");
    setError("");
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile) return;

    if (!form.full_name.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    const payload = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
      notes: form.notes.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("staff_users")
      .update(payload)
      .eq("id", profile.id);

    if (updateError) {
      setError(getSupabaseErrorMessage(updateError, "The administrator profile could not be updated."));
    } else {
      setMessage("Admin profile updated successfully.");
      setEditing(false);
      await loadProfile();
    }

    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
              Hostel Management System
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Admin Profile
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View and update administrator account information.
            </p>
          </div>

          {profile && !editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setMessage("");
                setError("");
              }}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Edit Profile
            </button>
          )}
        </section>

        {(message || error) && (
          <section
            className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {error || message}
          </section>
        )}

        {loading ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
            Loading admin profile...
          </section>
        ) : profile ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-6 md:flex-row">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-indigo-100 text-4xl font-bold text-indigo-700">
                {initials(text(profile.full_name))}
              </div>

              <div className="flex-1">
                <div className="flex flex-col gap-2 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {profile.full_name || "Administrator"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {profile.email || "No email recorded"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                      {profile.role || "Admin"}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        (profile.status || "").toLowerCase() === "inactive"
                          ? "bg-red-50 text-red-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {profile.status || "Active"}
                    </span>
                  </div>
                </div>

                {editing ? (
                  <form onSubmit={saveProfile} className="mt-6 space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Full Name *">
                        <input
                          required
                          value={form.full_name}
                          onChange={(event) =>
                            updateField("full_name", event.target.value)
                          }
                          className={inputClass}
                          placeholder="Administrator name"
                        />
                      </Field>

                      <Field label="Email">
                        <input
                          readOnly
                          type="email"
                          value={form.email}
                          className={inputClass}
                          placeholder="admin@example.com"
                        />
                        <span className="mt-1.5 block text-xs text-slate-500">
                          Email is controlled by Supabase Auth.
                        </span>
                      </Field>

                      <Field label="Phone">
                        <input
                          value={form.phone}
                          onChange={(event) =>
                            updateField("phone", event.target.value)
                          }
                          className={inputClass}
                          placeholder="Phone number"
                        />
                      </Field>

                      <Field label="Role">
                        <input
                          disabled
                          value={profile.role || "Admin"}
                          className={inputClass}
                        />
                      </Field>

                      <div className="md:col-span-2">
                        <Field label="Notes">
                          <textarea
                            value={form.notes}
                            onChange={(event) =>
                              updateField("notes", event.target.value)
                            }
                            className={`${inputClass} min-h-32`}
                            placeholder="Additional administrator notes"
                          />
                        </Field>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <InfoCard
                      label="Full Name"
                      value={profile.full_name || "Not recorded"}
                    />

                    <InfoCard
                      label="Email"
                      value={profile.email || "Not recorded"}
                    />

                    <InfoCard
                      label="Phone"
                      value={profile.phone || "Not recorded"}
                    />

                    <InfoCard
                      label="Role"
                      value={profile.role || "Admin"}
                    />

                    <InfoCard
                      label="Status"
                      value={profile.status || "Active"}
                    />

                    <InfoCard
                      label="Created"
                      value={
                        profile.created_at
                          ? profile.created_at.slice(0, 10)
                          : "Not recorded"
                      }
                    />

                    <div className="md:col-span-2">
                      <InfoCard
                        label="Notes"
                        value={profile.notes || "No notes recorded"}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-slate-900">
        {value}
      </p>
    </article>
  );
}
