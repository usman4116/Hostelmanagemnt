"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Category = {
  id: number;
  name: string;
};

type FormData = {
  asset_code: string;
  item_name: string;
  category_id: string;
  quantity: string;
  available_quantity: string;
  assigned_quantity: string;
  unit: string;
  purchase_date: string;
  purchase_price: string;
  supplier: string;
  brand: string;
  model: string;
  warranty_expiry: string;
  item_condition: string;
  status: string;
  notes: string;
};

const initialFormData: FormData = {
  asset_code: "",
  item_name: "",
  category_id: "",
  quantity: "",
  available_quantity: "",
  assigned_quantity: "0",
  unit: "Piece",
  purchase_date: "",
  purchase_price: "",
  supplier: "",
  brand: "",
  model: "",
  warranty_expiry: "",
  item_condition: "Good",
  status: "Active",
  notes: "",
};

export default function AddInventoryPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("inventory_categories")
        .select("id, name")
        .eq("status", "Active")
        .order("name", { ascending: true });

      if (error) {
        setErrorMessage(`Unable to load categories: ${error.message}`);
        setCategories([]);
      } else {
        setCategories(data ?? []);
      }

      setLoadingCategories(false);
    };

    loadCategories();
  }, []);

  const handleChange = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => {
      const updated = {
        ...previous,
        [name]: value,
      };

      if (name === "quantity") {
        const totalQuantity = Number(value);

    if (Number.isFinite(totalQuantity) && totalQuantity >= 0) {
          const assignedQuantity = Number(previous.assigned_quantity || 0);

          updated.available_quantity = String(
            Math.max(totalQuantity - assignedQuantity, 0)
          );
        }
      }

      if (name === "assigned_quantity") {
        const assignedQuantity = Number(value);
        const totalQuantity = Number(previous.quantity || 0);

        if (Number.isFinite(assignedQuantity) && assignedQuantity >= 0) {
          updated.available_quantity = String(
            Math.max(totalQuantity - assignedQuantity, 0)
          );
        }
      }

      return updated;
    });
  };

  const validateForm = () => {
    const quantity = Number(formData.quantity);
    const availableQuantity = Number(formData.available_quantity);
    const assignedQuantity = Number(formData.assigned_quantity);
    const purchasePrice = formData.purchase_price
      ? Number(formData.purchase_price)
      : 0;

    if (!formData.asset_code.trim()) {
      return "Asset code is required.";
    }

    if (!formData.item_name.trim()) {
      return "Item name is required.";
    }

    if (!formData.category_id) {
      return "Please select a category.";
    }

    if (
      formData.quantity === "" ||
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      return "Total quantity must be a valid whole number.";
    }

    if (
      formData.available_quantity === "" ||
      !Number.isInteger(availableQuantity) ||
      availableQuantity < 0
    ) {
      return "Available quantity must be a valid whole number.";
    }

    if (
      formData.assigned_quantity === "" ||
      !Number.isInteger(assignedQuantity) ||
      assignedQuantity < 0
    ) {
      return "Assigned quantity must be a valid whole number.";
    }

    if (availableQuantity + assignedQuantity !== quantity) {
      return "Available quantity and assigned quantity must equal total quantity.";
    }

    if (formData.purchase_price && purchasePrice < 0) {
      return "Purchase price cannot be negative.";
    }

    return "";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSaving(true);

    const { data: insertedItem, error } = await supabase
      .from("inventory")
      .insert({
        asset_code: formData.asset_code,
        item_name: formData.item_name,
        category_id: Number(formData.category_id),
        quantity: Number(formData.quantity),
        available_quantity: Number(formData.available_quantity),
        assigned_quantity: Number(formData.assigned_quantity),
        unit: formData.unit,
        purchase_date: formData.purchase_date || null,
        purchase_price: formData.purchase_price
          ? Number(formData.purchase_price)
          : null,
        supplier: formData.supplier || null,
        brand: formData.brand || null,
        model: formData.model || null,
        warranty_expiry: formData.warranty_expiry || null,
        item_condition: formData.item_condition,
        status: formData.status,
        notes: formData.notes || null,
      })
      .select("id")
      .single();

    if (error) {
      setSaving(false);
      setErrorMessage(error.message);
      return;
    }

    await supabase.from("inventory_movements").insert({
      inventory_id: insertedItem.id,
      movement_type: "IN",
      quantity: Number(formData.quantity),
      remarks: "Opening Stock",
    });

    setSaving(false);
    setSuccessMessage("Inventory item added successfully.");

    setTimeout(() => {
      router.push("/dashboard/inventory");
    }, 1000);
  };
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Add Inventory Item
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Add a new item to hostel inventory.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard/inventory")}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Back
          </button>
        </div>

        {errorMessage && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Asset Code
              </label>
              <input
                type="text"
                name="asset_code"
                value={formData.asset_code}
                onChange={handleChange}
                placeholder="INV-001"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Item Name
                </label>

                <input
                  type="text"
                  name="item_name"
                  value={formData.item_name}
                  onChange={handleChange}
                  placeholder="Window Curtain"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Category
                </label>

                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  disabled={loadingCategories}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  required
                >
                  <option value="">
                    {loadingCategories
                      ? "Loading categories..."
                      : "Select Category"}
                  </option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Unit
                </label>

                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="Piece">Piece</option>
                <option value="Set">Set</option>
                <option value="Box">Box</option>
                <option value="Pack">Pack</option>
                <option value="Pair">Pair</option>
                <option value="Meter">Meter</option>
                <option value="Kilogram">Kilogram</option>
                <option value="Liter">Liter</option>
              </select>
            </div>
          </div>

          <hr className="my-7 border-gray-200" />

          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            Stock Information
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Total Quantity
              </label>

              <input
                type="number"
                name="quantity"
                min="0"
                step="1"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Available Quantity
                </label>

                <input
                  type="number"
                  name="available_quantity"
                  min="0"
                  step="1"
                  value={formData.available_quantity}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Assigned Quantity
                </label>

                <input
                  type="number"
                  name="assigned_quantity"
                  min="0"
                  step="1"
                  value={formData.assigned_quantity}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Available Quantity plus Assigned Quantity must equal Total
              Quantity.
            </p>

            <hr className="my-7 border-gray-200" />

            <h2 className="mb-5 text-lg font-semibold text-gray-900">
              Purchase Information
            </h2>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Purchase Date
                </label>

                <input
                  type="date"
                  name="purchase_date"
                  value={formData.purchase_date}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Purchase Price
                </label>

                <input
                  type="number"
                  name="purchase_price"
                  min="0"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Supplier
                </label>

                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  placeholder="Supplier Name"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Brand
                </label>

                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="Brand Name"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Model
                </label>

                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="Model Number"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Warranty Expiry
                </label>

                <input
                  type="date"
                  name="warranty_expiry"
                  value={formData.warranty_expiry}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <hr className="my-7 border-gray-200" />

            <h2 className="mb-5 text-lg font-semibold text-gray-900">
              Condition and Status
            </h2>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Item Condition
                </label>

                <select
                  name="item_condition"
                  value={formData.item_condition}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Status
                </label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <hr className="my-7 border-gray-200" />

            <h2 className="mb-5 text-lg font-semibold text-gray-900">
              Additional Information
            </h2>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Notes
              </label>

              <textarea
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                placeholder="Enter additional inventory details..."
                className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => router.push("/dashboard/inventory")}
                disabled={saving}
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving || loadingCategories}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {saving ? "Saving..." : "Save Inventory Item"}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}