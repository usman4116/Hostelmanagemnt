"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AssignType = "Room" | "Bed" | "Resident" | "Staff";

type InventoryItem = {
  id: number;
  asset_code: string;
  item_name: string;
  available_quantity: number;
  assigned_quantity: number;
  quantity: number;
  unit: string;
  status: string;
};

type GenericRecord = {
  id: number;
  [key: string]: string | number | null | undefined;
};

const today = () => new Date().toISOString().split("T")[0];

export default function InventoryIssuePage() {
  const router = useRouter();

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [rooms, setRooms] = useState<GenericRecord[]>([]);
  const [beds, setBeds] = useState<GenericRecord[]>([]);
  const [residents, setResidents] = useState<GenericRecord[]>([]);
  const [staff, setStaff] = useState<GenericRecord[]>([]);

  const [inventoryId, setInventoryId] = useState("");
  const [assignType, setAssignType] =
    useState<AssignType>("Room");
  const [assignedToId, setAssignedToId] = useState("");

  const [quantity, setQuantity] = useState("1");
  const [assignedDate, setAssignedDate] = useState(today());
  const [remarks, setRemarks] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const selectedInventory = useMemo(() => {
    return (
      inventoryItems.find(
        (item) => item.id === Number(inventoryId)
      ) ?? null
    );
  }, [inventoryId, inventoryItems]);

  const getLabel = (
    record: GenericRecord,
    type: AssignType
  ) => {
    if (type === "Room") {
      return `Room ${
        record.room_number ??
        record.room_name ??
        record.name ??
        record.id
      }`;
    }

    if (type === "Bed") {
      return `Bed ${
        record.bed_number ??
        record.bed_name ??
        record.name ??
        record.id
      }`;
    }

    const fullName =
      record.full_name ??
      record.name ??
      [record.first_name, record.last_name]
        .filter(Boolean)
        .join(" ") ??
      `${type} ${record.id}`;

    const extra =
      type === "Resident"
        ? record.phone
        : record.designation ?? record.role;

    return extra
      ? `${fullName} - ${extra}`
      : String(fullName);
  };

  const assignmentOptions = useMemo(() => {
    const source =
      assignType === "Room"
        ? rooms
        : assignType === "Bed"
        ? beds
        : assignType === "Resident"
        ? residents
        : staff;

    return source.map((record) => ({
      value: record.id,
      label: getLabel(record, assignType),
    }));
  }, [
    assignType,
    rooms,
    beds,
    residents,
    staff,
  ]);

  const loadPageData = async () => {
    setLoading(true);
    setErrorMessage("");

    const [
      inventoryResponse,
      roomsResponse,
      bedsResponse,
      residentsResponse,
      staffResponse,
    ] = await Promise.all([
      supabase
        .from("inventory")
        .select(
          "id,asset_code,item_name,available_quantity,assigned_quantity,quantity,unit,status"
        )
        .eq("status", "Active")
        .gt("available_quantity", 0)
        .order("item_name"),

      supabase
        .from("rooms")
        .select("*")
        .order("id"),

      supabase
        .from("beds")
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
    ]);

    const firstError =
      inventoryResponse.error ||
      roomsResponse.error ||
      bedsResponse.error ||
      residentsResponse.error ||
      staffResponse.error;

    if (firstError) {
      setErrorMessage(
        `Unable to load page data: ${firstError.message}`
      );
      setLoading(false);
      return;
    }

    setInventoryItems(
      (inventoryResponse.data ?? []) as InventoryItem[]
    );

    setRooms(
      (roomsResponse.data ?? []) as GenericRecord[]
    );

    setBeds(
      (bedsResponse.data ?? []) as GenericRecord[]
    );

    setResidents(
      (residentsResponse.data ?? []) as GenericRecord[]
    );

    setStaff(
      (staffResponse.data ?? []) as GenericRecord[]
    );

    setLoading(false);
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadPageData(), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const resetForm = () => {
    setInventoryId("");
    setAssignType("Room");
    setAssignedToId("");
    setQuantity("1");
    setAssignedDate(today());
    setRemarks("");
  };
  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!selectedInventory) {
      setErrorMessage(
        "Please select an inventory item."
      );
      return;
    }

    if (!assignedToId) {
      setErrorMessage(
        `Please select a ${assignType.toLowerCase()}.`
      );
      return;
    }

    const issueQuantity = Number(quantity);

    if (
      !Number.isInteger(issueQuantity) ||
      issueQuantity <= 0
    ) {
      setErrorMessage(
        "Quantity must be greater than zero."
      );
      return;
    }

    if (
      issueQuantity >
      selectedInventory.available_quantity
    ) {
      setErrorMessage(
        `Only ${selectedInventory.available_quantity} ${selectedInventory.unit} available.`
      );
      return;
    }

    setSaving(true);

    const { data: assignment, error: assignmentError } =
      await supabase
        .from("inventory_assignments")
        .insert({
          inventory_id: selectedInventory.id,

          room_id:
            assignType === "Room"
              ? Number(assignedToId)
              : null,

          bed_id:
            assignType === "Bed"
              ? Number(assignedToId)
              : null,

          resident_id:
            assignType === "Resident"
              ? Number(assignedToId)
              : null,

          staff_id:
            assignType === "Staff"
              ? Number(assignedToId)
              : null,

          quantity: issueQuantity,
          assigned_date: assignedDate,
          remarks:
            remarks.trim() || null,
        })
        .select("id")
        .single();

    if (assignmentError) {
      setErrorMessage(
        `Unable to create assignment: ${assignmentError.message}`
      );

      setSaving(false);
      return;
    }

    const { data: movement, error: movementError } =
      await supabase
        .from("inventory_movements")
        .insert({
          inventory_id:
            selectedInventory.id,

          movement_type: "OUT",

          quantity: issueQuantity,

          movement_date:
            assignedDate,

          reference_no:
            `ASSIGN-${assignment.id}`,

          remarks:
            remarks.trim() ||
            `Issued to ${assignType}`,
        })
        .select("id")
        .single();

    if (movementError) {
      await supabase
        .from("inventory_assignments")
        .delete()
        .eq("id", assignment.id);

      setErrorMessage(
        `Unable to record movement: ${movementError.message}`
      );

      setSaving(false);
      return;
    }

    const {
      data: updatedInventory,
      error: updateError,
    } = await supabase
      .from("inventory")
      .update({
        available_quantity:
          selectedInventory.available_quantity -
          issueQuantity,

        assigned_quantity:
          selectedInventory.assigned_quantity +
          issueQuantity,
      })
      .eq(
        "id",
        selectedInventory.id
      )
      .eq(
        "available_quantity",
        selectedInventory.available_quantity
      )
      .select("id")
      .maybeSingle();

    if (
      updateError ||
      !updatedInventory
    ) {
      await supabase
        .from("inventory_movements")
        .delete()
        .eq("id", movement.id);

      await supabase
        .from("inventory_assignments")
        .delete()
        .eq("id", assignment.id);

      setErrorMessage(
        updateError
          ? `Unable to update stock: ${updateError.message}`
          : "Stock changed while saving. Please try again."
      );

      setSaving(false);

      await loadPageData();

      return;
    }

    setSuccessMessage(
      "Inventory item issued successfully."
    );

    resetForm();

    await loadPageData();

    setSaving(false);

    setTimeout(() => {
      router.push(
        "/dashboard/inventory"
      );

      router.refresh();
    }, 1200);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-10 text-center">
        Loading inventory issue form...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">

        <div className="mb-6 flex items-center justify-between">

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Issue Inventory
            </h1>

            <p className="mt-1 text-sm text-gray-600">
              Assign inventory to
              Room, Bed,
              Resident or Staff.
            </p>

          </div>

          <Link
            href="/dashboard/inventory"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm"
          >
            Back to Inventory
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
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Inventory Item
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            <div>

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Inventory Item
              </label>

              <select
                value={inventoryId}
                onChange={(event) =>
                  setInventoryId(event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                required
              >

                <option value="">
                  Select Inventory Item
                </option>

                {inventoryItems.map((item) => (

                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.asset_code} - {item.item_name}
                  </option>

                ))}

              </select>

            </div>

            <div>

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Available Quantity
              </label>

              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">

                {selectedInventory
                  ? `${selectedInventory.available_quantity} ${selectedInventory.unit}`
                  : "Select an inventory item"}

              </div>

            </div>

          </div>

          <hr className="my-7" />

          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Assignment Details
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            <div>

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Assign To
              </label>

              <select
                value={assignType}
                onChange={(event) => {
                  setAssignType(
                    event.target.value as AssignType
                  );
                  setAssignedToId("");
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
              >

                <option value="Room">
                  Room
                </option>

                <option value="Bed">
                  Bed
                </option>

                <option value="Resident">
                  Resident
                </option>

                <option value="Staff">
                  Staff
                </option>

              </select>

            </div>

            <div>

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Select {assignType}
              </label>

              <select
                value={assignedToId}
                onChange={(event) =>
                  setAssignedToId(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                required
              >

                <option value="">
                  Select {assignType}
                </option>

                {assignmentOptions.map((option) => (

                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>

                ))}

              </select>

            </div>

          </div>

          <hr className="my-7" />

          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Issue Information
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            <div>

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Quantity
              </label>

              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(event) =>
                  setQuantity(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                required
              />

            </div>

            <div>

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Assigned Date
              </label>

              <input
                type="date"
                value={assignedDate}
                onChange={(event) =>
                  setAssignedDate(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                required
              />

            </div>

          </div>
          <div className="mt-5">

            <label className="mb-2 block text-sm font-medium text-gray-700">
              Remarks
            </label>

            <textarea
              rows={4}
              value={remarks}
              onChange={(event) =>
                setRemarks(event.target.value)
              }
              placeholder="Enter issue details..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
            />

          </div>

          <div className="mt-7 flex justify-end gap-3">

            <Link
              href="/dashboard/inventory"
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                saving ||
                !selectedInventory
              }
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving
                ? "Issuing..."
                : "Issue Inventory"}
            </button>

          </div>

        </form>

      </div>

    </div>

  );

}
