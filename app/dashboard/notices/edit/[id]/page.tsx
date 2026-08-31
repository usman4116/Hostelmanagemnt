"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { supabase } from "@/lib/supabase";

type AudienceType =
  | "All Residents"
  | "Selected Residents"
  | "Specific Room"
  | "Specific Resident"
  | "Staff";

type PriorityType =
  | "Low"
  | "Normal"
  | "High"
  | "Urgent";

type StatusType =
  | "Published"
  | "Active"
  | "Draft"
  | "Inactive";

type GenericRecord = {
  id: string | number;
  [key: string]:
    | string
    | number
    | boolean
    | null
    | undefined;
};

export default function EditNoticePage() {
  const router = useRouter();
  const params = useParams();

  const noticeId = Number(params.id);

  const [rooms, setRooms] =
    useState<GenericRecord[]>([]);

  const [residents, setResidents] =
    useState<GenericRecord[]>([]);

  const [staffMembers, setStaffMembers] =
    useState<GenericRecord[]>([]);

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [priority, setPriority] =
    useState<PriorityType>("Normal");

  const [audience, setAudience] =
    useState<AudienceType>("All Residents");

  const [roomId, setRoomId] =
    useState("");

  const [residentId, setResidentId] =
    useState("");
  const [selectedResidentIds, setSelectedResidentIds] = useState<string[]>([]);

  const [staffId, setStaffId] =
    useState("");

  const [attachmentUrl, setAttachmentUrl] =
    useState("");

  const [publishDate, setPublishDate] =
    useState("");

  const [expiryDate, setExpiryDate] =
    useState("");

  const [pinned, setPinned] =
    useState(false);

  const [status, setStatus] =
    useState<StatusType>("Active");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const roomOptions = useMemo(() => {
    return rooms.map((room) => ({
      value: room.id,
      label: `Room ${
        room.room_number ??
        room.room_name ??
        room.name ??
        room.id
      }`,
    }));
  }, [rooms]);

  const residentOptions = useMemo(() => {
    return residents.map((resident) => ({
      value: resident.id,
      label:
        resident.full_name ??
        resident.name ??
        `Resident ${resident.id}`,
    }));
  }, [residents]);

  const staffOptions = useMemo(() => {
    return staffMembers.map((staff) => ({
      value: staff.id,
      label:
        staff.full_name ??
        staff.name ??
        `Staff ${staff.id}`,
    }));
  }, [staffMembers]);

  const loadNotice = useCallback(async () => {
    setLoading(true);

    const [
      noticeResponse,
      roomsResponse,
      residentsResponse,
      staffResponse,
      recipientResponse,
    ] = await Promise.all([
      supabase
        .from("notices")
        .select("*")
        .eq("id", noticeId)
        .single(),

      supabase
        .from("rooms")
        .select("*")
        .order("id"),

      supabase
        .from("residents")
        .select("*")
        .order("id"),

      supabase
        .from("staff")
        .select("*")
        .order("id"),
      supabase
        .from("notice_recipients")
        .select("resident_id")
        .eq("notice_id", noticeId),
    ]);

    const error =
      noticeResponse.error ||
      roomsResponse.error ||
      residentsResponse.error ||
      staffResponse.error ||
      recipientResponse.error;

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    const notice = noticeResponse.data;
if (!notice) {
  setErrorMessage("Notice not found.");
  setLoading(false);
  return;
}
    setRooms(
      (roomsResponse.data ??
        []) as GenericRecord[]
    );

    setResidents(
      (residentsResponse.data ??
        []) as GenericRecord[]
    );

    setStaffMembers(
      (staffResponse.data ??
        []) as GenericRecord[]
    );
    setSelectedResidentIds((recipientResponse.data ?? []).map((row) => String(row.resident_id)));

    setTitle(notice.title ?? "");

    setDescription(
      notice.description ?? ""
    );

    setPriority(
      notice.priority as PriorityType
    );

    setAudience(
      notice.audience as AudienceType
    );

    setRoomId(
      notice.room_id
        ? String(notice.room_id)
        : ""
    );

    setResidentId(
      notice.resident_id
        ? String(
            notice.resident_id
          )
        : ""
    );

    setStaffId(
      notice.staff_id
        ? String(notice.staff_id)
        : ""
    );

    setAttachmentUrl(
      notice.attachment_url ?? ""
    );

    setPublishDate(
      notice.publish_date ?? ""
    );

    setExpiryDate(
      notice.expiry_date ?? ""
    );

    setPinned(
      notice.pinned ?? false
    );

    setStatus(
      notice.status as StatusType
    );

    setLoading(false);
  }, [noticeId]);

  useEffect(() => {
    if (!Number.isFinite(noticeId)) return;
    const timeoutId = window.setTimeout(() => void loadNotice(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadNotice, noticeId]);
 
const handleAudienceChange = (
    value: AudienceType
  ) => {
    setAudience(value);
    setRoomId("");
    setResidentId("");
    setSelectedResidentIds([]);
    setStaffId("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!Number.isFinite(noticeId)) {
      setErrorMessage("Invalid notice ID.");
      return;
    }

    if (!title.trim()) {
      setErrorMessage("Notice title is required.");
      return;
    }

    if (!description.trim()) {
      setErrorMessage("Notice description is required.");
      return;
    }

    if (
      audience === "Specific Room" &&
      !roomId
    ) {
      setErrorMessage("Please select a room.");
      return;
    }

    if (
      audience === "Selected Residents" &&
      selectedResidentIds.length === 0
    ) {
      setErrorMessage("Please select at least one resident.");
      return;
    }

    if (
      audience === "Specific Resident" &&
      !residentId
    ) {
      setErrorMessage("Please select a resident.");
      return;
    }

    if (
      audience === "Staff" &&
      !staffId
    ) {
      setErrorMessage("Please select a staff member.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("notices")
      .update({
        title: title.trim(),
        description: description.trim(),
        priority,
        audience,

        room_id:
          audience === "Specific Room"
            ? roomId
            : null,

        resident_id:
          audience ===
          "Specific Resident"
            ? residentId
            : null,

        staff_id:
          audience === "Staff"
            ? staffId
            : null,

        attachment_url:
          attachmentUrl.trim() || null,

        publish_date:
          publishDate || null,

        expiry_date:
          expiryDate || null,

        pinned,
        status,
        notification_recipient_type:
          audience === "All Residents"
            ? "all_active_residents"
            : audience === "Selected Residents"
              ? "selected_residents"
              : audience === "Specific Resident"
                ? "individual_resident"
                : null,
      })
      .eq("id", noticeId);

    if (error) {
      setErrorMessage(error.message);
      setSaving(false);
      return;
    }

    const { error: clearRecipientError } = await supabase
      .from("notice_recipients")
      .delete()
      .eq("notice_id", noticeId);
    const { error: recipientError } = audience === "Selected Residents"
      ? await supabase.from("notice_recipients").insert(
          selectedResidentIds.map((selectedId) => ({ notice_id: noticeId, resident_id: selectedId })),
        )
      : { error: null };
    if (clearRecipientError || recipientError) {
      setErrorMessage("Notice details were updated, but selected recipients could not be updated.");
      setSaving(false);
      return;
    }

    setSuccessMessage(
      "Notice updated successfully."
    );

    setSaving(false);

    setTimeout(() => {
      router.push("/dashboard/notices");
      router.refresh();
    }, 1200);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">

        <div className="mb-6 flex items-center justify-between">

          <div>
            <h1 className="text-3xl font-bold">
              Edit Notice
            </h1>

            <p className="mt-1 text-gray-600">
              Update notice details.
            </p>
          </div>

          <Link
            href="/dashboard/notices"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
          >
            Back
          </Link>

        </div>

        {errorMessage && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
            {successMessage}
          </div>
        )}

        <form
  onSubmit={handleSubmit}
  className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Title
              </label>

              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="Enter notice title"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Description
              </label>

              <textarea
                rows={6}
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Enter notice description"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Priority
              </label>

              <select
                value={priority}
                onChange={(event) =>
                  setPriority(
                    event.target.value as PriorityType
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
              >
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Audience
              </label>

              <select
                value={audience}
                onChange={(event) =>
                  handleAudienceChange(
                    event.target.value as AudienceType
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
              >
                <option value="All Residents">
                  All Residents
                </option>

                <option value="Selected Residents">
                  Selected Residents
                </option>

                <option value="Specific Room">
                  Specific Room
                </option>

                <option value="Specific Resident">
                  Specific Resident
                </option>

                <option value="Staff">
                  Staff
                </option>
              </select>
            </div>

            {audience === "Specific Room" && (
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Select Room
                </label>

                <select
                  value={roomId}
                  onChange={(event) =>
                    setRoomId(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                  required
                >
                  <option value="">
                    Select Room
                  </option>

                  {roomOptions.map((room) => (
                    <option
                      key={room.value}
                      value={room.value}
                    >
                      {room.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {audience === "Selected Residents" && (
              <div className="md:col-span-2">
                <p className="mb-2 text-sm font-medium text-gray-700">Selected Residents</p>
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
                  {residentOptions.map((resident) => {
                    const id = String(resident.value);
                    return (
                      <label key={id} className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={selectedResidentIds.includes(id)}
                          onChange={() => setSelectedResidentIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600"
                        />
                        {resident.label}
                      </label>
                    );
                  })}
                </div>
                <p className="mt-2 text-sm font-medium text-blue-700">{selectedResidentIds.length} resident(s) selected</p>
              </div>
            )}

            {audience === "Specific Resident" && (
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Select Resident
                </label>

                <select
                  value={residentId}
                  onChange={(event) =>
                    setResidentId(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                  required
                >
                  <option value="">
                    Select Resident
                  </option>

                  {residentOptions.map((resident) => (
                    <option
                      key={resident.value}
                      value={resident.value}
                    >
                      {resident.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {audience === "Staff" && (
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Select Staff
                </label>

                <select
                  value={staffId}
                  onChange={(event) =>
                    setStaffId(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                  required
                >
                  <option value="">
                    Select Staff
                  </option>

                  {staffOptions.map((member) => (
                    <option
                      key={member.value}
                      value={member.value}
                    >
                      {member.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Attachment URL
              </label>

              <input
                type="url"
                value={attachmentUrl}
                onChange={(event) =>
                  setAttachmentUrl(event.target.value)
                }
                placeholder="https://example.com/file.pdf"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
              />
            </div>

          </div>
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Publish Date
              </label>

              <input
                type="date"
                value={publishDate}
                onChange={(event) =>
                  setPublishDate(event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Expiry Date
              </label>

              <input
                type="date"
                value={expiryDate}
                onChange={(event) =>
                  setExpiryDate(event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as StatusType
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
              >
                <option value="Published">
                  Published
                </option>
                <option value="Active">
                  Active
                </option>

                <option value="Draft">
                  Draft
                </option>

                <option value="Inactive">
                  Inactive
                </option>
              </select>
            </div>

            <div className="flex items-center pt-8">
              <input
                id="pinned"
                type="checkbox"
                checked={pinned}
                onChange={(event) =>
                  setPinned(event.target.checked)
                }
                className="mr-3 h-5 w-5"
              />

              <label
                htmlFor="pinned"
                className="text-sm font-medium text-gray-700"
              >
                Pin this Notice
              </label>
            </div>
</div>

          <div className="mt-8 flex justify-end gap-3">
            <Link
              href="/dashboard/notices"
              className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium hover:bg-gray-100"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Updating..."
                : "Update Notice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
