"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { supabase } from "@/lib/supabase";

type GenericRecord = {
  id?: number;
  [key: string]:
    | string
    | number
    | boolean
    | null
    | undefined;
};

type ReportData = {
  residents: GenericRecord[];
  rooms: GenericRecord[];
  beds: GenericRecord[];
  admissions: GenericRecord[];
  billing: GenericRecord[];
  payments: GenericRecord[];
  maintenance: GenericRecord[];
  inventory: GenericRecord[];
};

type ReportType =
  | "Dashboard Summary"
  | "Residents"
  | "Rooms"
  | "Beds"
  | "Admissions"
  | "Billing"
  | "Payments"
  | "Maintenance"
  | "Inventory";

const reportTypes: ReportType[] = [
  "Dashboard Summary",
  "Residents",
  "Rooms",
  "Beds",
  "Admissions",
  "Billing",
  "Payments",
  "Maintenance",
  "Inventory",
];

const emptyReportData: ReportData = {
  residents: [],
  rooms: [],
  beds: [],
  admissions: [],
  billing: [],
  payments: [],
  maintenance: [],
  inventory: [],
};

const getTodayDate = () => {
  return new Date()
    .toISOString()
    .split("T")[0];
};

const getFirstDateOfMonth = () => {
  const today = new Date();

  const firstDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );

  return firstDate
    .toISOString()
    .split("T")[0];
};

const getStringValue = (
  record: GenericRecord,
  keys: string[]
) => {
  for (const key of keys) {
    const value = record[key];

    if (
      value !== null &&
      value !== undefined &&
      value !== ""
    ) {
      return String(value);
    }
  }

  return "";
};

const getNumberValue = (
  record: GenericRecord,
  keys: string[]
) => {
  for (const key of keys) {
    const value = record[key];

    if (
      value !== null &&
      value !== undefined &&
      value !== ""
    ) {
      const numberValue = Number(value);

      if (Number.isFinite(numberValue)) {
        return numberValue;
      }
    }
  }

  return 0;
};

const formatDate = (
  value:
    | string
    | number
    | null
    | undefined
) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
};

const formatCurrency = (
  amount: number
) => {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }
  ).format(amount);
};

const getRecordDate = (
  record: GenericRecord
) => {
  return getStringValue(
    record,
    [
      "created_at",
      "admission_date",
      "bills_date",
      "bill_date",
      "payment_date",
      "request_date",
      "purchase_date",
      "date",
    ]
  );
};

export default function ReportsPage() {
  const [
    reportData,
    setReportData,
  ] = useState<ReportData>(
    emptyReportData
  );

  const [
    selectedReport,
    setSelectedReport,
  ] = useState<ReportType>(
    "Dashboard Summary"
  );

  const [fromDate, setFromDate] =
    useState(
      getFirstDateOfMonth()
    );

  const [toDate, setToDate] =
    useState(getTodayDate());

  const [loading, setLoading] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const loadReports = async () => {
    setLoading(true);
    setErrorMessage("");

    const [
      residentsResponse,
      roomsResponse,
      bedsResponse,
      admissionsResponse,
      billsResponse,
      paymentsResponse,
      maintenanceResponse,
      inventoryResponse,
    ] = await Promise.all([
      supabase
        .from("residents")
        .select("*")
        .order("id", {
          ascending: false,
        }),

      supabase
        .from("rooms")
        .select("*")
        .order("id", {
          ascending: false,
        }),

      supabase
        .from("beds")
        .select("*")
        .order("id", {
          ascending: false,
        }),

      supabase
        .from("admissions")
        .select("*")
        .order("id", {
          ascending: false,
        }),

      supabase
        .from("bills")
        .select("*")
        .order("id", {
          ascending: false,
        }),

      supabase
        .from("payments")
        .select("*")
        .order("id", {
          ascending: false,
        }),

      supabase
        .from(
          "maintenance_requests"
        )
        .select("*")
        .order("id", {
          ascending: false,
        }),

      supabase
        .from("inventory")
        .select("*")
        .order("id", {
          ascending: false,
        }),
    ]);

    const responses = [
      residentsResponse,
      roomsResponse,
      bedsResponse,
      admissionsResponse,
      billsResponse,
      paymentsResponse,
      maintenanceResponse,
      inventoryResponse,
    ];

    const firstError =
      responses.find(
        (response) =>
          response.error
      )?.error;

    if (firstError) {
      setErrorMessage(
        firstError.message
      );
    }

    setReportData({
      residents:
        (residentsResponse.data ??
          []) as GenericRecord[],

      rooms:
        (roomsResponse.data ??
          []) as GenericRecord[],

      beds:
        (bedsResponse.data ??
          []) as GenericRecord[],

      admissions:
        (admissionsResponse.data ??
          []) as GenericRecord[],

      billing:
        (billsResponse.data ??
          []) as GenericRecord[],

      payments:
        (paymentsResponse.data ??
          []) as GenericRecord[],

      maintenance:
        (maintenanceResponse.data ??
          []) as GenericRecord[],

      inventory:
        (inventoryResponse.data ??
          []) as GenericRecord[],
    });

    setLoading(false);
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadReports(), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const filterByDate = useCallback((
  records: GenericRecord[] = []
) => {
  if (!fromDate && !toDate) {
    return records;
  }

  return records.filter((record) => {
    const recordDate = getRecordDate(record);

    if (!recordDate) {
      return true;
    }

    const date = new Date(recordDate);

    if (Number.isNaN(date.getTime())) {
      return true;
    }

    const dateValue = date.toISOString().split("T")[0];

    if (fromDate && dateValue < fromDate) {
      return false;
    }

    if (toDate && dateValue > toDate) {
      return false;
    }

    return true;
  });
}, [fromDate, toDate]);

  const filteredData =
    useMemo(() => {
      return {
        residents:
          filterByDate(
            reportData.residents
          ),

        rooms:
          reportData.rooms,

        beds:
          reportData.beds,

        admissions:
          filterByDate(
            reportData.admissions
          ),

        billing:
  filterByDate(
    reportData.billing ?? []
  ),

        payments:
          filterByDate(
            reportData.payments
          ),

        maintenance:
          filterByDate(
            reportData.maintenance
          ),

        inventory:
          filterByDate(
            reportData.inventory
          ),
      };
    }, [
      reportData,
      filterByDate,
    ]);
    const summary = useMemo(() => {
    return {
      totalResidents:
        filteredData.residents.length,

      totalRooms:
        filteredData.rooms.length,

      totalBeds:
        filteredData.beds.length,

      totalAdmissions:
        filteredData.admissions.length,

      totalBills:
        filteredData.billing.length,

      totalPayments:
        filteredData.payments.length,

      totalMaintenance:
        filteredData.maintenance.length,

      totalInventory:
        filteredData.inventory.length,

      totalbillsAmount:
        filteredData.billing.reduce(
          (sum, bill) =>
            sum +
            getNumberValue(bill, [
              "total_amount",
              "amount",
              "bill_amount",
            ]),
          0
        ),

      totalPaymentAmount:
        filteredData.payments.reduce(
          (sum, payment) =>
            sum +
            getNumberValue(payment, [
              "amount",
              "paid_amount",
            ]),
          0
        ),
    };
  }, [filteredData]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        Loading Reports...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      <div className="mx-auto max-w-7xl">

        <div className="mb-6 flex items-center justify-between">

          <div>

            <h1 className="text-3xl font-bold">
              Reports
            </h1>

            <p className="mt-1 text-gray-600">
              Hostel Reports &
              Analytics
            </p>

          </div>

          <Link
            href="/dashboard"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-100"
          >
            Back
          </Link>

        </div>

        {errorMessage && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="grid grid-cols-1 gap-5 md:grid-cols-4">

            <div>

              <label className="mb-2 block text-sm font-medium">
                Report Type
              </label>

              <select
                value={selectedReport}
                onChange={(event) =>
                  setSelectedReport(
                    event.target
                      .value as ReportType
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
              >
                {reportTypes.map(
                  (report) => (
                    <option
                      key={report}
                      value={report}
                    >
                      {report}
                    </option>
                  )
                )}
              </select>

            </div>

            <div>

              <label className="mb-2 block text-sm font-medium">
                From Date
              </label>

              <input
                type="date"
                value={fromDate}
                onChange={(event) =>
                  setFromDate(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
              />

            </div>

            <div>

              <label className="mb-2 block text-sm font-medium">
                To Date
              </label>

              <input
                type="date"
                value={toDate}
                onChange={(event) =>
                  setToDate(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
              />

            </div>

            <div className="flex items-end gap-2">

              <button
                type="button"
                onClick={() =>
                  window.print()
                }
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700"
              >
                Print
              </button>

              <button
                type="button"
                onClick={() => {
                  setFromDate(
                    getFirstDateOfMonth()
                  );
                  setToDate(
                    getTodayDate()
                  );
                }}
                className="rounded-lg border border-gray-300 px-5 py-2.5 hover:bg-gray-100"
              >
                Reset
              </button>

            </div>

          </div>

        </div>
        {selectedReport === "Dashboard Summary" && (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Total Residents
                </p>

                <p className="mt-2 text-3xl font-bold text-blue-600">
                  {summary.totalResidents}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Total Rooms
                </p>

                <p className="mt-2 text-3xl font-bold text-green-600">
                  {summary.totalRooms}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Total Beds
                </p>

                <p className="mt-2 text-3xl font-bold text-purple-600">
                  {summary.totalBeds}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Total Admissions
                </p>

                <p className="mt-2 text-3xl font-bold text-orange-600">
                  {summary.totalAdmissions}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Total Bills
                </p>

                <p className="mt-2 text-3xl font-bold text-red-600">
                  {summary.totalBills}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Total Payments
                </p>

                <p className="mt-2 text-3xl font-bold text-emerald-600">
                  {summary.totalPayments}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  bills Amount
                </p>

                <p className="mt-2 text-2xl font-bold text-indigo-600">
                  {formatCurrency(
                    summary.totalbillsAmount
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Payment Amount
                </p>

                <p className="mt-2 text-2xl font-bold text-teal-600">
                  {formatCurrency(
                    summary.totalPaymentAmount
                  )}
                </p>
              </div>

            </div>
            <div className="mt-8 rounded-xl border border-gray-200 bg-white shadow-sm">

              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-xl font-semibold">
                  Financial Summary
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Overall financial overview
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                  <p className="text-sm text-gray-500">
                    Total bills Amount
                  </p>

                  <p className="mt-2 text-3xl font-bold text-indigo-600">
                    {formatCurrency(
                      summary.totalbillsAmount
                    )}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                  <p className="text-sm text-gray-500">
                    Total Payment Amount
                  </p>

                  <p className="mt-2 text-3xl font-bold text-green-600">
                    {formatCurrency(
                      summary.totalPaymentAmount
                    )}
                  </p>
                </div>

              </div>

            </div>
          </>
        )}

        
        {selectedReport === "Residents" && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold">
                Residents Report
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Total Residents: {filteredData.residents.length}
              </p>
            </div>

            <div className="overflow-x-auto">

              <table className="min-w-full divide-y divide-gray-200">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Name
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Phone
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      CNIC
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Status
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Admission Date
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100 bg-white">

                  {filteredData.residents.length === 0 ? (

                    <tr>

                      <td
                        colSpan={5}
                        className="px-6 py-10 text-center text-gray-500"
                      >
                        No residents found.
                      </td>

                    </tr>

                  ) : (

                    filteredData.residents.map(
                      (resident, index) => (

                        <tr
                          key={
                            resident.id ??
                            index
                          }
                          className="hover:bg-gray-50"
                        >

                          <td className="px-6 py-4">
                            {getStringValue(
                              resident,
                              [
                                "full_name",
                                "name",
                              ]
                            ) || "—"}
                          </td>

                          <td className="px-6 py-4">
                            {getStringValue(
                              resident,
                              [
                                "phone",
                                "phone_number",
                              ]
                            ) || "—"}
                          </td>

                          <td className="px-6 py-4">
                            {getStringValue(
                              resident,
                              [
                                "cnic",
                                "cnic_number",
                              ]
                            ) || "—"}
                          </td>

                          <td className="px-6 py-4">
                            {getStringValue(
                              resident,
                              [
                                "status",
                              ]
                            ) || "Active"}
                          </td>

                          <td className="px-6 py-4">
                            {formatDate(
                              getRecordDate(
                                resident
                              )
                            )}
                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>
        )}
        {selectedReport === "Rooms" && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold">
                Rooms Report
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Total Rooms: {filteredData.rooms.length}
              </p>
            </div>

            <div className="overflow-x-auto">

              <table className="min-w-full divide-y divide-gray-200">

                <thead className="bg-gray-50">
                  <tr>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Room
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Floor
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Capacity
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Status
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 bg-white">

                  {filteredData.rooms.length === 0 ? (

                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-10 text-center text-gray-500"
                      >
                        No rooms found.
                      </td>
                    </tr>

                  ) : (

                    filteredData.rooms.map(
                      (room, index) => (

                        <tr
                          key={
                            room.id ??
                            index
                          }
                          className="hover:bg-gray-50"
                        >

                          <td className="px-6 py-4">
                            {getStringValue(
                              room,
                              [
                                "room_number",
                                "room_name",
                                "name",
                              ]
                            ) || "—"}
                          </td>

                          <td className="px-6 py-4">
                            {getStringValue(
                              room,
                              [
                                "floor",
                              ]
                            ) || "—"}
                          </td>

                          <td className="px-6 py-4">
                            {getNumberValue(
                              room,
                              [
                                "capacity",
                                "total_beds",
                              ]
                            )}
                          </td>

                          <td className="px-6 py-4">
                            {getStringValue(
                              room,
                              [
                                "status",
                              ]
                            ) || "Available"}
                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>
        )}
        {selectedReport === "Beds" && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold">
                Beds Report
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Total Beds: {filteredData.beds.length}
              </p>
            </div>

            <div className="overflow-x-auto">

              <table className="min-w-full divide-y divide-gray-200">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Bed
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Room
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100 bg-white">

                  {filteredData.beds.length === 0 ? (

                    <tr>

                      <td
                        colSpan={3}
                        className="px-6 py-10 text-center text-gray-500"
                      >
                        No beds found.
                      </td>

                    </tr>

                  ) : (

                    filteredData.beds.map(
                      (bed, index) => (

                        <tr
                          key={
                            bed.id ??
                            index
                          }
                          className="hover:bg-gray-50"
                        >

                          <td className="px-6 py-4">
                            {getStringValue(
                              bed,
                              [
                                "bed_number",
                                "bed_name",
                                "name",
                              ]
                            ) || "—"}
                          </td>

                          <td className="px-6 py-4">
                            {getStringValue(
                              bed,
                              [
                                "room_number",
                                "room_name",
                              ]
                            ) || "—"}
                          </td>

                          <td className="px-6 py-4">
                            {getStringValue(
                              bed,
                              [
                                "status",
                              ]
                            ) || "Available"}
                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>
        )}
        {selectedReport === "Admissions" && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold">
                Admissions Report
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Total Admissions: {filteredData.admissions.length}
              </p>
            </div>

            <div className="overflow-x-auto">

              <table className="min-w-full divide-y divide-gray-200">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Resident
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Room
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Bed
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Admission Date
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100 bg-white">

                  {filteredData.admissions.length === 0 ? (

                    <tr>

                      <td
                        colSpan={4}
                        className="px-6 py-10 text-center text-gray-500"
                      >
                        No admissions found.
                      </td>

                    </tr>

                  ) : (

                    filteredData.admissions.map(
                      (
                        admission,
                        index
                      ) => (

                        <tr
                          key={
                            admission.id ??
                            index
                          }
                          className="hover:bg-gray-50"
                        >

                          <td className="px-6 py-4">
                            {getStringValue(
                              admission,
                              [
                                "resident_name",
                                "full_name",
                                "name",
                              ]
                            ) || "—"}
                          </td>

                          <td className="px-6 py-4">
                            {getStringValue(
                              admission,
                              [
                                "room_number",
                                "room_name",
                              ]
                            ) || "—"}
                          </td>

                          <td className="px-6 py-4">
                            {getStringValue(
                              admission,
                              [
                                "bed_number",
                                "bed_name",
                              ]
                            ) || "—"}
                          </td>

                          <td className="px-6 py-4">
                            {formatDate(
                              getRecordDate(
                                admission
                              )
                            )}
                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>
        )}
        {selectedReport === "Billing" && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold">
                bills Report
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Total Bills: {filteredData.billing.length}
              </p>
            </div>

            <div className="overflow-x-auto">

              <table className="min-w-full divide-y divide-gray-200">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Resident
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Bill Type
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Amount
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Date
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100 bg-white">

                  {filteredData.billing.length === 0 ? (

                    <tr>

                      <td
                        colSpan={4}
                        className="px-6 py-10 text-center text-gray-500"
                      >
                        No bills records found.
                      </td>

                    </tr>

                  ) : (

                    filteredData.billing.map(
                      (bill, index) => (

                        <tr
                          key={
                            bill.id ??
                            index
                          }
                          className="hover:bg-gray-50"
                        >

                          <td className="px-6 py-4">
                            {getStringValue(
                              bill,
                              [
                                "resident_name",
                                "full_name",
                                "name",
                              ]
                            ) || "—"}
                          </td>

                          <td className="px-6 py-4">
                            {getStringValue(
                              bill,
                              [
                                "bill_type",
                                "type",
                              ]
                            ) || "Monthly"}
                          </td>

                          <td className="px-6 py-4 font-medium text-green-600">
                            {formatCurrency(
                              getNumberValue(
                                bill,
                                [
                                  "amount",
                                  "bill_amount",
                                  "total_amount",
                                ]
                              )
                            )}
                          </td>

                          <td className="px-6 py-4">
                            {formatDate(
                              getRecordDate(
                                bill
                              )
                            )}
                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>
        )}
        {selectedReport === "Payments" && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold">
                Payments Report
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Total Payments: {filteredData.payments.length}
              </p>
            </div>

            <div className="overflow-x-auto">

              <table className="min-w-full divide-y divide-gray-200">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Resident
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Amount
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Payment Method
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Date
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100 bg-white">

                  {filteredData.payments.length === 0 ? (

                    <tr>

                      <td
                        colSpan={4}
                        className="px-6 py-10 text-center text-gray-500"
                      >
                        No payments found.
                      </td>

                    </tr>

                  ) : (

                    filteredData.payments.map(
                      (payment, index) => (

                        <tr
                          key={
                            payment.id ??
                            index
                          }
                          className="hover:bg-gray-50"
                        >

                          <td className="px-6 py-4">
                            {getStringValue(
                              payment,
                              [
                                "resident_name",
                                "full_name",
                                "name",
                              ]
                            ) || "—"}
                          </td>

                          <td className="px-6 py-4 font-medium text-green-600">
                            {formatCurrency(
                              getNumberValue(
                                payment,
                                [
                                  "amount",
                                  "paid_amount",
                                ]
                              )
                            )}
                          </td>

                          <td className="px-6 py-4">
                            {getStringValue(
                              payment,
                              [
                                "payment_method",
                                "method",
                              ]
                            ) || "—"}
                          </td>

                          <td className="px-6 py-4">
                            {formatDate(
                              getRecordDate(
                                payment
                              )
                            )}
                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>
        )}
        {selectedReport === "Maintenance" && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold">
                Maintenance Report
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Total Requests: {filteredData.maintenance.length}
              </p>
            </div>

            <div className="overflow-x-auto">

              <table className="min-w-full divide-y divide-gray-200">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Title
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Room
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Status
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Date
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100 bg-white">

                  {filteredData.maintenance.length === 0 ? (

                    <tr>

                      <td
                        colSpan={4}
                        className="px-6 py-10 text-center text-gray-500"
                      >
                        No maintenance requests found.
                      </td>

                    </tr>

                  ) : (

                    filteredData.maintenance.map(
                      (item, index) => (

                        <tr
                          key={
                            item.id ??
                            index
                          }
                          className="hover:bg-gray-50"
                        >

                          <td className="px-6 py-4">
                            {getStringValue(
                              item,
                              [
                                "title",
                                "issue",
                                "description",
                              ]
                            ) || "—"}
                          </td>

                          <td className="px-6 py-4">
                            {getStringValue(
                              item,
                              [
                                "room_number",
                                "room_name",
                              ]
                            ) || "—"}
                          </td>

                          <td className="px-6 py-4">
                            {getStringValue(
                              item,
                              [
                                "status",
                              ]
                            ) || "Pending"}
                          </td>

                          <td className="px-6 py-4">
                            {formatDate(
                              getRecordDate(
                                item
                              )
                            )}
                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>
        )}
        {selectedReport === "Inventory" && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold">
                Inventory Report
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Total Items: {filteredData.inventory.length}
              </p>
            </div>

            <div className="overflow-x-auto">

              <table className="min-w-full divide-y divide-gray-200">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Item
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Category
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Quantity
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100 bg-white">

                  {filteredData.inventory.length === 0 ? (

                    <tr>

                      <td
                        colSpan={4}
                        className="px-6 py-10 text-center text-gray-500"
                      >
                        No inventory items found.
                      </td>

                    </tr>

                  ) : (

                    filteredData.inventory.map(
                      (item, index) => (

                        <tr
                          key={
                            item.id ??
                            index
                          }
                          className="hover:bg-gray-50"
                        >

                          <td className="px-6 py-4">
                            {getStringValue(
                              item,
                              [
                                "item_name",
                                "name",
                              ]
                            ) || "—"}
                          </td>

                          <td className="px-6 py-4">
                            {getStringValue(
                              item,
                              [
                                "category",
                              ]
                            ) || "—"}
                          </td>

                          <td className="px-6 py-4">
                            {getNumberValue(
                              item,
                              [
                                "quantity",
                                "qty",
                              ]
                            )}
                          </td>

                          <td className="px-6 py-4">
                            {getStringValue(
                              item,
                              [
                                "status",
                              ]
                            ) || "Available"}
                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
