"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import { getSupabaseErrorMessage } from "@/lib/supabaseErrors";

type ProfileTab = "profile" | "account" | "security";

type StaffProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  status: string | null;
};

type ProfileForm = {
  fullName: string;
  phone: string;
  avatarUrl: string;
};

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-950 dark:disabled:bg-slate-900";

function getInitials(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length) {
    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }
  return email.charAt(0).toUpperCase() || "A";
}

function displayRole(role: string | null) {
  const value = role?.trim();
  if (!value) return "Staff";
  return value.toLowerCase() === "admin" ? "Admin" : value;
}

function Avatar({ name, email, avatarUrl, size = "small" }: {
  name: string;
  email: string;
  avatarUrl: string;
  size?: "small" | "large";
}) {
  const dimensions = size === "large" ? "h-24 w-24 text-2xl" : "h-10 w-10 text-sm";

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 font-bold text-white ring-2 ring-white dark:ring-slate-800 ${dimensions}`}
      aria-hidden="true"
    >
      {avatarUrl ? (
        // A CSS background avoids imposing Next Image host configuration on user-provided URLs.
        <span className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(avatarUrl)})` }} />
      ) : (
        getInitials(name, email)
      )}
    </span>
  );
}

export default function ProfileDropdown() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [modalTab, setModalTab] = useState<ProfileTab | null>(null);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      const user = authData.user;
      if (authError || !user?.email) {
        setLoadError("Your profile session could not be loaded.");
        return;
      }

      setAuthEmail(user.email);
      setAvatarUrl(typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : "");

      const { data, error } = await supabase
        .from("staff_users")
        .select("id, full_name, email, phone, role, status")
        .ilike("email", user.email)
        .maybeSingle();

      if (error) {
        setLoadError(getSupabaseErrorMessage(error, "Your staff profile could not be loaded."));
      } else if (!data) {
        setLoadError("No staff profile is linked to this account.");
      } else {
        setProfile(data as StaffProfile);
      }
    } catch {
      setLoadError("Your profile could not be loaded. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadProfile(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadProfile]);

  useEffect(() => {
    if (!open) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError("");
    const { error } = await supabase.auth.signOut();
    if (error) {
      setLogoutError(error.message || "Unable to log out. Please try again.");
      setLoggingOut(false);
      return;
    }
    router.replace("/admin123");
    router.refresh();
  }

  function openPanel(tab: ProfileTab) {
    setOpen(false);
    setModalTab(tab);
  }

  const name = profile?.full_name?.trim() || "University Girls Hostel User";
  const email = authEmail || profile?.email || "";

  return (
    <>
      <div ref={menuRef} className="relative">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="group flex max-w-[15rem] items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 pr-2.5 text-left shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 focus:outline-none focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-700 dark:hover:bg-slate-700 dark:focus:ring-indigo-950"
        >
          <Avatar name={name} email={email} avatarUrl={avatarUrl} />
          <span className="hidden min-w-0 sm:block">
            <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">
              {loading ? "Loading profile..." : name}
            </span>
            <span className="block truncate text-xs text-slate-500 dark:text-slate-300">
              {displayRole(profile?.role ?? null)}
            </span>
          </span>
          <svg className={`hidden h-4 w-4 shrink-0 text-slate-400 transition sm:block ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
          </svg>
        </button>

        {open && (
          <div role="menu" className="absolute right-0 z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/80">
              <Avatar name={name} email={email} avatarUrl={avatarUrl} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{name}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-300">{email || "Email unavailable"}</p>
                <span className="mt-1.5 inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
                  {displayRole(profile?.role ?? null)} · {profile?.status || "Active"}
                </span>
              </div>
            </div>

            {loadError && <p role="alert" className="border-b border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">{loadError}</p>}

            <div className="p-2">
              <MenuButton icon={<UserIcon />} label="My Profile" description="View and edit personal details" onClick={() => openPanel("profile")} />
              <MenuButton icon={<SettingsIcon />} label="Account Settings" description="Profile and avatar preferences" onClick={() => openPanel("account")} />
              <MenuButton icon={<ShieldIcon />} label="Security" description="Change your account password" onClick={() => openPanel("security")} />
            </div>

            <div className="border-t border-slate-100 p-2 dark:border-slate-700">
              <button type="button" role="menuitem" disabled={loggingOut} onClick={() => void handleLogout()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60 dark:text-red-300 dark:hover:bg-red-950/50">
                <LogoutIcon /> {loggingOut ? "Logging out..." : "Logout"}
              </button>
              {logoutError && <p role="alert" className="px-3 pb-2 text-xs text-red-600 dark:text-red-300">{logoutError}</p>}
            </div>
          </div>
        )}
      </div>

      {modalTab && (
        <ProfileModal
          initialTab={modalTab}
          profile={profile}
          authEmail={authEmail}
          avatarUrl={avatarUrl}
          onClose={() => setModalTab(null)}
          onUpdated={loadProfile}
        />
      )}
    </>
  );
}

function MenuButton({ icon, label, description, onClick }: { icon: ReactNode; label: string; description: string; onClick: () => void }) {
  return (
    <button type="button" role="menuitem" onClick={onClick} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:hover:bg-slate-800 dark:focus:ring-indigo-800">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</span>
        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{description}</span>
      </span>
    </button>
  );
}

function ProfileModal({ initialTab, profile, authEmail, avatarUrl, onClose, onUpdated }: {
  initialTab: ProfileTab;
  profile: StaffProfile | null;
  authEmail: string;
  avatarUrl: string;
  onClose: () => void;
  onUpdated: () => Promise<void>;
}) {
  const [tab, setTab] = useState(initialTab);
  const [form, setForm] = useState<ProfileForm>({ fullName: profile?.full_name ?? "", phone: profile?.phone ?? "", avatarUrl });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [password, setPassword] = useState({ current: "", next: "", confirm: "" });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  function selectTab(nextTab: ProfileTab) {
    setTab(nextTab);
    setMessage("");
    setError("");
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) {
      setError("No staff profile is linked to this account.");
      return;
    }
    if (!form.fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (form.avatarUrl.trim()) {
      try {
        const url = new URL(form.avatarUrl.trim());
        if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      } catch {
        setError("Avatar must be a valid http or https image URL.");
        return;
      }
    }

    setSaving(true);
    setMessage("");
    setError("");

    const { error: profileError } = await supabase
      .from("staff_users")
      .update({ full_name: form.fullName.trim(), phone: form.phone.trim() || null, updated_at: new Date().toISOString() })
      .eq("id", profile.id);

    if (profileError) {
      setError(getSupabaseErrorMessage(profileError, "Your profile could not be updated."));
      setSaving(false);
      return;
    }

    const { error: metadataError } = await supabase.auth.updateUser({
      data: { full_name: form.fullName.trim(), avatar_url: form.avatarUrl.trim() || null },
    });

    if (metadataError) {
      setError(metadataError.message || "Your avatar could not be updated.");
    } else {
      setMessage("Your profile has been updated.");
      await onUpdated();
    }
    setSaving(false);
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!authEmail) {
      setError("Your authenticated email is unavailable. Please sign in again.");
      return;
    }
    if (password.next.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      return;
    }
    if (password.next !== password.confirm) {
      setError("The new password and confirmation do not match.");
      return;
    }
    if (password.current === password.next) {
      setError("Choose a new password that is different from your current password.");
      return;
    }
    if (!window.confirm("Change your University Girls Hostel account password now? You will use the new password the next time you sign in.")) return;

    setChangingPassword(true);
    const { error: verifyError } = await supabase.auth.signInWithPassword({ email: authEmail, password: password.current });
    if (verifyError) {
      setError("Your current password is incorrect.");
      setChangingPassword(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: password.next });
    if (updateError) {
      setError(updateError.message || "Your password could not be changed.");
    } else {
      setPassword({ current: "", next: "", confirm: "" });
      setMessage("Your password was changed successfully.");
    }
    setChangingPassword(false);
  }

  const name = profile?.full_name || "University Girls Hostel User";
  const email = authEmail || profile?.email || "";

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="profile-dialog-title" className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6 dark:border-slate-700">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">University Girls Hostel account</p>
            <h2 id="profile-dialog-title" className="mt-1 text-xl font-bold text-slate-900 dark:text-white">Profile & security</h2>
          </div>
          <button type="button" aria-label="Close profile panel" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl text-2xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white">×</button>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-slate-200 px-3 pt-2 sm:px-6 dark:border-slate-700" role="tablist">
          {(["profile", "account", "security"] as ProfileTab[]).map((item) => (
            <button key={item} type="button" role="tab" aria-selected={tab === item} onClick={() => selectTab(item)} className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold capitalize transition ${tab === item ? "border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-300" : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"}`}>{item === "account" ? "Account settings" : item}</button>
          ))}
        </div>

        <div className="overflow-y-auto p-5 sm:p-6">
          {(message || error) && <div role={error ? "alert" : "status"} className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-medium ${error ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200" : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"}`}>{error || message}</div>}

          {tab === "profile" && (
            <div className="space-y-6">
              <div className="flex flex-col items-start gap-4 rounded-2xl bg-slate-50 p-5 sm:flex-row sm:items-center dark:bg-slate-800/70">
                <Avatar name={name} email={email} avatarUrl={avatarUrl} size="large" />
                <div className="min-w-0">
                  <h3 className="truncate text-xl font-bold text-slate-900 dark:text-white">{name}</h3>
                  <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-300">{email}</p>
                  <div className="mt-3 flex flex-wrap gap-2"><Badge>{displayRole(profile?.role ?? null)}</Badge><Badge tone="green">{profile?.status || "Active"}</Badge></div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Info label="Full name" value={name} />
                <Info label="Email" value={email || "Not available"} />
                <Info label="Phone number" value={profile?.phone || "Not recorded"} />
                <Info label="Role / status" value={`${displayRole(profile?.role ?? null)} · ${profile?.status || "Active"}`} />
              </div>
              <button type="button" onClick={() => selectTab("account")} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700">Edit profile</button>
            </div>
          )}

          {tab === "account" && (
            <form onSubmit={saveProfile} className="space-y-5">
              <div className="flex items-center gap-4"><Avatar name={form.fullName || name} email={email} avatarUrl={form.avatarUrl} size="large" /><div><h3 className="font-bold text-slate-900 dark:text-white">Personal information</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Changes appear in your admin menu.</p></div></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name"><input required value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} className={inputClass} /></Field>
                <Field label="Email"><input readOnly value={email} className={inputClass} /><span className="mt-1.5 block text-xs text-slate-500">Email is controlled by Supabase Auth.</span></Field>
                <Field label="Phone number"><input type="tel" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className={inputClass} placeholder="+92 300 1234567" /></Field>
                <Field label="Role / status"><input disabled value={`${displayRole(profile?.role ?? null)} · ${profile?.status || "Active"}`} className={inputClass} /></Field>
                <div className="sm:col-span-2"><Field label="Avatar image URL"><input type="url" value={form.avatarUrl} onChange={(event) => setForm((current) => ({ ...current, avatarUrl: event.target.value }))} className={inputClass} placeholder="https://example.com/avatar.jpg" /><span className="mt-1.5 block text-xs text-slate-500">Use a public HTTPS image URL, or leave blank to show your initials.</span></Field></div>
              </div>
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end dark:border-slate-700"><button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200">Cancel</button><button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60">{saving ? "Saving..." : "Save changes"}</button></div>
            </form>
          )}

          {tab === "security" && (
            <form onSubmit={changePassword} className="space-y-5">
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200"><p className="font-bold">Secure password change</p><p className="mt-1 leading-6">We will verify your current password before Supabase Auth applies the new one.</p></div>
              <Field label="Current password"><input required type="password" autoComplete="current-password" value={password.current} onChange={(event) => setPassword((current) => ({ ...current, current: event.target.value }))} className={inputClass} /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="New password"><input required minLength={8} type="password" autoComplete="new-password" value={password.next} onChange={(event) => setPassword((current) => ({ ...current, next: event.target.value }))} className={inputClass} /><span className="mt-1.5 block text-xs text-slate-500">Use at least 8 characters.</span></Field>
                <Field label="Confirm new password"><input required minLength={8} type="password" autoComplete="new-password" value={password.confirm} onChange={(event) => setPassword((current) => ({ ...current, confirm: event.target.value }))} className={inputClass} /></Field>
              </div>
              <div className="flex justify-end border-t border-slate-200 pt-5 dark:border-slate-700"><button type="submit" disabled={changingPassword} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60">{changingPassword ? "Changing password..." : "Change password"}</button></div>
            </form>
          )}

          <div className="mt-6 border-t border-slate-100 pt-4 text-center dark:border-slate-800"><Link href="/profile" onClick={onClose} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300">Open full profile page →</Link></div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label><span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>{children}</label>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"><p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p><p className="mt-2 break-words text-sm font-semibold text-slate-900 dark:text-white">{value}</p></div>; }
function Badge({ children, tone = "indigo" }: { children: ReactNode; tone?: "indigo" | "green" }) { return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tone === "green" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"}`}>{children}</span>; }
function UserIcon() { return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>; }
function SettingsIcon() { return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.1.4.3.7.6 1 .3.3.7.4 1.1.4h.1v4h-.1a1.7 1.7 0 0 0-1.7.6Z"/></svg>; }
function ShieldIcon() { return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>; }
function LogoutIcon() { return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-6"/></svg>; }
