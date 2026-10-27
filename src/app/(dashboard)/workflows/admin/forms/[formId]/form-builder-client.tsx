"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { confirm } from "@/components/design";
import { FormRenderer } from "@/components/workflows/form-renderer";
import { FormAiAssistant } from "@/components/workflows/form-ai-assistant";

interface Form {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isBuiltIn?: boolean;
  referenceNumberFormat: string;
  workflowDefinition: { id: string; name: string };
  versions: Array<{
    id: string;
    versionNumber: number;
    status: string;
    publishedAt: string | null;
  }>;
  publishedVersion: {
    id: string;
    versionNumber: number;
    schemaJson: unknown;
  } | null;
  _count?: {
    requests?: number;
    versions?: number;
  };
}

type FieldVisibility = "VISIBLE" | "HIDDEN" | "ADMINISTRATIVE";

interface FieldDef {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  position: number;
  config?: Record<string, unknown>;
  visibilityRules?: unknown;
  computedFormula?: unknown;
  visibility?: FieldVisibility;
}

interface MatrixRow {
  key: string;
  label: string;
  weight?: number;
}
interface MatrixColumn {
  key: string;
  label: string;
  weight?: number;
}
interface RepeaterSubField {
  key: string;
  label: string;
  type: string;
}

const FIELD_TYPES: ReadonlyArray<{ value: string; label: string }> = [
  { value: "SHORT_TEXT", label: "Short text" },
  { value: "LONG_TEXT", label: "Long text" },
  { value: "NUMBER", label: "Number" },
  { value: "DATE", label: "Date" },
  { value: "DATETIME", label: "Date & time" },
  { value: "DROPDOWN", label: "Dropdown" },
  { value: "MULTI_SELECT", label: "Multi-select" },
  { value: "CHECKBOX", label: "Checkbox" },
  { value: "FILE", label: "File" },
  { value: "USER_PICKER", label: "User picker" },
  { value: "REQUEST_LINK", label: "Request link" },
  { value: "LOOKUP", label: "Lookup" },
  { value: "SCORED_MATRIX", label: "Scored matrix" },
  { value: "REPEATER", label: "Repeater" },
  { value: "COMPUTED", label: "Computed" },
  { value: "SECTION_HEADER", label: "Section header" },
  { value: "SYSTEM_FIELD", label: "System field (read-only)" },
];

function uniqueKey(fields: FieldDef[], base: string): string {
  let n = 1;
  let candidate = base;
  while (fields.some((f) => f.key === candidate)) {
    candidate = `${base}_${++n}`;
  }
  return candidate;
}

type FieldStateValue = "EDITABLE" | "READ_ONLY" | "HIDDEN";

interface WorkflowOption {
  id: string;
  name: string;
  publishedVersionNumber: number | null;
}

export function FormBuilderClient({
  form,
  siblingForms = [],
  workflows = [],
  accessServiceNames = [],
}: {
  form: Form;
  siblingForms?: Array<{ id: string; name: string }>;
  workflows?: WorkflowOption[];
  /** Catalog services, so a LOOKUP field can point at them. */
  accessServiceNames?: string[];
}) {
  const router = useRouter();
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [aiOpen, setAiOpen] = useState(false);
  const [perStepFieldState, setPerStepFieldState] = useState<
    Record<string, Record<string, FieldStateValue>>
  >({});
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workflowDefinitionId, setWorkflowDefinitionId] = useState<string>(
    form.workflowDefinition.id,
  );

  async function changeWorkflow(nextId: string) {
    if (nextId === workflowDefinitionId) return;
    setBusy("workflow");
    setError(null);
    try {
      const res = await fetch(`/api/workflow/admin/forms/${form.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workflowDefinitionId: nextId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.message || body.error || "Could not change workflow",
        );
      }
      setWorkflowDefinitionId(nextId);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }
  const [tab, setTab] = useState<"editor" | "preview" | "settings">("editor");
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  function reorderFields(srcKey: string, dstKey: string) {
    if (srcKey === dstKey) return;
    const srcIdx = fields.findIndex((f) => f.key === srcKey);
    const dstIdx = fields.findIndex((f) => f.key === dstKey);
    if (srcIdx === -1 || dstIdx === -1) return;
    const next = fields.slice();
    const [moved] = next.splice(srcIdx, 1);
    next.splice(dstIdx, 0, moved!);
    setFields(next.map((f, i) => ({ ...f, position: i + 1 })));
  }
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);

  // Form metadata edits
  const [name, setName] = useState(form.name);
  const [description, setDescription] = useState(form.description ?? "");
  const [isActive, setIsActive] = useState(form.isActive);
  const [refFormat, setRefFormat] = useState(form.referenceNumberFormat);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(
          `/api/workflow/admin/forms/${form.id}/draft`,
        );
        if (!response.ok) throw new Error("Failed to load draft");
        const body = (await response.json()) as {
          draft: {
            schemaJson: {
              fields?: FieldDef[];
              perStepFieldState?: Record<
                string,
                Record<string, FieldStateValue>
              >;
            };
          };
        };
        if (!cancelled) {
          setFields(body.draft.schemaJson.fields ?? []);
          setPerStepFieldState(body.draft.schemaJson.perStepFieldState ?? {});
          setLoaded(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.id]);

  const selectedField = fields.find((f) => f.key === selectedFieldKey) ?? null;

  function addField(type: string) {
    const baseKey = type.toLowerCase();
    const newField: FieldDef = {
      key: uniqueKey(fields, baseKey),
      label: FIELD_TYPES.find((t) => t.value === type)?.label ?? type,
      type,
      required: false,
      position: fields.length + 1,
    };
    setFields([...fields, newField]);
    setSelectedFieldKey(newField.key);
  }

  function updateField(originalKey: string, patch: Partial<FieldDef>) {
    setFields(
      fields.map((f) => {
        if (f.key !== originalKey) return f;
        const next = { ...f, ...patch };
        return next;
      }),
    );
    if (patch.key && patch.key !== originalKey) {
      setSelectedFieldKey(patch.key);
    }
  }

  function deleteField(key: string) {
    setFields(
      fields
        .filter((f) => f.key !== key)
        .map((f, i) => ({ ...f, position: i + 1 })),
    );
    if (selectedFieldKey === key) setSelectedFieldKey(null);
  }

  function moveField(key: string, dir: -1 | 1) {
    const idx = fields.findIndex((f) => f.key === key);
    if (idx === -1) return;
    const target = idx + dir;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[idx], next[target]] = [next[target], next[idx]];
    setFields(next.map((f, i) => ({ ...f, position: i + 1 })));
  }

  async function saveDraft() {
    setBusy("save");
    setError(null);
    try {
      const response = await fetch(
        `/api/workflow/admin/forms/${form.id}/draft`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields, perStepFieldState }),
        },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || body.error || "Save failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function publish() {
    if (
      !(await confirm({
        title: "Publish form draft?",
        message:
          "Once published, this version is immutable and used for new submissions. In-flight requests stay on their original version.",
        confirmLabel: "Publish",
      }))
    )
      return;
    setBusy("publish");
    setError(null);
    try {
      // Save first to ensure the latest draft is committed
      await fetch(`/api/workflow/admin/forms/${form.id}/draft`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields, perStepFieldState }),
      });

      const response = await fetch(
        `/api/workflow/admin/forms/${form.id}/publish`,
        {
          method: "POST",
        },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || body.error || "Publish failed");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function saveMetadata(overrides?: { isActive?: boolean }) {
    setBusy("metadata");
    setError(null);
    const nextActive = overrides?.isActive ?? isActive;
    try {
      const response = await fetch(`/api/workflow/admin/forms/${form.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          isActive: nextActive,
          referenceNumberFormat: refFormat,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || body.error || "Save failed");
      }
      // Reflect server-confirmed state locally so the UI doesn't flicker.
      if (overrides?.isActive !== undefined) setIsActive(nextActive);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  if (!loaded) return <p className="text-stone text-sm">Loading draft…</p>;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{form.name}</h1>
          <div className="text-stone mt-1 flex flex-wrap items-center gap-2 text-sm">
            <span>Workflow:</span>
            <select
              value={workflowDefinitionId}
              onChange={(e) => changeWorkflow(e.target.value)}
              disabled={busy === "workflow"}
              className="border-hairline-strong bg-canvas text-body-sm text-ink rounded-md border px-2 py-1 disabled:opacity-50"
            >
              {workflows.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                  {w.publishedVersionNumber
                    ? ` (v${w.publishedVersionNumber})`
                    : " (draft only)"}
                </option>
              ))}
            </select>
            <span className="text-stone">
              ·{" "}
              {form.publishedVersion
                ? `Form published v${form.publishedVersion.versionNumber}`
                : "Form not yet published"}
            </span>
            {busy === "workflow" ? (
              <span className="text-caption text-stone">· saving…</span>
            ) : null}
          </div>
          <details className="text-caption text-stone mt-2 max-w-xl">
            <summary className="text-charcoal hover:text-ink cursor-pointer select-none">
              What happens when I change the workflow?
            </summary>
            <ul className="border-hairline-soft bg-surface-soft mt-2 space-y-1 rounded-md border p-3 leading-relaxed">
              <li>
                <span className="text-ink font-medium">
                  Live requests are not affected.
                </span>{" "}
                Each request is pinned to the workflow version it was submitted
                on (PRD §5.2 immutability).
              </li>
              <li>
                <span className="text-ink font-medium">New submissions</span>{" "}
                after the change use the newly-selected workflow.
              </li>
              <li>
                <span className="text-ink font-medium">Reversible</span> — you
                can pick the original workflow again at any time from this
                dropdown.
              </li>
            </ul>
          </details>
        </div>
        <div className="flex gap-2">
          <a
            href={`/workflows/admin/forms/${form.id}/notifications`}
            className="border-hairline-strong hover:bg-surface rounded-md border px-3 py-1.5 text-sm font-medium"
          >
            Notifications
          </a>
          <button
            type="button"
            onClick={() => setAiOpen((v) => !v)}
            className="border-hairline-strong hover:bg-surface rounded-md border px-3 py-1.5 text-sm font-medium"
          >
            Draft with AI
          </button>
          <button
            onClick={saveDraft}
            disabled={!!busy}
            className="border-hairline-strong hover:bg-surface rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-50"
          >
            {busy === "save" ? "Saving…" : "Save draft"}
          </button>
          <button
            onClick={publish}
            disabled={!!busy || fields.length === 0}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy === "publish" ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-brand-red/40 text-coral-dark rounded-md border border-(--color-brand-red-dark) px-3 py-2 text-sm">
          {error}
        </div>
      ) : null}

      {aiOpen ? (
        <FormAiAssistant
          existingFieldKeys={fields.map((f) => f.key)}
          formName={form.name}
          accessServiceNames={accessServiceNames}
          onClose={() => setAiOpen(false)}
          onApply={(result) => {
            // Replaces the canvas with what the user just reviewed. Still a
            // local draft — Save draft and Publish stay manual.
            setFields(
              result.fields.map((field, i) => ({
                key: field.key,
                label: field.label,
                type: field.type,
                required: field.required,
                position: i + 1,
                visibility: field.visibility,
                config: field.config,
              })),
            );
            setAiOpen(false);
          }}
        />
      ) : null}

      <div className="border-hairline flex gap-1 border-b">
        <TabButton active={tab === "editor"} onClick={() => setTab("editor")}>
          Editor
        </TabButton>
        <TabButton active={tab === "preview"} onClick={() => setTab("preview")}>
          Preview
        </TabButton>
        <TabButton
          active={tab === "settings"}
          onClick={() => setTab("settings")}
        >
          Settings
        </TabButton>
      </div>

      {tab === "editor" ? (
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Left: palette + form metadata */}
          <aside className="lg:col-span-3">
            <div className="border-hairline bg-canvas rounded-xl border p-4">
              <h3 className="text-body-sm-medium text-ink">Add field</h3>
              <p className="text-caption text-stone mt-0.5">
                Click a type to append it.
              </p>
              <div className="mt-3 space-y-1">
                {FIELD_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => addField(t.value)}
                    className="border-hairline-soft bg-canvas text-body-sm text-charcoal hover:border-hairline-strong hover:bg-surface block w-full rounded-md border px-2 py-1.5 text-left transition"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Middle: fields list */}
          <section className="border-hairline bg-canvas rounded-xl border p-4 lg:col-span-5">
            <div className="flex items-center justify-between">
              <h3 className="text-body-sm-medium text-ink">
                Fields
                <span className="text-caption text-stone ml-2">
                  ({fields.length})
                </span>
              </h3>
              <span className="text-caption text-stone">
                Drag <span aria-hidden>⋮⋮</span> to reorder
              </span>
            </div>
            {fields.length === 0 ? (
              <p className="text-body-sm text-stone mt-6 text-center">
                Add a field from the palette on the left to start building.
              </p>
            ) : (
              <ol className="mt-3 space-y-1.5">
                {fields.map((f, i) => (
                  <li
                    key={f.key}
                    draggable
                    onDragStart={(e) => {
                      setDragKey(f.key);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnter={() => {
                      if (dragKey && dragKey !== f.key) setDragOverKey(f.key);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }}
                    onDragLeave={() => {
                      if (dragOverKey === f.key) setDragOverKey(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragKey) reorderFields(dragKey, f.key);
                      setDragKey(null);
                      setDragOverKey(null);
                    }}
                    onDragEnd={() => {
                      setDragKey(null);
                      setDragOverKey(null);
                    }}
                    className={`group text-body-sm flex items-center gap-2 rounded-lg border px-2.5 py-2 transition ${
                      selectedFieldKey === f.key
                        ? "border-brand-yellow-deep bg-yellow-light"
                        : "border-hairline-soft hover:border-hairline-strong"
                    } ${dragKey === f.key ? "opacity-40" : ""} ${
                      dragOverKey === f.key
                        ? "border-brand-blue ring-brand-blue/30 ring-2"
                        : ""
                    }`}
                  >
                    <span
                      className="text-stone hover:text-ink cursor-grab px-1 select-none active:cursor-grabbing"
                      title="Drag to reorder"
                      aria-hidden
                    >
                      ⋮⋮
                    </span>
                    <span className="text-caption text-stone font-mono">
                      {i + 1}.
                    </span>
                    <button
                      onClick={() => setSelectedFieldKey(f.key)}
                      className="min-w-0 flex-1 truncate text-left"
                    >
                      <span className="text-ink font-medium">{f.label}</span>{" "}
                      <span className="text-stone">· {f.type}</span>{" "}
                      <span className="text-caption text-muted font-mono">
                        {f.key}
                      </span>
                      {f.required ? (
                        <span className="bg-coral-light text-coral-dark ml-1.5 inline-flex h-4 items-center rounded-full px-1.5 text-[10px] font-semibold">
                          required
                        </span>
                      ) : null}
                    </button>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        onClick={() => moveField(f.key, -1)}
                        disabled={i === 0}
                        aria-label="Move up"
                        className="text-stone hover:bg-canvas hover:text-ink rounded p-1 transition disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveField(f.key, 1)}
                        disabled={i === fields.length - 1}
                        aria-label="Move down"
                        className="text-stone hover:bg-canvas hover:text-ink rounded p-1 transition disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => deleteField(f.key)}
                        aria-label="Delete field"
                        className="text-stone hover:bg-canvas hover:text-coral-dark rounded p-1 transition"
                      >
                        ×
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Right: field config */}
          <aside className="border-hairline bg-canvas rounded-xl border p-4 lg:col-span-4">
            <h3 className="text-sm font-semibold">Field properties</h3>
            {selectedField ? (
              <FieldEditor
                field={selectedField}
                onChange={(patch) => updateField(selectedField.key, patch)}
                fieldList={fields}
                siblingForms={siblingForms}
              />
            ) : (
              <p className="text-stone mt-2 text-xs">
                Select a field to edit its properties.
              </p>
            )}
          </aside>
        </div>
      ) : tab === "preview" ? (
        <div className="border-hairline bg-canvas rounded-xl border p-5">
          <p className="text-caption text-stone">
            Submitter view — read-only preview.
          </p>
          <div className="mt-3">
            <FormRenderer
              schema={{ fields: fields as never }}
              values={{}}
              onChange={() => {}}
              disabled
            />
          </div>
        </div>
      ) : (
        <SettingsTab
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
          isActive={isActive}
          setIsActive={setIsActive}
          refFormat={refFormat}
          setRefFormat={setRefFormat}
          isBuiltIn={form.isBuiltIn ?? false}
          publishedVersionNumber={form.publishedVersion?.versionNumber ?? null}
          fieldCount={fields.length}
          requestCount={form._count?.requests ?? 0}
          versionCount={form._count?.versions ?? 0}
          onSave={saveMetadata}
          busy={busy === "metadata"}
        />
      )}
    </div>
  );
}

function SettingsTab({
  name,
  setName,
  description,
  setDescription,
  isActive,
  setIsActive,
  refFormat,
  setRefFormat,
  isBuiltIn,
  publishedVersionNumber,
  fieldCount,
  requestCount,
  versionCount,
  onSave,
  busy,
}: {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  isActive: boolean;
  setIsActive: (v: boolean) => void;
  refFormat: string;
  setRefFormat: (v: string) => void;
  isBuiltIn: boolean;
  publishedVersionNumber: number | null;
  fieldCount: number;
  requestCount: number;
  versionCount: number;
  onSave: (overrides?: { isActive?: boolean }) => Promise<void> | void;
  busy: boolean;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Left: editable settings (2 cols) */}
      <div className="space-y-4 lg:col-span-2">
        <div className="border-hairline bg-canvas rounded-xl border p-5">
          <h2 className="text-h5 text-ink">General</h2>
          <p className="text-caption text-stone mt-0.5">
            Form-wide metadata. Changes here don&apos;t bump the published
            version.
          </p>
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-caption text-stone">Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isBuiltIn}
                className="border-hairline-strong bg-canvas text-body-md text-ink disabled:bg-surface disabled:text-stone mt-1 w-full rounded-md border px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-caption text-stone">Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={isBuiltIn}
                className="border-hairline-strong bg-canvas text-body-md text-ink disabled:bg-surface disabled:text-stone mt-1 w-full rounded-md border px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-caption text-stone">
                Reference number format
              </span>
              <input
                value={refFormat}
                onChange={(e) => setRefFormat(e.target.value)}
                disabled={isBuiltIn}
                className="border-hairline-strong bg-canvas text-body-md text-ink disabled:bg-surface disabled:text-stone mt-1 w-full rounded-md border px-3 py-2 font-mono"
              />
              <span className="text-caption text-stone mt-1 block">
                Available tokens: <code>{"{YYYY}"}</code>, <code>{"{MM}"}</code>
                , <code>{"{seq:04}"}</code>. Reference numbers are immutable for
                the request lifetime.
              </span>
            </label>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => void onSave()}
              disabled={busy || isBuiltIn}
              className="bg-ink text-button-md text-on-ink rounded-full px-5 py-2 transition disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save settings"}
            </button>
            {isBuiltIn ? (
              <span className="text-caption text-stone">
                Built-in forms can&apos;t be modified — clone first.
              </span>
            ) : null}
          </div>
        </div>

        <div
          className={
            "rounded-xl border p-5 transition " +
            (isActive
              ? "border-hairline bg-canvas"
              : "bg-brand-red/20 border-(--color-brand-red-dark)/40")
          }
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-h5 text-ink">Form status</h2>
              <p className="text-caption text-stone mt-0.5">
                Inactive forms reject new submissions but preserve running
                requests and history.
              </p>
            </div>
            <span
              className={
                "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase " +
                (isActive
                  ? "bg-mint-light text-moss-dark"
                  : "bg-brand-red text-coral-dark")
              }
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                setIsActive(!isActive);
                void onSave({ isActive: !isActive });
              }}
              disabled={busy || isBuiltIn}
              className={
                "text-body-sm-medium rounded-md px-3 py-1.5 transition disabled:cursor-not-allowed disabled:opacity-50 " +
                (isActive
                  ? "bg-canvas text-coral-dark hover:bg-brand-red/40 border border-(--color-brand-red-dark)"
                  : "border-hairline-strong bg-canvas text-charcoal hover:bg-surface border")
              }
            >
              {busy
                ? "Saving…"
                : isActive
                  ? "Deactivate this form"
                  : "Re-activate this form"}
            </button>
          </div>
        </div>
      </div>

      {/* Right: read-only stats */}
      <aside className="space-y-3">
        <div className="border-hairline bg-surface-soft rounded-xl border p-4">
          <h3 className="text-micro-uppercase text-stone">At a glance</h3>
          <dl className="text-body-sm mt-3 space-y-2">
            <Stat label="Status">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  isActive
                    ? "bg-mint-light text-moss-dark"
                    : "bg-blush-light text-coral-dark"
                }`}
              >
                {isActive ? "Active" : "Inactive"}
              </span>
            </Stat>
            <Stat label="Published">
              {publishedVersionNumber ? (
                <span className="text-charcoal font-mono">
                  v{publishedVersionNumber}
                </span>
              ) : (
                <span className="text-stone">Not yet</span>
              )}
            </Stat>
            <Stat label="Versions">
              <span className="text-charcoal font-mono">{versionCount}</span>
            </Stat>
            <Stat label="Fields (draft)">
              <span className="text-charcoal font-mono">{fieldCount}</span>
            </Stat>
            <Stat label="Requests filed">
              <span className="text-charcoal font-mono">{requestCount}</span>
            </Stat>
            <Stat label="Built-in">
              {isBuiltIn ? (
                <span className="bg-yellow-light text-yellow-dark rounded-full px-2 py-0.5 text-[11px] font-semibold">
                  Yes
                </span>
              ) : (
                <span className="text-stone">No</span>
              )}
            </Stat>
          </dl>
        </div>
      </aside>
    </div>
  );
}

function Stat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-caption text-stone">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function TabButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-1.5 text-sm font-medium ${
        active
          ? "border-blue-500 text-blue-600"
          : "text-stone hover:text-charcoal border-transparent"
      }`}
    >
      {children}
    </button>
  );
}

function FieldEditor({
  field,
  onChange,
  fieldList = [],
  siblingForms = [],
}: {
  field: FieldDef;
  onChange: (patch: Partial<FieldDef>) => void;
  fieldList?: FieldDef[];
  siblingForms?: Array<{ id: string; name: string }>;
}) {
  const optionsString = Array.isArray(
    (field.config as { options?: unknown })?.options,
  )
    ? ((field.config as { options: string[] }).options ?? []).join("\n")
    : "";

  function patchConfig(patch: Record<string, unknown>) {
    onChange({ config: { ...(field.config ?? {}), ...patch } });
  }

  return (
    <div className="text-caption mt-2 space-y-3">
      <label className="block">
        <span className="text-stone">Key</span>
        <input
          value={field.key}
          onChange={(e) => onChange({ key: e.target.value })}
          className="border-hairline-strong bg-canvas text-body-sm text-ink mt-1 w-full rounded-md border px-2 py-1.5 font-mono"
        />
      </label>
      <label className="block">
        <span className="text-stone">Label</span>
        <input
          value={field.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className="border-hairline-strong bg-canvas text-body-sm text-ink mt-1 w-full rounded-md border px-2 py-1.5"
        />
      </label>
      <label className="block">
        <span className="text-stone">Type</span>
        <select
          value={field.type}
          onChange={(e) => onChange({ type: e.target.value })}
          className="border-hairline-strong bg-canvas text-body-sm text-ink mt-1 w-full rounded-md border px-2 py-1.5"
        >
          {FIELD_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={field.required ?? false}
          onChange={(e) => onChange({ required: e.target.checked })}
          className="custom-checkbox"
        />
        <span className="text-stone">Required</span>
      </label>

      {/* Form-level visibility (PRD §4.5 — distinct from per-step state) */}
      <div className="border-hairline-soft bg-surface-soft space-y-1.5 rounded-md border p-3">
        <p className="text-stone">Visibility</p>
        {(
          [
            {
              value: "VISIBLE",
              label: "Visible",
              hint: "Default — shown when filling the form.",
            },
            {
              value: "HIDDEN",
              label: "Hidden",
              hint: "Hidden everywhere, but value can be set programmatically (computed, automation, default).",
            },
            {
              value: "ADMINISTRATIVE",
              label: "Administrative",
              hint: "Only visible on the request page when reviewing — not when submitting.",
            },
          ] as const
        ).map((opt) => {
          const current = field.visibility ?? "VISIBLE";
          const checked = current === opt.value;
          return (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-start gap-2 rounded-md border px-2 py-1.5 transition ${
                checked
                  ? "border-brand-yellow-deep bg-yellow-light"
                  : "border-hairline-soft bg-canvas hover:border-hairline-strong"
              }`}
            >
              <input
                type="radio"
                name={`vis_${field.key}`}
                checked={checked}
                onChange={() =>
                  onChange({
                    visibility:
                      opt.value === "VISIBLE"
                        ? undefined
                        : (opt.value as FieldVisibility),
                  })
                }
                className="mt-1 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-body-sm-medium text-ink">{opt.label}</p>
                <p className="text-stone text-[11px]">{opt.hint}</p>
              </div>
            </label>
          );
        })}
      </div>

      {/* Data source selector for LOOKUP */}
      {field.type === "LOOKUP" && (
        <label className="block">
          <span className="text-stone">Data source</span>
          <select
            value={(field.config?.dataSource as string | undefined) ?? "static"}
            onChange={(e) => patchConfig({ dataSource: e.target.value })}
            className="border-hairline-strong bg-canvas text-body-sm text-ink mt-1 w-full rounded-md border px-2 py-1.5"
          >
            <option value="static">Static options</option>
            <option value="ACCESS_SERVICES">Access Services catalog</option>
          </select>
        </label>
      )}

      {/* Options (DROPDOWN, MULTI_SELECT, or LOOKUP with static data source) */}
      {(field.type === "DROPDOWN" ||
        field.type === "MULTI_SELECT" ||
        (field.type === "LOOKUP" &&
          (field.config?.dataSource ?? "static") === "static")) && (
        <label className="block">
          <span className="text-stone">Options (one per line)</span>
          <textarea
            value={optionsString}
            onChange={(e) =>
              patchConfig({
                options: e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            rows={4}
            className="border-hairline-strong bg-canvas text-body-sm text-ink mt-1 w-full rounded-md border px-2 py-1.5"
          />
        </label>
      )}

      {/* Info text for LOOKUP[ACCESS_SERVICES] */}
      {field.type === "LOOKUP" &&
        (field.config?.dataSource as string | undefined) ===
          "ACCESS_SERVICES" && (
          <p className="text-body-sm text-stone rounded-md border border-[var(--color-hairline-soft)] bg-[var(--color-surface-soft)] px-3 py-2">
            Options are loaded live from the Access Services catalog. No manual
            options needed.
          </p>
        )}

      {/* SYSTEM_FIELD: systemField selector */}
      {field.type === "SYSTEM_FIELD" && (
        <label className="block">
          <span className="text-stone">System field</span>
          <select
            value={
              (field.config?.systemField as string | undefined) ??
              "REQUESTER_NAME"
            }
            onChange={(e) => patchConfig({ systemField: e.target.value })}
            className="border-hairline-strong bg-canvas text-body-sm text-ink mt-1 w-full rounded-md border px-2 py-1.5"
          >
            <option value="REQUESTER_NAME">Requester name</option>
            <option value="REQUESTER_EMAIL">Requester email</option>
            <option value="REQUESTER_MANAGER_NAME">
              Requester&apos;s manager name
            </option>
          </select>
          <p className="text-caption text-stone mt-1">
            Read-only. Value is resolved automatically at form load and never
            stored in field values.
          </p>
        </label>
      )}

      {/* Scored Matrix: rows + columns with weights */}
      {field.type === "SCORED_MATRIX" && (
        <ScoredMatrixEditor field={field} patchConfig={patchConfig} />
      )}

      {/* Repeater: sub-fields + min/max rows */}
      {field.type === "REPEATER" && (
        <RepeaterEditor field={field} patchConfig={patchConfig} />
      )}

      {/* Computed: JSON formula textarea + helper hints */}
      {field.type === "COMPUTED" && (
        <ComputedEditor field={field} onChange={onChange} />
      )}

      {/* Request link: target form picker */}
      {field.type === "REQUEST_LINK" && (
        <RequestLinkConfigEditor
          field={field}
          patchConfig={patchConfig}
          siblingForms={siblingForms}
        />
      )}

      {/* Conditional logic — single source of truth over visibilityRules */}
      <ConditionalLogicEditor
        field={field}
        onChange={onChange}
        fieldList={fieldList}
      />
    </div>
  );
}

// ===========================================================================
// REQUEST_LINK target picker
// ===========================================================================
function RequestLinkConfigEditor({
  field,
  patchConfig,
  siblingForms,
}: {
  field: FieldDef;
  patchConfig: (patch: Record<string, unknown>) => void;
  siblingForms: Array<{ id: string; name: string }>;
}) {
  const cfg = (field.config ?? {}) as {
    targetFormName?: string;
    targetFormId?: string;
  };
  return (
    <div className="border-hairline-soft bg-surface-soft space-y-2 rounded-md border p-3">
      <p className="text-stone">Target form</p>
      <select
        value={cfg.targetFormName ?? ""}
        onChange={(e) => {
          const name = e.target.value;
          const target = siblingForms.find((f) => f.name === name);
          patchConfig({
            targetFormName: name || undefined,
            targetFormId: target?.id,
          });
        }}
        className="border-hairline-strong bg-canvas text-body-sm text-ink w-full rounded-md border px-2 py-1.5"
      >
        <option value="">— Select form —</option>
        {siblingForms.map((f) => (
          <option key={f.id} value={f.name}>
            {f.name}
          </option>
        ))}
      </select>
      <p className="text-stone text-[11px]">
        Picker will list non-final requests on the chosen form. Cancelling the
        chosen target also cancels this request via cascade (PRD §5.3).
      </p>
    </div>
  );
}

// ===========================================================================
// Conditional Logic — visual rule builder
// Stores into field.visibilityRules as: { and: [ { op: "==", left: { field: "x" }, right: { const: "v" } } ] }
// or { or: [...] } depending on combinator.
// ===========================================================================
type LogicRule = {
  fieldKey: string;
  op: "==" | "!=" | ">" | "<" | ">=" | "<=";
  value: string;
};
type LogicState = { combinator: "and" | "or"; rules: LogicRule[] };

function exprToLogic(expr: unknown): LogicState | null {
  if (!expr || typeof expr !== "object") return null;
  const e = expr as Record<string, unknown>;
  const combinator: "and" | "or" =
    "and" in e ? "and" : "or" in e ? "or" : "and";
  const arr = (e.and ?? e.or) as unknown;
  if (!Array.isArray(arr)) return null;
  const rules: LogicRule[] = [];
  for (const r of arr) {
    if (!r || typeof r !== "object") continue;
    const rec = r as Record<string, unknown>;
    if (typeof rec.op !== "string") continue;
    const left = rec.left as { field?: string } | undefined;
    const right = rec.right as { const?: unknown } | undefined;
    if (!left?.field) continue;
    rules.push({
      fieldKey: left.field,
      op: rec.op as LogicRule["op"],
      value:
        right?.const === undefined || right.const === null
          ? ""
          : String(right.const),
    });
  }
  return { combinator, rules };
}

function logicToExpr(state: LogicState): unknown {
  const arr = state.rules.map((r) => ({
    op: r.op,
    left: { field: r.fieldKey },
    right: { const: r.value },
  }));
  return { [state.combinator]: arr };
}

const OP_LABELS: Record<LogicRule["op"], string> = {
  "==": "equals",
  "!=": "does not equal",
  ">": "is greater than",
  "<": "is less than",
  ">=": "is at least",
  "<=": "is at most",
};

function ConditionalLogicEditor({
  field,
  onChange,
  fieldList,
}: {
  field: FieldDef;
  onChange: (patch: Partial<FieldDef>) => void;
  fieldList: FieldDef[];
}) {
  const parsed = exprToLogic(field.visibilityRules);
  const hasUnparseableRule =
    field.visibilityRules !== undefined &&
    field.visibilityRules !== null &&
    parsed === null;

  const initial: LogicState = parsed ?? { combinator: "and", rules: [] };
  const [enabled, setEnabled] = useState(initial.rules.length > 0);
  const [state, setState] = useState<LogicState>(initial);

  const peers = fieldList.filter(
    (f) =>
      f.key !== field.key &&
      f.type !== "SECTION_HEADER" &&
      f.type !== "COMPUTED",
  );

  const persist = (next: LogicState | null) => {
    if (!next || next.rules.length === 0) {
      onChange({ visibilityRules: undefined });
    } else {
      onChange({ visibilityRules: logicToExpr(next) as never });
    }
  };

  const toggle = (on: boolean) => {
    setEnabled(on);
    if (!on) persist(null);
    else if (state.rules.length > 0) persist(state);
  };

  const updateRule = (i: number, patch: Partial<LogicRule>) => {
    const rules = state.rules.map((r, idx) =>
      idx === i ? { ...r, ...patch } : r,
    );
    const next = { ...state, rules };
    setState(next);
    persist(next);
  };

  const addRule = () => {
    const first = peers[0];
    if (!first) return;
    const next: LogicState = {
      ...state,
      rules: [
        ...state.rules,
        { fieldKey: first.key, op: "==" as const, value: "" },
      ],
    };
    setState(next);
    setEnabled(true);
    persist(next);
  };

  const removeRule = (i: number) => {
    const rules = state.rules.filter((_, idx) => idx !== i);
    const next = { ...state, rules };
    setState(next);
    persist(next);
  };

  const setCombinator = (c: "and" | "or") => {
    const next = { ...state, combinator: c };
    setState(next);
    persist(next);
  };

  // Rare: existing rule was authored by API/seed and the visual builder can't
  // round-trip it. Show a read-only warning + JSON instead of editing UI.
  if (hasUnparseableRule) {
    return (
      <div className="border-hairline-soft bg-surface-soft space-y-2 rounded-xl border p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-ink font-semibold">Conditional logic</span>
          <span className="bg-yellow-light text-yellow-dark rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase">
            Advanced
          </span>
        </div>
        <p className="text-caption text-stone">
          This field has an advanced visibility rule that can&apos;t be edited
          here. Clear it to use the visual builder, or edit through the API.
        </p>
        <pre className="border-hairline-soft bg-canvas text-charcoal overflow-x-auto rounded-md border p-2 font-mono text-[11px]">
          {JSON.stringify(field.visibilityRules, null, 2)}
        </pre>
        <button
          type="button"
          onClick={() => onChange({ visibilityRules: undefined })}
          className="text-caption-bold text-coral-dark hover:underline"
        >
          Clear advanced rule
        </button>
      </div>
    );
  }

  return (
    <div className="border-hairline-soft bg-surface-soft space-y-3 rounded-xl border p-3">
      <label className="flex cursor-pointer items-center justify-between gap-2">
        <span className="text-ink font-semibold">Conditional logic</span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => toggle(e.target.checked)}
        />
      </label>

      {!enabled ? (
        <p className="text-caption text-stone">
          Field is always visible (subject to step state). Toggle on to make it
          appear only when conditions are met.
        </p>
      ) : (
        <div className="space-y-2">
          <div className="text-caption text-stone flex flex-wrap items-center gap-1.5">
            <span>Show this field when</span>
            {state.rules.length > 1 ? (
              <select
                value={state.combinator}
                onChange={(e) => setCombinator(e.target.value as "and" | "or")}
                className="border-hairline bg-canvas text-caption-bold text-ink rounded-md border px-2 py-0.5"
              >
                <option value="and">all</option>
                <option value="or">any</option>
              </select>
            ) : (
              <span className="text-charcoal font-semibold">the</span>
            )}
            <span>of these rules match:</span>
          </div>

          {state.rules.length === 0 ? (
            <p className="border-hairline-soft bg-canvas text-caption text-stone rounded-md border border-dashed px-3 py-2">
              No rules yet — click <b>Add rule</b> below.
            </p>
          ) : null}

          {state.rules.map((r, i) => {
            const peer = peers.find((p) => p.key === r.fieldKey);
            return (
              <div
                key={i}
                className="border-hairline-soft bg-canvas rounded-lg border p-2"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="bg-surface-soft text-charcoal rounded-md px-2 py-1 font-mono text-[11px]">
                    {peer?.label || r.fieldKey}
                  </span>
                  <select
                    value={r.op}
                    onChange={(e) =>
                      updateRule(i, { op: e.target.value as LogicRule["op"] })
                    }
                    className="border-hairline bg-canvas text-caption text-ink rounded-md border px-2 py-1"
                    aria-label="Operator"
                  >
                    {(Object.keys(OP_LABELS) as LogicRule["op"][]).map((op) => (
                      <option key={op} value={op}>
                        {OP_LABELS[op]}
                      </option>
                    ))}
                  </select>
                  <input
                    value={r.value}
                    onChange={(e) => updateRule(i, { value: e.target.value })}
                    placeholder="value"
                    className="border-hairline bg-canvas text-caption text-ink min-w-0 flex-1 rounded-md border px-2 py-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeRule(i)}
                    className="text-stone hover:bg-brand-red hover:text-coral-dark inline-flex h-6 w-6 items-center justify-center rounded-full"
                    aria-label="Remove rule"
                  >
                    ×
                  </button>
                </div>
                <details className="mt-1.5">
                  <summary className="text-stone hover:text-ink cursor-pointer text-[11px]">
                    Change reference field
                  </summary>
                  <select
                    value={r.fieldKey}
                    onChange={(e) =>
                      updateRule(i, { fieldKey: e.target.value })
                    }
                    className="border-hairline bg-canvas text-caption text-ink mt-1.5 w-full rounded-md border px-2 py-1"
                  >
                    {peers.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label || p.key}
                      </option>
                    ))}
                  </select>
                </details>
              </div>
            );
          })}

          <button
            type="button"
            onClick={addRule}
            disabled={peers.length === 0}
            className="border-hairline text-caption-bold text-brand-blue hover:border-brand-blue hover:bg-canvas disabled:border-hairline-soft disabled:text-stone inline-flex items-center gap-1 rounded-full border border-dashed px-3 py-1 transition disabled:cursor-not-allowed"
          >
            + Add rule
          </button>

          {peers.length === 0 ? (
            <p className="text-caption text-stone">
              Add another field to this form first to reference it here.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// Sub-editors for the new field types
// ===========================================================================

function ScoredMatrixEditor({
  field,
  patchConfig,
}: {
  field: FieldDef;
  patchConfig: (patch: Record<string, unknown>) => void;
}) {
  const cfg = (field.config ?? {}) as {
    rows?: MatrixRow[];
    columns?: MatrixColumn[];
  };
  const rows = cfg.rows ?? [];
  const columns = cfg.columns ?? [];

  function setRows(next: MatrixRow[]) {
    patchConfig({ rows: next });
  }
  function setCols(next: MatrixColumn[]) {
    patchConfig({ columns: next });
  }

  return (
    <div className="border-hairline bg-surface-soft space-y-3 rounded-md border p-3">
      <p className="text-ink font-semibold">Scored matrix</p>

      <div>
        <p className="text-stone">Rows (e.g., likelihood)</p>
        <ul className="mt-1 space-y-1">
          {rows.map((r, i) => (
            <li key={i} className="flex gap-1">
              <input
                value={r.key}
                onChange={(e) => {
                  const next = [...rows];
                  next[i] = { ...r, key: e.target.value };
                  setRows(next);
                }}
                placeholder="key"
                className="border-hairline-strong bg-canvas text-body-sm text-ink flex-1 rounded-md border px-2 py-1 font-mono"
              />
              <input
                value={r.label}
                onChange={(e) => {
                  const next = [...rows];
                  next[i] = { ...r, label: e.target.value };
                  setRows(next);
                }}
                placeholder="Label"
                className="border-hairline-strong bg-canvas text-body-sm text-ink flex-1 rounded-md border px-2 py-1"
              />
              <input
                type="number"
                value={r.weight ?? ""}
                onChange={(e) => {
                  const next = [...rows];
                  next[i] = {
                    ...r,
                    weight:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  };
                  setRows(next);
                }}
                placeholder="w"
                className="border-hairline-strong bg-canvas text-body-sm text-ink w-14 rounded-md border px-2 py-1"
              />
              <button
                type="button"
                onClick={() => setRows(rows.filter((_, j) => j !== i))}
                className="border-hairline text-coral-dark rounded-full border px-2"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() =>
            setRows([
              ...rows,
              {
                key: `r${rows.length + 1}`,
                label: `Row ${rows.length + 1}`,
                weight: rows.length + 1,
              },
            ])
          }
          className="border-hairline bg-canvas text-caption-bold text-charcoal hover:bg-surface mt-2 inline-flex rounded-full border px-3 py-1"
        >
          + Add row
        </button>
      </div>

      <div>
        <p className="text-stone">Columns (e.g., impact)</p>
        <ul className="mt-1 space-y-1">
          {columns.map((c, i) => (
            <li key={i} className="flex gap-1">
              <input
                value={c.key}
                onChange={(e) => {
                  const next = [...columns];
                  next[i] = { ...c, key: e.target.value };
                  setCols(next);
                }}
                placeholder="key"
                className="border-hairline-strong bg-canvas text-body-sm text-ink flex-1 rounded-md border px-2 py-1 font-mono"
              />
              <input
                value={c.label}
                onChange={(e) => {
                  const next = [...columns];
                  next[i] = { ...c, label: e.target.value };
                  setCols(next);
                }}
                placeholder="Label"
                className="border-hairline-strong bg-canvas text-body-sm text-ink flex-1 rounded-md border px-2 py-1"
              />
              <input
                type="number"
                value={c.weight ?? ""}
                onChange={(e) => {
                  const next = [...columns];
                  next[i] = {
                    ...c,
                    weight:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  };
                  setCols(next);
                }}
                placeholder="w"
                className="border-hairline-strong bg-canvas text-body-sm text-ink w-14 rounded-md border px-2 py-1"
              />
              <button
                type="button"
                onClick={() => setCols(columns.filter((_, j) => j !== i))}
                className="border-hairline text-coral-dark rounded-full border px-2"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() =>
            setCols([
              ...columns,
              {
                key: `c${columns.length + 1}`,
                label: `Col ${columns.length + 1}`,
                weight: columns.length + 1,
              },
            ])
          }
          className="border-hairline bg-canvas text-caption-bold text-charcoal hover:bg-surface mt-2 inline-flex rounded-full border px-3 py-1"
        >
          + Add column
        </button>
      </div>

      <p className="text-caption text-stone">
        Score = row.weight × column.weight. Use a Conditional Branch step to
        route on the resulting score (e.g., {'{ field: "<key>.score" }'}).
      </p>
    </div>
  );
}

function RepeaterEditor({
  field,
  patchConfig,
}: {
  field: FieldDef;
  patchConfig: (patch: Record<string, unknown>) => void;
}) {
  const cfg = (field.config ?? {}) as {
    subFields?: RepeaterSubField[];
    minRows?: number;
    maxRows?: number;
  };
  const subFields = cfg.subFields ?? [];

  function setSubs(next: RepeaterSubField[]) {
    patchConfig({ subFields: next });
  }

  const subTypes = ["SHORT_TEXT", "LONG_TEXT", "NUMBER", "DATE", "CHECKBOX"];

  return (
    <div className="border-hairline bg-surface-soft space-y-2 rounded-md border p-3">
      <p className="text-ink font-semibold">Repeater sub-fields</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-stone">Min rows</span>
          <input
            type="number"
            value={cfg.minRows ?? 0}
            onChange={(e) =>
              patchConfig({ minRows: Number(e.target.value) || 0 })
            }
            className="border-hairline-strong bg-canvas text-body-sm text-ink mt-1 w-full rounded-md border px-2 py-1"
          />
        </label>
        <label className="block">
          <span className="text-stone">Max rows</span>
          <input
            type="number"
            value={cfg.maxRows ?? 50}
            onChange={(e) =>
              patchConfig({ maxRows: Number(e.target.value) || 50 })
            }
            className="border-hairline-strong bg-canvas text-body-sm text-ink mt-1 w-full rounded-md border px-2 py-1"
          />
        </label>
      </div>

      <ul className="space-y-1">
        {subFields.map((s, i) => (
          <li key={i} className="flex gap-1">
            <input
              value={s.key}
              onChange={(e) => {
                const next = [...subFields];
                next[i] = { ...s, key: e.target.value };
                setSubs(next);
              }}
              placeholder="key"
              className="border-hairline-strong bg-canvas text-body-sm text-ink flex-1 rounded-md border px-2 py-1 font-mono"
            />
            <input
              value={s.label}
              onChange={(e) => {
                const next = [...subFields];
                next[i] = { ...s, label: e.target.value };
                setSubs(next);
              }}
              placeholder="Label"
              className="border-hairline-strong bg-canvas text-body-sm text-ink flex-1 rounded-md border px-2 py-1"
            />
            <select
              value={s.type}
              onChange={(e) => {
                const next = [...subFields];
                next[i] = { ...s, type: e.target.value };
                setSubs(next);
              }}
              className="border-hairline-strong bg-canvas text-caption text-ink rounded-md border px-2 py-1"
            >
              {subTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setSubs(subFields.filter((_, j) => j !== i))}
              className="border-hairline text-coral-dark rounded-full border px-2"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() =>
          setSubs([
            ...subFields,
            {
              key: `f${subFields.length + 1}`,
              label: `Field ${subFields.length + 1}`,
              type: "SHORT_TEXT",
            },
          ])
        }
        className="border-hairline bg-canvas text-caption-bold text-charcoal hover:bg-surface inline-flex rounded-full border px-3 py-1"
      >
        + Add sub-field
      </button>
    </div>
  );
}

function ComputedEditor({
  field,
  onChange,
}: {
  field: FieldDef;
  onChange: (patch: Partial<FieldDef>) => void;
}) {
  const formulaText = field.computedFormula
    ? JSON.stringify(field.computedFormula, null, 2)
    : "";
  return (
    <details className="border-hairline bg-surface-soft rounded-md border p-3">
      <summary className="text-ink cursor-pointer font-semibold">
        Computed formula (JSON)
      </summary>
      <p className="text-caption text-stone mt-2">
        Expression DSL —{" "}
        {`{op: "+", left: { field: "a" }, right: { field: "b" }}`}, etc.
      </p>
      <textarea
        value={formulaText}
        onChange={(e) => {
          const text = e.target.value.trim();
          if (!text) return onChange({ computedFormula: undefined });
          try {
            const parsed = JSON.parse(text);
            onChange({ computedFormula: parsed });
          } catch {
            // Ignore parse errors while user is typing.
          }
        }}
        rows={6}
        spellCheck={false}
        className="border-hairline-strong bg-canvas text-caption text-ink mt-2 w-full rounded-md border px-2 py-1.5 font-mono"
        placeholder='{"op": "+", "left": {"field": "a"}, "right": {"field": "b"}}'
      />
    </details>
  );
}
