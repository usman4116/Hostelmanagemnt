"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function EditInventoryPage() {
  const router = useRouter();
  const params = useParams();

  const rawId = params.id;
  const inventoryId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      if (!inventoryId) {
        setErrorMessage("Invalid inventory item ID.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage("");

      const [
        { data: categoryData, error: categoryError },
        { data: itemData, error: itemError },
      ] = await Promise.all([
        supabase
          .from("inventory_categories")
          .select("id, name")
          .eq("status", "Active")
          .order("name", { ascending: true }),

        supabase
          .from("inventory")
          .select(
            `
            id,
            asset_code,
            item_name,
            category_id,
            quantity,
            available_quantity,
            assigned_quantity,
            unit,
            purchase_date,
            purchase_price,
            supplier,
            brand,
            model,
            warranty_expiry,
            item_condition,
            status,
            notes
          `
          )
          .eq("id", Number(inventoryId))
          .single(),
      ]);

      if (categoryError) {
        setErrorMessage(
          `Unable to load categories: ${categoryError.message}`
        );
        setLoading(false);
        return;
      }

      setCategories(categoryData ?? []);

      if (itemError || !itemData) {
        setErrorMessage(
          itemError?.message || "Inventory item was not found."
        );
        setLoading(false);
        return;
      }

      setFormData({
        asset_code: itemData.asset_code ?? "",
        item_name: itemData.item_name ?? "",
        category_id: itemData.category_id
          ? String(itemData.category_id)
          : "",
        quantity: String(itemData.quantity ?? 0),
        available_quantity: String(itemData.available_quantity ?? 0),
        assigned_quantity: String(itemData.assigned_quantity ?? 0),
        unit: itemData.unit ?? "Piece",
        purchase_date: itemData.purchase_date ?? "",
        purchase_price:
          itemData.purchase_price !== null &&
          itemData.purchase_price !== undefined
            ? String(itemData.purchase_price)
            : "",
        supplier: itemData.supplier ?? "",
        brand: itemData.brand ?? "",
        model: itemData.model ?? "",
        warranty_expiry: itemData.warranty_expiry ?? "",
        item_condition: itemData.item_condition ?? "Good",
        status: itemData.status ?? "Active",
        notes: itemData.notes ?? "",
      });

      setLoading(false);
    };

    loadData();
  }, [inventoryId]);

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
        const assignedQuantity = Number(
          previous.assigned_quantity || 0
        );

        if (
          Number.isFinite(totalQuantity) &&
          totalQuantity >= assignedQuantity
        ) {
          updated.available_quantity = String(
            totalQuantity - assignedQuantity
          );
        }
      }

      if (name === "assigned_quantity") {
        const assignedQuantity = Number(value);
        const totalQuantity = Number(previous.quantity || 0);

        if (
          Number.isFinite(assignedQuantity) &&
          assignedQuantity >= 0 &&
          assignedQuantity <= totalQuantity
        ) {
          updated.available_quantity = String(
            totalQuantity - assignedQuantity
          );
        }
      }

      return updated;
    });

    setErrorMessage("");
    setSuccessMessage("");
  };

  const validateForm = () => {
    const quantity = Number(formData.quantity);
    const availableQuantity = Number(formData.available_quantity);
    const assignedQuantity = Number(formData.assigned_quantity);
    const purchasePrice = formData.purchase_price
      ? Number(formData.purchase_price)
      : 0;

    if (!formData.asset_code.trim()) {
      return "Asset Code is required.";
    }

    if (!formData.item_name.trim()) {
      return "Item Name is required.";
    }

    if (!formData.category_id) {
      return "Category is required.";
    }

    if (
      formData.quantity === "" ||
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      return "Total Quantity must be a valid whole number.";
    }

    if (
      formData.available_quantity === "" ||
      !Number.isInteger(availableQuantity) ||
      availableQuantity < 0
    ) {
      return "Available Quantity must be a valid whole number.";
    }

    if (
      formData.assigned_quantity === "" ||
      !Number.isInteger(assignedQuantity) ||
      assignedQuantity < 0
    ) {
      return "Assigned Quantity must be a valid whole number.";
    }

    if (availableQuantity + assignedQuantity !== quantity) {
      return "Available Quantity plus Assigned Quantity must equal Total Quantity.";
    }

    if (formData.purchase_price && purchasePrice < 0) {
      return "Purchase Price cannot be negative.";
    }

    return "";
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    if (!inventoryId) {
      setErrorMessage("Invalid inventory item ID.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("inventory")
      .update({
        asset_code: formData.asset_code.trim(),
        item_name: formData.item_name.trim(),
        category_id: Number(formData.category_id),
        quantity: Number(formData.quantity),
        available_quantity: Number(
          formData.available_quantity
        ),
        assigned_quantity: Number(
          formData.assigned_quantity
        ),
        unit: formData.unit,
        purchase_date: formData.purchase_date || null,
        purchase_price: formData.purchase_price
          ? Number(formData.purchase_price)
          : null,
        supplier: formData.supplier.trim() || null,
        brand: formData.brand.trim() || null,
        model: formData.model.trim() || null,
        warranty_expiry:
          formData.warranty_expiry || null,
        item_condition: formData.item_condition,
        status: formData.status,
        notes: formData.notes.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", Number(inventoryId));

    if (error) {
      if (error.code === "23505") {
        setErrorMessage(
          "This Asset Code already exists. Please use a unique Asset Code."
        );
      } else {
        setErrorMessage(
          `Unable to update inventory item: ${error.message}`
        );
      }

      setSaving(false);
      return;
    }

    setSuccessMessage(
      "Inventory item updated successfully."
    );
    setSaving(false);

    setTimeout(() => {
      router.push("/dashboard/inventory");
      router.refresh();
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-6xl text-center text-sm text-gray-600">
          Loading inventory item...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Edit Inventory Item
            </h1>

            <p className="mt-1 text-sm text-gray-600">
              Update hostel inventory information.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/dashboard/inventory")
            }
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Back to Inventory
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
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              >
                <option value="">Select Category</option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
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
                <option value="Kilogram">
                  Kilogram
                </option>
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>
          </div>

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
                <option value="Excellent">
                  Excellent
                </option>
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
                <option value="Inactive">
                  Inactive
                </option>
              </select>
            </div>
          </div>

          <hr className="my-7 border-gray-200" />

          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            Additional Information
          </h2>

          <textarea
            name="notes"
            rows={4}
            value={formData.notes}
            onChange={handleChange}
            placeholder="Enter additional inventory details..."
            className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() =>
                router.push("/dashboard/inventory")
              }
              disabled={saving}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
            >
              {saving
                ? "Updating..."
                : "Update Inventory Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}