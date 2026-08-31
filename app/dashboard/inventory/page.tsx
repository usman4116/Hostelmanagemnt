"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type InventoryCategory = {
  name: string;
};

type InventoryItem = {
  id: number;
  asset_code: string;
  item_name: string;
  quantity: number;
  available_quantity: number;
  assigned_quantity: number;
  unit: string;
  purchase_price: number | null;
  supplier: string | null;
  brand: string | null;
  model: string | null;
  item_condition: string;
  status: string;
  created_at: string | null;
  inventory_categories: InventoryCategory | null;
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(
    null
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState("All");
  const [conditionFilter, setConditionFilter] =
    useState("All");
  const [statusFilter, setStatusFilter] =
    useState("All");

  const [errorMessage, setErrorMessage] =
    useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const loadInventory = async () => {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("inventory")
      .select(
        `
        id,
        asset_code,
        item_name,
        quantity,
        available_quantity,
        assigned_quantity,
        unit,
        purchase_price,
        supplier,
        brand,
        model,
        item_condition,
        status,
        created_at,
        inventory_categories (
          name
        )
      `
      )
      .order("id", { ascending: false });

    if (error) {
      setErrorMessage(
        `Unable to load inventory: ${error.message}`
      );

      setItems([]);
      setLoading(false);
      return;
    }

    setItems(
      (data ?? []) as unknown as InventoryItem[]
    );

    setLoading(false);
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadInventory(), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const categoryOptions = useMemo(() => {
    const categoryNames = items
      .map(
        (item) =>
          item.inventory_categories?.name
      )
      .filter(
        (name): name is string => Boolean(name)
      );

    const uniqueCategories = Array.from(
      new Set(categoryNames)
    ).sort();

    return ["All", ...uniqueCategories];
  }, [items]);

  const filteredItems = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const categoryName =
        item.inventory_categories?.name ?? "";

      const matchesSearch =
        search === "" ||
        item.asset_code
          .toLowerCase()
          .includes(search) ||
        item.item_name
          .toLowerCase()
          .includes(search) ||
        categoryName
          .toLowerCase()
          .includes(search) ||
        (item.supplier ?? "")
          .toLowerCase()
          .includes(search) ||
        (item.brand ?? "")
          .toLowerCase()
          .includes(search) ||
        (item.model ?? "")
          .toLowerCase()
          .includes(search);

      const matchesCategory =
        categoryFilter === "All" ||
        categoryName === categoryFilter;

      const matchesCondition =
        conditionFilter === "All" ||
        item.item_condition === conditionFilter;

      const matchesStatus =
        statusFilter === "All" ||
        item.status === statusFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesCondition &&
        matchesStatus
      );
    });
  }, [
    items,
    searchTerm,
    categoryFilter,
    conditionFilter,
    statusFilter,
  ]);
  const handleDelete = async (
    id: number,
    itemName: string
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${itemName}"?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase
      .from("inventory")
      .delete()
      .eq("id", id);

    if (error) {
      setErrorMessage(
        `Unable to delete inventory item: ${error.message}`
      );

      setDeletingId(null);
      return;
    }

    setItems((previousItems) =>
      previousItems.filter(
        (item) => item.id !== id
      )
    );

    setSuccessMessage(
      "Inventory item deleted successfully."
    );

    setDeletingId(null);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("All");
    setConditionFilter("All");
    setStatusFilter("All");
  };

  const getConditionClass = (
    condition: string
  ) => {
    if (condition === "Excellent") {
      return "bg-blue-100 text-blue-700";
    }

    if (condition === "Good") {
      return "bg-green-100 text-green-700";
    }

    if (condition === "Fair") {
      return "bg-yellow-100 text-yellow-700";
    }

    if (condition === "Damaged") {
      return "bg-red-100 text-red-700";
    }

    return "bg-gray-100 text-gray-700";
  };

  const getStatusClass = (status: string) => {
    if (status === "Active") {
      return "bg-green-100 text-green-700";
    }

    return "bg-gray-200 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Inventory Management
            </h1>

            <p className="mt-1 text-sm text-gray-600">
              Manage hostel assets, quantities and item
              conditions.
            </p>
          </div>

          <Link
            href="/dashboard/inventory/add"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            + Add Inventory Item
          </Link>
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

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Search
              </label>

              <input
                type="text"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search item, asset code, supplier..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Category
              </label>

              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {categoryOptions.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category === "All"
                        ? "All Categories"
                        : category}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Condition
              </label>

              <select
                value={conditionFilter}
                onChange={(event) =>
                  setConditionFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="All">
                  All Conditions
                </option>

                <option value="Excellent">
                  Excellent
                </option>

                <option value="Good">
                  Good
                </option>

                <option value="Fair">
                  Fair
                </option>

                <option value="Damaged">
                  Damaged
                </option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="All">
                  All Statuses
                </option>

                <option value="Active">
                  Active
                </option>

                <option value="Inactive">
                  Inactive
                </option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {filteredItems.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-900">
                {items.length}
              </span>{" "}
              items
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Clear Filters
            </button>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    ID
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Asset Code
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Item
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Category
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Total
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Available
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Assigned
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Condition
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Status
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {loading ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-12 text-center text-sm text-gray-500"
                    >
                      Loading inventory...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-12 text-center text-sm text-gray-500"
                    >
                      No inventory items found.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {item.id}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">
                        {item.asset_code}
                      </td>

                      <td className="min-w-48 px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">
                          {item.item_name}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {[item.brand, item.model]
                            .filter(Boolean)
                            .join(" ") || "-"}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {item.inventory_categories?.name ??
                          "-"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {item.quantity} {item.unit}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-green-700">
                        {item.available_quantity}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-blue-700">
                        {item.assigned_quantity}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getConditionClass(
                            item.item_condition
                          )}`}
                        >
                          {item.item_condition}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/inventory/edit/${item.id}`}
                            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                          >
                            Edit
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                item.id,
                                item.item_name
                              )
                            }
                            disabled={
                              deletingId === item.id
                            }
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingId === item.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
    </div>
  );
}
