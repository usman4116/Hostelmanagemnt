"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  getLatestContractAgreement,
  uploadContractAgreement,
} from "@/lib/contractStorage";
import { getSupabaseErrorMessage } from "@/lib/supabaseErrors";

type Resident = {
  id: string;
  full_name: string;
  status: string | null;
};

type ContractStatus =
  | "Draft"
  | "Pending Signature"
  | "Active"
  | "Expired"
  | "Cancelled"
  | "Terminated";

type Contract = {
  id: string;
  resident_id: string;
  start_date: string;
  end_date: string | null;
  monthly_rent: number;
  security_deposit: number;
  status: ContractStatus | null;
  contract_status: string | null;
  notes: string | null;
};

export default function EditContractPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = String(params.id ?? "");
  const [residents, setResidents] = useState<Resident[]>([]);
  const [originalResidentId, setOriginalResidentId] = useState("");
  const [residentId, setResidentId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [contractStatus, setContractStatus] =
    useState<ContractStatus>("Active");
  const [notes, setNotes] = useState("");
  const [currentAgreement, setCurrentAgreement] = useState<string | null>(null);
  const [newAgreementFile, setNewAgreementFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!contractId) return;
    let active = true;

    async function loadPageData() {
      setLoading(true);
      setMessage("");

      const [residentResult, contractResult] = await Promise.all([
        supabase
          .from("residents")
          .select("id, full_name, status")
          .order("full_name", { ascending: true }),
        supabase
          .from("contracts")
          .select(
            "id, resident_id, start_date, end_date, monthly_rent, security_deposit, status, contract_status, notes",
          )
          .eq("id", contractId)
          .maybeSingle(),
      ]);

      if (!active) return;

      const firstError = residentResult.error || contractResult.error;
      if (firstError || !contractResult.data) {
        setMessage(
          getSupabaseErrorMessage(
            firstError,
            "Unable to load this contract.",
          ),
        );
        setLoading(false);
        return;
      }

      const contract = contractResult.data as Contract;
      setResidents((residentResult.data ?? []) as Resident[]);
      setOriginalResidentId(contract.resident_id);
      setResidentId(contract.resident_id);
      setStartDate(contract.start_date ?? "");
      setEndDate(contract.end_date ?? "");
      setMonthlyRent(String(contract.monthly_rent ?? ""));
      setSecurityDeposit(String(contract.security_deposit ?? ""));
      setContractStatus(
        (contract.status ?? contract.contract_status ?? "Active") as ContractStatus,
      );
      setNotes(contract.notes ?? "");

      try {
        setCurrentAgreement(await getLatestContractAgreement(contractId));
      } catch (agreementError) {
        setMessage(
          agreementError instanceof Error
            ? agreementError.message
            : "Unable to load the current agreement.",
        );
      }

      if (active) setLoading(false);
    }

    void loadPageData();
    return () => {
      active = false;
    };
  }, [contractId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (endDate && new Date(endDate) <= new Date(startDate)) {
      setMessage("End date must be later than start date.");
      return;
    }

    if (newAgreementFile && newAgreementFile.type !== "application/pdf") {
      setMessage("Only PDF agreement files are allowed.");
      return;
    }

    setSaving(true);
    const contractResult = await supabase
      .from("contracts")
      .select("id")
      .eq("id", contractId)
      .maybeSingle();

    const validationError = contractResult.error;
    if (validationError) {
      setMessage(
        getSupabaseErrorMessage(
          validationError,
          "Unable to verify the contract details. Please try again.",
        ),
      );
      setSaving(false);
      return;
    }

    if (!contractResult.data) {
      setMessage("This contract no longer exists.");
      setSaving(false);
      return;
    }

    let agreementUploaded = false;
    if (newAgreementFile) {
      try {
        await uploadContractAgreement(contractId, newAgreementFile);
        agreementUploaded = true;
      } catch (agreementError) {
        setMessage(
          agreementError instanceof Error
            ? agreementError.message
            : "Unable to upload the agreement PDF.",
        );
        setSaving(false);
        return;
      }
    }

    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        end_date: endDate || null,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contractId);

    if (updateError) {
      setMessage(
        agreementUploaded
          ? "The replacement agreement was uploaded, but the contract changes were not saved. The previous agreement was not deleted."
          : getSupabaseErrorMessage(
              updateError,
              "Unable to update this contract. Please try again.",
            ),
      );
      setSaving(false);
      return;
    }

    router.push(`/contracts/${contractId}`);
    router.refresh();
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 p-6 text-gray-600">Loading contract...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl rounded-xl bg-white p-6 shadow">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">StayHub</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-800">Edit Contract</h1>
        <p className="mt-1 text-sm text-gray-500">Update contract ID: {contractId}</p>
        <p className="mt-2 text-sm text-amber-700">Admission terms, resident identity, signature state, and activation status are locked. Activate only from Admissions after all readiness checks pass.</p>

        {message && <div className="my-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</div>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-gray-700">Resident *</span>
              <select value={residentId} onChange={(event) => setResidentId(event.target.value)} required disabled className="w-full rounded-lg border border-gray-300 px-3 py-2">
                <option value="">Select Resident</option>
                {residents
                  .filter(
                    (resident) =>
                      resident.status !== "Archived" ||
                      resident.id === originalResidentId,
                  )
                  .map((resident) => (
                    <option key={resident.id} value={resident.id} disabled={resident.status === "Archived"}>
                      {resident.full_name}{resident.status === "Archived" ? " (Archived)" : ""}
                    </option>
                  ))}
              </select>
            </label>

            <Field label="Start Date *"><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required disabled className="w-full rounded-lg border border-gray-300 px-3 py-2" /></Field>
            <Field label="End Date (optional)"><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} disabled={saving} className="w-full rounded-lg border border-gray-300 px-3 py-2" /></Field>
            <Field label="Monthly Rent *"><input type="number" min="0.01" step="0.01" value={monthlyRent} onChange={(event) => setMonthlyRent(event.target.value)} required disabled className="w-full rounded-lg border border-gray-300 px-3 py-2" /></Field>
            <Field label="Security Deposit"><input type="number" min="0" step="0.01" value={securityDeposit} onChange={(event) => setSecurityDeposit(event.target.value)} disabled className="w-full rounded-lg border border-gray-300 px-3 py-2" /></Field>
            <Field label="Contract Status *">
              <select value={contractStatus} onChange={(event) => setContractStatus(event.target.value as ContractStatus)} required disabled className="w-full rounded-lg border border-gray-300 px-3 py-2">
                <option value="Draft">Draft</option>
                <option value="Pending Signature">Pending Signature</option>
                <option value="Active">Active</option>
                <option value="Expired">Expired</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Terminated">Terminated (Legacy)</option>
              </select>
            </Field>
            <Field label="Replace Agreement PDF"><input type="file" accept="application/pdf,.pdf" onChange={(event) => setNewAgreementFile(event.target.files?.[0] ?? null)} disabled={saving} className="w-full rounded-lg border border-gray-300 p-2" /></Field>
          </div>

          {currentAgreement && (
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="mb-3 text-sm font-medium text-gray-700">Current Agreement</p>
              <a href={currentAgreement} target="_blank" rel="noopener noreferrer" className="inline-block rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700">Download Current PDF</a>
              <p className="mt-2 text-xs text-gray-500">Uploading a replacement keeps the historical file in storage.</p>
            </div>
          )}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Notes</span>
            <textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} disabled={saving} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
          </label>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white disabled:opacity-60">{saving ? "Updating..." : "Update Contract"}</button>
            <Link href={`/contracts/${contractId}`} className="rounded-lg bg-gray-200 px-5 py-2 font-medium text-gray-700">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span className="mb-2 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}
