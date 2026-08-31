"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { notificationWarning, requestEventNotification } from "@/lib/notifications/client";
import type { NotificationChannel } from "@/lib/notifications/types";

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

const getTodayDate = () => {
  return new Date()
    .toISOString()
    .split("T")[0];
};

export default function AddNoticePage() {
  const router = useRouter();

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

  const [staffId, setStaffId] =
    useState("");

  const [attachmentUrl, setAttachmentUrl] =
    useState("");

  const [publishDate, setPublishDate] =
    useState(getTodayDate());

  const [expiryDate, setExpiryDate] =
    useState("");

  const [pinned, setPinned] =
    useState(false);

  const [status, setStatus] =
    useState<StatusType>("Published");
  const [residentSearch, setResidentSearch] = useState("");
  const [selectedResidentIds, setSelectedResidentIds] = useState<string[]>([]);
  const [communicationChannels, setCommunicationChannels] =
    useState<NotificationChannel[]>(["email", "whatsapp"]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const roomOptions = useMemo(() => {
    return rooms.map((room) => {
      const roomName =
        room.room_number ??
        room.room_name ??
        room.name ??
        room.id;

      return {
        value: room.id,
        label: `Room ${roomName}`,
      };
    });
  }, [rooms]);

  const residentOptions = useMemo(() => {
    const query = residentSearch.trim().toLowerCase();
    return residents.filter((resident) => {
      const searchable = `${resident.full_name ?? resident.name ?? ""} ${resident.email ?? ""} ${resident.phone ?? ""}`.toLowerCase();
      return String(resident.status ?? "").toLowerCase() !== "archived" && (!query || searchable.includes(query));
    }).map((resident) => {
      const combinedName = [
        resident.first_name,
        resident.last_name,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      const name =
        resident.full_name ||
        resident.name ||
        combinedName ||
        `Resident ${resident.id}`;

      const phone = resident.phone
        ? ` - ${resident.phone}`
        : "";

      return {
        value: resident.id,
        label: `${name}${phone}`,
      };
    });
  }, [residentSearch, residents]);

  const staffOptions = useMemo(() => {
    return staffMembers.map((member) => {
      const combinedName = [
        member.first_name,
        member.last_name,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      const name =
        member.full_name ||
        member.name ||
        combinedName ||
        `Staff ${member.id}`;

      const designation =
        member.designation ||
        member.role;

      return {
        value: member.id,
        label: designation
          ? `${name} - ${designation}`
          : String(name),
      };
    });
  }, [staffMembers]);

  const loadFormData = async () => {
    setLoading(true);
    setErrorMessage("");

    const [
      roomsResponse,
      residentsResponse,
      staffResponse,
    ] = await Promise.all([
      supabase
        .from("rooms")
        .select("*")
        .order("id", {
          ascending: true,
        }),

      supabase
        .from("residents")
        .select("*")
        .order("id", {
          ascending: true,
        }),

      supabase
        .from("staff")
        .select("*")
        .order("id", {
          ascending: true,
        }),
    ]);

    const firstError =
      roomsResponse.error ||
      residentsResponse.error ||
      staffResponse.error;

    if (firstError) {
      setErrorMessage(
        `Unable to load notice form data: ${firstError.message}`
      );

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

    setLoading(false);
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadFormData(), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

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

  const toggleResident = (id: string) => {
    setSelectedResidentIds((current) =>
      current.includes(id)
        ? current.filter((residentId) => residentId !== id)
        : [...current, id],
    );
  };

  const toggleChannel = (channel: NotificationChannel) => {
    setCommunicationChannels((current) =>
      current.includes(channel)
        ? current.filter((item) => item !== channel)
        : [...current, channel],
    );
  };
  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!title.trim()) {
      setErrorMessage(
        "Notice title is required."
      );
      return;
    }

    if (!description.trim()) {
      setErrorMessage(
        "Notice description is required."
      );
      return;
    }

    if (
      audience === "Specific Room" &&
      !roomId
    ) {
      setErrorMessage(
        "Please select a room."
      );
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
      setErrorMessage(
        "Please select a resident."
      );
      return;
    }
    if (communicationChannels.length === 0) {
      setErrorMessage("Select at least one communication channel.");
      return;
    }

    if (
      audience === "Staff" &&
      !staffId
    ) {
      setErrorMessage(
        "Please select a staff member."
      );
      return;
    }

    setSaving(true);

    const { data: createdNotice, error } =
      await supabase
        .from("notices")
        .insert({
          title: title.trim(),
          description:
            description.trim(),

          priority,

          audience,

          room_id:
            audience ===
            "Specific Room"
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
            attachmentUrl.trim() ||
            null,

          publish_date:
            publishDate,

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
          notification_channels: communicationChannels,
        })
        .select("id")
        .single();

    if (error) {
      setErrorMessage(
        error.message
      );
      setSaving(false);
      return;
    }

    if (audience === "Selected Residents") {
      const { error: recipientError } = await supabase
        .from("notice_recipients")
        .insert(selectedResidentIds.map((selectedId) => ({
          notice_id: createdNotice.id,
          resident_id: selectedId,
        })));
      if (recipientError) {
        setErrorMessage(`Notice was created, but its selected recipients could not be saved: ${recipientError.message}`);
        setSaving(false);
        return;
      }
    }

    const notificationResult = await requestEventNotification(
      "resident_notice_created",
      String(createdNotice.id),
      {
        channels: communicationChannels,
        recipientIds:
          audience === "Selected Residents"
            ? selectedResidentIds
            : audience === "Specific Resident"
              ? [residentId]
              : undefined,
      },
    );

    setSuccessMessage(
      `Notice created successfully for ${notificationResult.recipientCount ?? 0} resident(s).${notificationWarning(notificationResult)}`
    );

    setTimeout(() => {
      router.push(
        "/dashboard/notices"
      );
      router.refresh();
    }, 1200);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
              Add Notice
            </h1>

            <p className="mt-1 text-gray-600">
              Create a new hostel notice.
            </p>

          </div>

          <Link
            href="/dashboard/notices"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
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
                <option value="Low">
                  Low
                </option>

                <option value="Normal">
                  Normal
                </option>

                <option value="High">
                  High
                </option>

                <option value="Urgent">
                  Urgent
                </option>
              </select>
            </div>

            <fieldset className="md:col-span-2">
              <legend className="mb-2 block text-sm font-medium text-gray-700">
                Recipient Type
              </legend>
              <div className="grid gap-3 rounded-lg border border-gray-200 p-4 sm:grid-cols-3">
                {(
                  [
                    ["All Residents", "All Active Residents"],
                    ["Selected Residents", "Selected Residents"],
                    ["Specific Resident", "Individual Resident"],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="radio"
                      name="recipient-type"
                      checked={audience === value}
                      onChange={() => handleAudienceChange(value)}
                      className="h-4 w-4 text-blue-600"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            {audience === "Selected Residents" && (
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="resident-search">
                  Search and select residents
                </label>
                <input
                  id="resident-search"
                  type="search"
                  value={residentSearch}
                  onChange={(event) => setResidentSearch(event.target.value)}
                  placeholder="Search by name, email, or phone"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                />
                <div className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
                  {residentOptions.length === 0 ? (
                    <p className="text-sm text-gray-500">No matching active residents.</p>
                  ) : residentOptions.map((resident) => {
                    const id = String(resident.value);
                    return (
                      <label key={id} className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={selectedResidentIds.includes(id)}
                          onChange={() => toggleResident(id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600"
                        />
                        {resident.label}
                      </label>
                    );
                  })}
                </div>
                <p className="mt-2 text-sm font-medium text-blue-700">
                  {selectedResidentIds.length} resident(s) selected
                </p>
              </div>
            )}

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

            <fieldset className="md:col-span-2">
              <legend className="mb-2 block text-sm font-medium text-gray-700">
                Communication Channels
              </legend>
              <div className="flex flex-wrap gap-4 rounded-lg border border-gray-200 p-4">
                {(
                  [
                    ["whatsapp", "WhatsApp"],
                    ["email", "Email"],
                    ["sms", "SMS / Text Message"],
                  ] as const
                ).map(([channel, label]) => (
                  <label key={channel} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={communicationChannels.includes(channel)}
                      onChange={() => toggleChannel(channel)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    {label}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                SMS is tracked as a future channel until an SMS provider is configured.
              </p>
            </fieldset>

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
                  setPinned(
                    event.target.checked
                  )
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
                ? "Saving..."
                : "Save Notice"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}
