/* eslint-disable @next/next/no-img-element -- Existing Supabase photo URLs are not restricted to a configured image host. */
"use client";

import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { safeStorageFileName, validateImageFile } from "@/lib/imageValidation";
import { resolveAuthenticatedResident } from "@/lib/residentPortalAuth";
import { supabase } from "@/lib/supabase";

type Row = Record<string, unknown>;
type Priority = "Low" | "Medium" | "High";
type OperationError = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
};
type MaintenancePhoto = {
  maintenance_request_id: string;
  photo_url: string;
};

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100";
const text = (value: unknown) => (value == null ? "" : String(value));
const field = (row: Row, keys: string[], fallback = "—") =>
  keys.map((key) => text(row[key]).trim()).find(Boolean) || fallback;
const photos = (input: unknown) =>
  Array.isArray(input)
    ? input.filter(
        (item): item is string => typeof item === "string" && item.length > 0,
      )
    : [];

function reportOperationError(operation: string, error: OperationError | null) {
  console.error(`[resident-maintenance] ${operation} failed`, {
    code: error?.code ?? null,
    message: error?.message ?? null,
    details: error?.details ?? null,
    hint: error?.hint ?? null,
  });
}

export default function ResidentMaintenancePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [requests, setRequests] = useState<Row[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [photo, setPhoto] = useState<File | null>(null);
  const [hasActiveAdmission, setHasActiveAdmission] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async (preserveFeedback = false) => {
    setLoading(true);
    if (!preserveFeedback) setError("");

    try {
      const auth = await resolveAuthenticatedResident();
      if (!auth.resident) {
        if (!preserveFeedback) {
          setError(
            auth.error || "Your resident profile could not be verified.",
          );
        }
        setRequests([]);
        return;
      }

      const [requestResult, admissionResult] = await Promise.all([
        supabase
          .from("maintenance_requests")
          .select(
            "id,request_number,title,description,category,priority,status,photo_url,before_photos,during_photos,after_photos,complaint_date,assigned_date,completion_date,completed_at,created_at,updated_at",
          )
          .eq("resident_id", auth.resident.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("admissions")
          .select("id")
          .eq("resident_id", auth.resident.id)
          .eq("status", "Active")
          .limit(1)
          .maybeSingle(),
      ]);

      if (admissionResult.error) {
        reportOperationError("active admission select", admissionResult.error);
      }
      setHasActiveAdmission(Boolean(admissionResult.data));

      if (requestResult.error) {
        reportOperationError("maintenance_requests select", requestResult.error);
        if (!preserveFeedback) {
          setError(
            "Your maintenance history could not be loaded. Please refresh and try again.",
          );
        }
        return;
      }

      const requestRows = (requestResult.data ?? []) as Row[];
      const requestIds = requestRows.map((request) => text(request.id));
      let photoRows: MaintenancePhoto[] = [];

      if (requestIds.length > 0) {
        const photoResult = await supabase
          .from("maintenance_photos")
          .select("maintenance_request_id,photo_url")
          .in("maintenance_request_id", requestIds)
          .order("created_at", { ascending: true });

        if (photoResult.error) {
          reportOperationError("maintenance_photos select", photoResult.error);
        } else {
          photoRows = (photoResult.data ?? []) as MaintenancePhoto[];
        }
      }

      setRequests(
        requestRows.map((request) => ({
          ...request,
          linked_photos: photoRows
            .filter(
              (photoRow) =>
                photoRow.maintenance_request_id === text(request.id),
            )
            .map((photoRow) => photoRow.photo_url),
        })),
      );
    } catch (loadError) {
      reportOperationError(
        "maintenance list refresh",
        loadError instanceof Error ? { message: loadError.message } : null,
      );
      if (!preserveFeedback) {
        setError(
          "Your maintenance history could not be loaded. Please refresh and try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (file) {
      const invalid = validateImageFile(file);
      if (invalid) {
        setPhoto(null);
        setError(invalid);
        event.target.value = "";
        return;
      }
    }
    setPhoto(file);
    setError("");
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setCategory("Other");
    setPriority("Medium");
    setPhoto(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      if (!title.trim() || !description.trim()) {
        throw new Error("REQUIRED");
      }
      if (photo) {
        const invalid = validateImageFile(photo);
        if (invalid) throw new Error("INVALID_PHOTO");
      }

      const auth = await resolveAuthenticatedResident();
      if (!auth.resident) throw new Error("AUTH");

      const admissionResult = await supabase
        .from("admissions")
        .select("id,room_id,status")
        .eq("resident_id", auth.resident.id)
        .eq("status", "Active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (admissionResult.error) {
        reportOperationError(
          "active admission select",
          admissionResult.error,
        );
        throw new Error("ADMISSION");
      }
      if (!admissionResult.data?.room_id) throw new Error("ADMISSION");

      const roomResult = await supabase
        .from("rooms")
        .select("id,status")
        .eq("id", admissionResult.data.room_id)
        .maybeSingle();

      if (roomResult.error) {
        reportOperationError("admission room select", roomResult.error);
        throw new Error("ROOM");
      }
      if (
        !roomResult.data ||
        text(roomResult.data.status).trim().toLowerCase() === "inactive"
      ) {
        throw new Error("ROOM");
      }

      const requestResult = await supabase
        .from("maintenance_requests")
        .insert({
          request_number: `MNT-${new Date().getFullYear()}-${Date.now()
            .toString()
            .slice(-7)}`,
          resident_id: auth.resident.id,
          room_id: roomResult.data.id,
          title: title.trim(),
          description: description.trim(),
          complaint_description: description.trim(),
          category,
          priority,
          status: "Pending",
          complaint_date: new Date().toISOString().slice(0, 10),
        })
        .select("id")
        .single();

      if (requestResult.error || !requestResult.data) {
        reportOperationError(
          "maintenance_requests insert",
          requestResult.error,
        );
        throw new Error("REQUEST_INSERT");
      }

      let photoFailed = false;
      if (photo) {
        try {
          const path = `requests/${requestResult.data.id}/before/${Date.now()}-${safeStorageFileName(photo)}`;
          const uploadResult = await supabase.storage
            .from("maintenance-photos")
            .upload(path, photo, {
              cacheControl: "3600",
              contentType: photo.type,
              upsert: false,
            });

          if (uploadResult.error) {
            reportOperationError(
              "maintenance-photos storage upload",
              uploadResult.error,
            );
            throw new Error("PHOTO_UPLOAD");
          }

          const photoUrl = supabase.storage
            .from("maintenance-photos")
            .getPublicUrl(path).data.publicUrl;
          const photoLinkResult = await supabase
            .from("maintenance_photos")
            .insert({
              maintenance_request_id: requestResult.data.id,
              photo_type: "before",
              photo_url: photoUrl,
              created_at: new Date().toISOString(),
            });

          if (photoLinkResult.error) {
            reportOperationError(
              "maintenance_photos insert",
              photoLinkResult.error,
            );
            throw new Error("PHOTO_LINK");
          }
        } catch {
          photoFailed = true;
        }
      }

      resetForm();
      if (photoFailed) {
        setError(
          "Maintenance request was saved, but the photo could not be attached. Please contact management if needed.",
        );
      } else {
        setMessage("Maintenance request submitted successfully.");
      }
      void load(true);
    } catch (caught) {
      const code = caught instanceof Error ? caught.message : "";
      const messages: Record<string, string> = {
        REQUIRED: "Title and description are required.",
        INVALID_PHOTO:
          photo && validateImageFile(photo)
            ? validateImageFile(photo)!
            : "Please select a valid image.",
        AUTH: "Your resident profile could not be verified. Please sign in again.",
        ADMISSION:
          "A current Active admission is required before submitting a maintenance request.",
        ROOM: "Your current admission room could not be verified. Please contact management.",
        REQUEST_INSERT:
          "Your maintenance request could not be submitted. Please try again.",
      };
      setError(
        messages[code] ||
          "Your maintenance request could not be submitted. Please try again.",
      );
    } finally {
      setSaving(false);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
            StayHub Resident Portal
          </p>
          <h1 className="mt-2 text-3xl font-bold">My Maintenance</h1>
          <p className="mt-1 text-sm text-slate-500">
            Submit a request for your current room and track its status.
          </p>
          <Link
            href="/resident-portal"
            className="mt-4 inline-flex text-sm font-semibold text-indigo-700"
          >
            Back to portal
          </Link>
        </section>

        {(message || error) && (
          <p
            className={`rounded-2xl border p-4 text-sm font-medium ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {error || message}
          </p>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">New Maintenance Request</h2>
          {!hasActiveAdmission && !loading ? (
            <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Your admission is awaiting contract signing, deposit verification, and admin activation.
            </p>
          ) : (
          <form
            onSubmit={submit}
            className="mt-5 grid gap-4 md:grid-cols-2"
          >
            <label>
              <span className="mb-2 block text-sm font-semibold">Title *</span>
              <input
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className={inputClass}
                disabled={saving}
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">Category</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className={inputClass}
                disabled={saving}
              >
                {["Electrical", "Plumbing", "Furniture", "Appliance", "Cleaning", "Internet", "Other"].map(
                  (item) => <option key={item}>{item}</option>,
                )}
              </select>
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">Priority</span>
              <select
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as Priority)
                }
                className={inputClass}
                disabled={saving}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">Issue Photo</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={choosePhoto}
                className={inputClass}
                disabled={saving}
              />
            </label>
            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-semibold">Description *</span>
              <textarea
                required
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className={`${inputClass} min-h-28`}
                disabled={saving}
              />
            </label>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
          )}
        </section>

        <section className="space-y-4">
          {loading ? (
            <p className="rounded-3xl bg-white p-8 text-center text-slate-500">
              Loading requests...
            </p>
          ) : requests.length === 0 ? (
            <p className="rounded-3xl bg-white p-8 text-center text-slate-500">
              No maintenance requests found.
            </p>
          ) : (
            requests.map((request) => (
              <ResidentRequestCard key={text(request.id)} request={request} />
            ))
          )}
        </section>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}

function ResidentRequestCard({ request }: { request: Row }) {
  const gallery = Array.from(
    new Set([
      ...photos(request.linked_photos),
      ...photos(request.before_photos),
      ...photos(request.during_photos),
      ...photos(request.after_photos),
      ...(text(request.photo_url) ? [text(request.photo_url)] : []),
    ]),
  );
  const status = field(request, ["status"], "Pending");

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-indigo-600">
            {field(request, ["request_number"], "Request")}
          </p>
          <h2 className="mt-1 text-xl font-bold">{field(request, ["title"])}</h2>
          <p className="mt-2 text-sm text-slate-600">
            {field(request, ["description"])}
          </p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
          {status}
        </span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Info
          label="Date"
          value={field(request, ["complaint_date", "created_at"]).slice(0, 10)}
        />
        <Info label="Category" value={field(request, ["category"], "Other")} />
        <Info label="Priority" value={field(request, ["priority"], "Medium")} />
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-5">
        <Timeline label="Created" date={text(request.created_at)} />
        <Timeline label="Assigned" date={text(request.assigned_date)} />
        <Timeline
          label="In Progress"
          date={["In Progress", "Completed"].includes(status) ? text(request.updated_at) : ""}
        />
        <Timeline
          label="Completed"
          date={text(request.completed_at || request.completion_date)}
        />
        <Timeline
          label="Cancelled"
          date={status === "Cancelled" ? text(request.updated_at) : ""}
        />
      </div>
      {gallery.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {gallery.map((url, index) => (
            <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer">
              <img
                src={url}
                alt={`Maintenance photo ${index + 1}`}
                className="h-36 w-full rounded-xl border object-cover"
              />
            </a>
          ))}
        </div>
      )}
    </article>
  );
}

function Timeline({ label, date }: { label: string; date: string }) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        date
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <p className="text-xs font-semibold">{label}</p>
      <p className="mt-1 text-xs text-slate-500">
        {date ? date.slice(0, 10) : "Not recorded"}
      </p>
    </div>
  );
}
