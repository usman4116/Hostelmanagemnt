"use client";

import Link from "next/link";
import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import { isActiveAdmin } from "@/lib/adminRoles";
import { supabase } from "@/lib/supabase";
import { getSupabaseErrorMessage } from "@/lib/supabaseErrors";

type SettingsForm = {
  hostel_name: string;
  hostel_tagline: string;
  hostel_address: string;
  contact_number: string;
  email: string;
  manager_name: string;
  default_currency: string;
  default_payment_method: string;
  security_deposit_rule_days: string;
  security_deposit_policy: string;
  invoice_prefix: string;
  receipt_prefix: string;
  logo_url: string;
  allow_online_payments: boolean;
  allow_receipt_uploads: boolean;
  enable_email_notifications: boolean;
  enable_sms_notifications: boolean;
  enable_whatsapp_notifications: boolean;
  auto_backup_enabled: boolean;
  backup_frequency: string;
  notes: string;
};

const emptyForm: SettingsForm = {
  hostel_name: "Hostel Management System",
  hostel_tagline: "Hostel Management",
  hostel_address: "",
  contact_number: "",
  email: "",
  manager_name: "",
  default_currency: "PKR",
  default_payment_method: "Payment Method",
  security_deposit_rule_days: "30",
  security_deposit_policy:
    "Security deposit is refundable only when the resident serves notice at least 30 days before leaving.",
  invoice_prefix: "INV",
  receipt_prefix: "RCP",
  logo_url: "",
  allow_online_payments: true,
  allow_receipt_uploads: true,
  enable_email_notifications: false,
  enable_sms_notifications: false,
  enable_whatsapp_notifications: false,
  auto_backup_enabled: false,
  backup_frequency: "Weekly",
  notes: "",
};

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100";

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showAdminTools, setShowAdminTools] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error: loadError } = await supabase
      .from("system_settings")
      .select("*")
      .eq("setting_key", "main")
      .maybeSingle();

    if (loadError) {
      setError(getSupabaseErrorMessage(loadError, "Hostel settings could not be loaded."));
    } else if (data) {
      setForm({
        hostel_name: data.hostel_name ?? emptyForm.hostel_name,
        hostel_tagline: data.hostel_tagline ?? emptyForm.hostel_tagline,
        hostel_address: data.hostel_address ?? "",
        contact_number: data.contact_number ?? "",
        email: data.email ?? "",
        manager_name: data.manager_name ?? "",
        default_currency: data.default_currency ?? "PKR",
        default_payment_method:
          data.default_payment_method ?? "Payment Method",
        security_deposit_rule_days: String(
          data.security_deposit_rule_days ?? 30
        ),
        security_deposit_policy:
          data.security_deposit_policy ??
          emptyForm.security_deposit_policy,
        invoice_prefix: data.invoice_prefix ?? "INV",
        receipt_prefix: data.receipt_prefix ?? "RCP",
        logo_url: data.logo_url ?? "",
        allow_online_payments: Boolean(data.allow_online_payments),
        allow_receipt_uploads: Boolean(data.allow_receipt_uploads),
        enable_email_notifications: Boolean(
          data.enable_email_notifications
        ),
        enable_sms_notifications: Boolean(data.enable_sms_notifications),
        enable_whatsapp_notifications: Boolean(
          data.enable_whatsapp_notifications
        ),
        auto_backup_enabled: Boolean(data.auto_backup_enabled),
        backup_frequency: data.backup_frequency ?? "Weekly",
        notes: data.notes ?? "",
      });
    }

    const { data: authData } = await supabase.auth.getUser();
    if (authData.user?.email) {
      const { data: staff } = await supabase
        .from("staff_users")
        .select("role, status")
        .ilike("email", authData.user.email)
        .maybeSingle();
      setShowAdminTools(isActiveAdmin(staff?.role, staff?.status));
    } else {
      setShowAdminTools(false);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadSettings(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadSettings]);

  function updateField<K extends keyof SettingsForm>(
    key: K,
    value: SettingsForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    const noticeDays = Number(form.security_deposit_rule_days || 0);

    if (!form.hostel_name.trim()) {
      setError("Hostel name is required.");
      setSaving(false);
      return;
    }

    if (Number.isNaN(noticeDays) || noticeDays < 0) {
      setError("Security deposit notice days must be zero or greater.");
      setSaving(false);
      return;
    }

    const payload = {
      setting_key: "main",
      hostel_name: form.hostel_name.trim(),
      hostel_tagline: form.hostel_tagline.trim() || null,
      hostel_address: form.hostel_address.trim() || null,
      contact_number: form.contact_number.trim() || null,
      email: form.email.trim() || null,
      manager_name: form.manager_name.trim() || null,
      default_currency: form.default_currency.trim() || "PKR",
      default_payment_method:
        form.default_payment_method.trim() || "Payment Method",
      security_deposit_rule_days: noticeDays,
      security_deposit_policy:
        form.security_deposit_policy.trim() || null,
      invoice_prefix: form.invoice_prefix.trim() || "INV",
      receipt_prefix: form.receipt_prefix.trim() || "RCP",
      logo_url: form.logo_url.trim() || null,
      allow_online_payments: form.allow_online_payments,
      allow_receipt_uploads: form.allow_receipt_uploads,
      enable_email_notifications: form.enable_email_notifications,
      enable_sms_notifications: form.enable_sms_notifications,
      enable_whatsapp_notifications: form.enable_whatsapp_notifications,
      auto_backup_enabled: form.auto_backup_enabled,
      backup_frequency: form.backup_frequency,
      notes: form.notes.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { error: saveError } = await supabase
      .from("system_settings")
      .upsert(payload, {
        onConflict: "setting_key",
      });

    if (saveError) {
      setError(getSupabaseErrorMessage(saveError, "Hostel settings could not be saved."));
    } else {
      setMessage("Settings saved successfully.");
      await loadSettings();
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Loading settings...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Hostel Management System
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Settings
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage hostel information, payment rules, notifications and system preferences.
          </p>
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

        <form onSubmit={saveSettings} className="space-y-6">
          <Section title="Hostel Information">
            <Field label="Hostel Name *">
              <input
                required
                value={form.hostel_name}
                onChange={(event) =>
                  updateField("hostel_name", event.target.value)
                }
                className={inputClass}
              />
            </Field>

            <Field label="Tagline">
              <input
                value={form.hostel_tagline}
                onChange={(event) =>
                  updateField("hostel_tagline", event.target.value)
                }
                className={inputClass}
              />
            </Field>

            <Field label="Manager Name">
              <input
                value={form.manager_name}
                onChange={(event) =>
                  updateField("manager_name", event.target.value)
                }
                className={inputClass}
              />
            </Field>

            <Field label="Contact Number">
              <input
                value={form.contact_number}
                onChange={(event) =>
                  updateField("contact_number", event.target.value)
                }
                className={inputClass}
              />
            </Field>

            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  updateField("email", event.target.value)
                }
                className={inputClass}
              />
            </Field>

            <Field label="Logo URL">
              <input
                type="url"
                value={form.logo_url}
                onChange={(event) =>
                  updateField("logo_url", event.target.value)
                }
                className={inputClass}
                placeholder="https://..."
              />
            </Field>

            <Field label="Address" wide>
              <textarea
                value={form.hostel_address}
                onChange={(event) =>
                  updateField("hostel_address", event.target.value)
                }
                className={`${inputClass} min-h-24`}
              />
            </Field>
          </Section>

          <Section title="Billing and Payments">
            <Field label="Default Currency">
              <input
                value={form.default_currency}
                onChange={(event) =>
                  updateField("default_currency", event.target.value)
                }
                className={inputClass}
              />
            </Field>

            <Field label="Default Payment Method">
              <input
                value={form.default_payment_method}
                onChange={(event) =>
                  updateField("default_payment_method", event.target.value)
                }
                className={inputClass}
              />
            </Field>

            <Field label="Invoice Prefix">
              <input
                value={form.invoice_prefix}
                onChange={(event) =>
                  updateField("invoice_prefix", event.target.value)
                }
                className={inputClass}
              />
            </Field>

            <Field label="Receipt Prefix">
              <input
                value={form.receipt_prefix}
                onChange={(event) =>
                  updateField("receipt_prefix", event.target.value)
                }
                className={inputClass}
              />
            </Field>

            <Toggle
              label="Allow Online Payments"
              checked={form.allow_online_payments}
              onChange={(value) =>
                updateField("allow_online_payments", value)
              }
            />

            <Toggle
              label="Allow Receipt Uploads"
              checked={form.allow_receipt_uploads}
              onChange={(value) =>
                updateField("allow_receipt_uploads", value)
              }
            />
          </Section>

          <Section title="Security Deposit Policy">
            <Field label="Notice Period Days">
              <input
                type="number"
                min="0"
                value={form.security_deposit_rule_days}
                onChange={(event) =>
                  updateField(
                    "security_deposit_rule_days",
                    event.target.value
                  )
                }
                className={inputClass}
              />
            </Field>

            <Field label="Deposit Policy" wide>
              <textarea
                value={form.security_deposit_policy}
                onChange={(event) =>
                  updateField(
                    "security_deposit_policy",
                    event.target.value
                  )
                }
                className={`${inputClass} min-h-28`}
              />
            </Field>
          </Section>

          <Section title="Notifications">
            <Toggle
              label="Email Notifications"
              checked={form.enable_email_notifications}
              onChange={(value) =>
                updateField("enable_email_notifications", value)
              }
            />

            <Toggle
              label="SMS Notifications"
              checked={form.enable_sms_notifications}
              onChange={(value) =>
                updateField("enable_sms_notifications", value)
              }
            />

            <Toggle
              label="WhatsApp Notifications"
              checked={form.enable_whatsapp_notifications}
              onChange={(value) =>
                updateField("enable_whatsapp_notifications", value)
              }
            />
          </Section>

          <Section title="Backup and System">
            <Toggle
              label="Enable Automatic Backup"
              checked={form.auto_backup_enabled}
              onChange={(value) =>
                updateField("auto_backup_enabled", value)
              }
            />

            <Field label="Backup Frequency">
              <select
                value={form.backup_frequency}
                onChange={(event) =>
                  updateField("backup_frequency", event.target.value)
                }
                className={inputClass}
                disabled={!form.auto_backup_enabled}
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </Field>

            <Field label="System Notes" wide>
              <textarea
                value={form.notes}
                onChange={(event) =>
                  updateField("notes", event.target.value)
                }
                className={`${inputClass} min-h-24`}
              />
            </Field>
          </Section>

          {showAdminTools && (
            <section className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                    <AdminToolsIcon />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Admin Tools</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Manage destructive maintenance actions and system resets.
                    </p>
                  </div>
                </div>
                <Link
                  href="/dashboard/settings/data-management"
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-amber-700 focus:outline-none focus:ring-4 focus:ring-amber-200"
                >
                  Open Admin Data Management
                </Link>
              </div>
            </section>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function AdminToolsIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="M9 12h6M12 9v6" />
    </svg>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-bold text-slate-900">{title}</h2>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  wide = false,
  children,
}: {
  label: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={wide ? "md:col-span-2 xl:col-span-3" : ""}>
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex min-h-[44px] items-center gap-3 rounded-xl border border-slate-300 px-3 py-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4"
      />

      <span className="text-sm font-medium text-slate-700">{label}</span>
    </label>
  );
}
