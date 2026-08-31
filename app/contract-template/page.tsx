"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getSupabaseErrorMessage } from "@/lib/supabaseErrors";

type ContractTemplate = {
  id: string;
  template_name: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
};

export default function ContractTemplatePage() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function fetchTemplates() {
    setLoading(true);
    setError("");

    const { data, error: loadError } = await supabase
      .from("contract_templates")
      .select("id, template_name, title, content, is_active, created_at")
      .order("created_at", { ascending: false });

    if (loadError) {
      setTemplates([]);
      setError(
        getSupabaseErrorMessage(
          loadError,
          "Unable to load contract templates.",
        ),
      );
    } else {
      setTemplates((data ?? []) as ContractTemplate[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    // Loading Supabase data is the external synchronization for this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTemplates();
  }, []);

  function resetForm() {
    setTitle("");
    setContent("");
    setIsActive(true);
    setEditingId(null);
  }

  function startEditing(template: ContractTemplate) {
    setEditingId(template.id);
    setTitle(template.title);
    setContent(template.content);
    setIsActive(template.is_active);
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (!cleanTitle) {
      setError("Please enter a template title.");
      return;
    }

    if (!cleanContent) {
      setError("Please enter contract rules and conditions.");
      return;
    }

    setSaving(true);

    const payload = {
      template_name: cleanTitle,
      title: cleanTitle,
      content: cleanContent,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };

    const result = editingId
      ? await supabase
          .from("contract_templates")
          .update(payload)
          .eq("id", editingId)
          .select("id")
          .maybeSingle()
      : await supabase
          .from("contract_templates")
          .insert(payload)
          .select("id")
          .single();

    if (result.error || !result.data) {
      setError(
        getSupabaseErrorMessage(
          result.error,
          "Unable to save the contract template. Please try again.",
        ),
      );
      setSaving(false);
      return;
    }

    if (isActive) {
      const { error: deactivateError } = await supabase
        .from("contract_templates")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .neq("id", result.data.id);

      if (deactivateError) {
        await fetchTemplates();
        setError(
          "Template saved, but other active templates could not be made inactive. Please review the template list.",
        );
        setSaving(false);
        return;
      }
    }

    setMessage(
      editingId
        ? "Contract template updated successfully."
        : "Contract template saved successfully.",
    );
    resetForm();
    await fetchTemplates();
    setSaving(false);
  }

  async function activateTemplate(id: string) {
    if (!window.confirm("Make this the active contract template?")) return;

    setMessage("");
    setError("");

    const { error: activateError } = await supabase
      .from("contract_templates")
      .update({
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (activateError) {
      setError(
        getSupabaseErrorMessage(
          activateError,
          "Unable to activate this contract template.",
        ),
      );
      return;
    }

    const { error: deactivateError } = await supabase
      .from("contract_templates")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .neq("id", id);

    if (deactivateError) {
      await fetchTemplates();
      setError(
        "Template activated, but other active templates could not be made inactive. Please review the template list.",
      );
      return;
    }

    setMessage("Contract template activated successfully.");
    await fetchTemplates();
  }

  async function deactivateTemplate(template: ContractTemplate) {
    if (!window.confirm(`Make template ${template.title} inactive?`)) return;

    setMessage("");
    setError("");

    const { error: deactivateError } = await supabase
      .from("contract_templates")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", template.id);

    if (deactivateError) {
      setError(
        getSupabaseErrorMessage(
          deactivateError,
          "Unable to make this contract template inactive.",
        ),
      );
      return;
    }

    setMessage("Contract template marked inactive.");
    await fetchTemplates();
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
          StayHub
        </p>
        <h1 className="mt-2 text-3xl font-bold">Contract Templates</h1>
        <p className="mt-1 text-gray-600">
          Create and manage hostel contract templates.
        </p>
      </div>

      {(message || error) && (
        <div
          className={`mb-4 rounded-lg border p-4 ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {error || message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">
            {editingId ? "Edit Template" : "New Template"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">
                Template Title *
              </span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Hostel Contract Rules"
                required
                disabled={saving}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">
                Contract Rules and Conditions *
              </span>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={12}
                placeholder="Write the complete hostel contract here..."
                required
                disabled={saving}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>

            <label className="flex items-center gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                disabled={saving}
              />
              Active template
            </label>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2 text-white disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Template"
                    : "Save Template"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-5 py-2"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">Existing Templates</h2>

          {loading ? (
            <p className="text-gray-500">Loading templates...</p>
          ) : templates.length === 0 ? (
            <p className="text-gray-500">No contract templates found.</p>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {template.title}
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
                        {template.content}
                      </p>
                    </div>

                    <span
                      className={
                        template.is_active
                          ? "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                          : "rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
                      }
                    >
                      {template.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(template)}
                      className="rounded bg-blue-600 px-3 py-1 text-sm text-white"
                    >
                      Edit
                    </button>

                    {!template.is_active ? (
                      <button
                        type="button"
                        onClick={() => void activateTemplate(template.id)}
                        className="rounded bg-green-600 px-3 py-1 text-sm text-white"
                      >
                        Make Active
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void deactivateTemplate(template)}
                        className="rounded bg-amber-600 px-3 py-1 text-sm text-white"
                      >
                        Make Inactive
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}