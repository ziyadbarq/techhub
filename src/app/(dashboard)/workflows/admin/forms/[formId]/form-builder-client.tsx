"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Bell,
  Users,
  Eye,
  EyeOff,
  GitBranch,
  GripVertical,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";

import { confirm } from "@/components/design";
import { FormRenderer } from "@/components/workflows/form-renderer";
import { FormAiAssistant } from "@/components/workflows/form-ai-assistant";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
  FIELD_TYPE_GROUPS,
  FIELD_TYPE_META,
  fieldKeyFromLabel,
  fieldTypeMeta,
  renameFieldRefs,
} from "./field-types";
import { LaunchPath, type LaunchStep } from "./launch-path";
import {
  fieldKeyFromServiceSlugKey,
  isAccessServiceField,
  serviceSlugKey,
} from "@/core/domain/workflow/service-condition";

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

const FIELD_TYPES: ReadonlyArray<{ value: string; label: string }> =
  FIELD_TYPE_META.map(({ value, label }) => ({ value, label }));

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

type Snapshot = {
  fields: FieldDef[];
  perStepFieldState: Record<string, Record<string, FieldStateValue>>;
};

const snapshotOf = (s: Snapshot) =>
  JSON.stringify({
    fields: s.fields ?? [],
    perStepFieldState: s.perStepFieldState ?? {},
  });

/** Fields an employee actually fills in (headings and lookups-only excluded). */
const INPUT_EXCLUDED = new Set(["SECTION_HEADER", "SYSTEM_FIELD", "COMPUTED"]);

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
  const [saved, setSaved] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workflowDefinitionId, setWorkflowDefinitionId] = useState<string>(
    form.workflowDefinition.id,
  );
  const [tab, setTab] = useState<"editor" | "preview" | "settings">("editor");
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  /** Bumped when the author picks a field, so its editor starts fresh. */
  const [selection, setSelection] = useState(0);
  const selectField = (key: string | null) => {
    setSelectedFieldKey(key);
    setSelection((n) => n + 1);
  };
  const [paletteQuery, setPaletteQuery] = useState("");
  /** Fields added in this session: their key follows the label until published. */
  const [freshKeys, setFreshKeys] = useState<ReadonlySet<string>>(new Set());

  // Form metadata edits
  const [name, setName] = useState(form.name);
  const [description, setDescription] = useState(form.description ?? "");
  const [isActive, setIsActive] = useState(form.isActive);
  const [refFormat, setRefFormat] = useState(form.referenceNumberFormat);

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
          body.message || body.error || "Could not change the approval path",
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(
          `/api/workflow/admin/forms/${form.id}/draft`,
        );
        if (!response.ok) throw new Error("The form couldn't be loaded.");
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
          const loadedFields = body.draft.schemaJson.fields ?? [];
          const loadedState = body.draft.schemaJson.perStepFieldState ?? {};
          setFields(loadedFields);
          setPerStepFieldState(loadedState);
          setSaved(
            snapshotOf({
              fields: loadedFields,
              perStepFieldState: loadedState,
            }),
          );
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

  const current = snapshotOf({ fields, perStepFieldState });
  const dirty = loaded && current !== saved;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const publishedSnapshot = useMemo(() => {
    const schema = form.publishedVersion?.schemaJson as
      Partial<Snapshot> | undefined;
    return schema
      ? snapshotOf({
          fields: schema.fields ?? [],
          perStepFieldState: schema.perStepFieldState ?? {},
        })
      : null;
  }, [form.publishedVersion]);
  const publishedKeys = useMemo(() => {
    const schema = form.publishedVersion?.schemaJson as
      Partial<Snapshot> | undefined;
    return new Set((schema?.fields ?? []).map((f) => f.key));
  }, [form.publishedVersion]);
  const unpublishedChanges =
    publishedSnapshot === null || current !== publishedSnapshot;

  const workflow = workflows.find((w) => w.id === workflowDefinitionId) ?? {
    id: workflowDefinitionId,
    name: form.workflowDefinition.name,
    publishedVersionNumber: null,
  };
  const inputFieldCount = fields.filter(
    (f) => !INPUT_EXCLUDED.has(f.type),
  ).length;
  const duplicateKeys =
    fields.length !== new Set(fields.map((f) => f.key)).size;
  const unlabelled = fields.filter(
    (f) => f.type !== "SECTION_HEADER" && !f.label.trim(),
  ).length;
  const optionless = fields.filter(
    (f) =>
      (f.type === "DROPDOWN" ||
        f.type === "RADIO" ||
        f.type === "MULTI_SELECT") &&
      !(
        Array.isArray(f.config?.options) &&
        (f.config?.options as unknown[]).length > 0
      ),
  );

  const formProblems = [
    inputFieldCount === 0 ? "Add at least one field employees fill in." : null,
    duplicateKeys
      ? "Two fields share the same key (Advanced → Field key)."
      : null,
    unlabelled ? `${unlabelled} field(s) have no label.` : null,
    optionless.length
      ? `“${optionless[0]!.label}” has no options to choose from.`
      : null,
  ].filter((p): p is string => p !== null);

  const isLive =
    !!form.publishedVersion &&
    !!workflow.publishedVersionNumber &&
    isActive &&
    !unpublishedChanges &&
    !dirty;

  const steps: LaunchStep[] = [
    {
      id: "details",
      title: "Details",
      state: name.trim() ? (description.trim() ? "done" : "todo") : "warning",
      detail: description.trim()
        ? "Name and description shown in Browse forms."
        : "Add a short description so employees pick the right form.",
      action: description.trim()
        ? undefined
        : { label: "Add description", onClick: () => setTab("settings") },
    },
    {
      id: "fields",
      title: "Fields",
      state:
        formProblems.length === 0
          ? "done"
          : inputFieldCount === 0
            ? "todo"
            : "warning",
      detail:
        formProblems[0] ??
        `${inputFieldCount} field${inputFieldCount === 1 ? "" : "s"} to fill in.`,
      action:
        tab !== "editor"
          ? { label: "Edit fields", onClick: () => setTab("editor") }
          : undefined,
    },
    {
      id: "path",
      title: "Approval path",
      state: workflow.publishedVersionNumber ? "done" : "warning",
      detail: workflow.publishedVersionNumber
        ? `${workflow.name} (published).`
        : `${workflow.name} isn't published, so requests can't be submitted yet.`,
      action: {
        label: workflow.publishedVersionNumber
          ? "Open path"
          : "Open and publish the path",
        href: `/workflows/designer/${workflow.id}`,
      },
    },
    {
      id: "publish",
      title: "Publish",
      state: !form.publishedVersion
        ? "todo"
        : unpublishedChanges || dirty
          ? "warning"
          : isActive
            ? "done"
            : "warning",
      detail: !form.publishedVersion
        ? "Not published yet."
        : !isActive
          ? "Published, but the form is switched off in Settings."
          : unpublishedChanges || dirty
            ? `Changes not published yet. Live: v${form.publishedVersion.versionNumber}.`
            : `Version ${form.publishedVersion.versionNumber} is live.`,
    },
  ];

  const selectedField = fields.find((f) => f.key === selectedFieldKey) ?? null;

  function addField(type: string) {
    const meta = fieldTypeMeta(type);
    const label = meta.label;
    const newField: FieldDef = {
      key: uniqueKey(fields, fieldKeyFromLabel(label)),
      label,
      type,
      required: false,
      position: fields.length + 1,
    };
    setFields([...fields, newField]);
    setFreshKeys(new Set([...freshKeys, newField.key]));
    selectField(newField.key);
  }

  /** Rename a key and every place that refers to it. */
  function renameKey(list: FieldDef[], from: string, to: string): FieldDef[] {
    return list.map((f) => {
      const renamed = f.key === from ? { ...f, key: to } : f;
      return {
        ...renamed,
        visibilityRules: renameFieldRefs(renamed.visibilityRules, from, to),
        computedFormula: renameFieldRefs(renamed.computedFormula, from, to),
      };
    });
  }

  function updateField(originalKey: string, patch: Partial<FieldDef>) {
    let nextKey = patch.key ?? originalKey;
    // A brand-new field's key follows its label, so nobody has to invent one.
    if (
      patch.label !== undefined &&
      patch.key === undefined &&
      freshKeys.has(originalKey) &&
      !publishedKeys.has(originalKey)
    ) {
      const others = fields.filter((f) => f.key !== originalKey);
      nextKey = uniqueKey(others, fieldKeyFromLabel(patch.label));
    }
    let next = fields.map((f) =>
      f.key === originalKey ? { ...f, ...patch, key: originalKey } : f,
    );
    if (nextKey !== originalKey) {
      if (fields.some((f) => f.key === nextKey && f.key !== originalKey)) {
        setError(`Another field already uses the key “${nextKey}”.`);
        return;
      }
      next = renameKey(next, originalKey, nextKey);
      const nextState: Record<string, Record<string, FieldStateValue>> = {};
      for (const [step, byField] of Object.entries(perStepFieldState)) {
        const copy = { ...byField };
        if (originalKey in copy) {
          copy[nextKey] = copy[originalKey]!;
          delete copy[originalKey];
        }
        nextState[step] = copy;
      }
      setPerStepFieldState(nextState);
      if (freshKeys.has(originalKey)) {
        const fresh = new Set(freshKeys);
        fresh.delete(originalKey);
        fresh.add(nextKey);
        setFreshKeys(fresh);
      }
      setSelectedFieldKey(nextKey);
    }
    setFields(next);
  }

  async function deleteField(field: FieldDef) {
    if (
      publishedKeys.has(field.key) &&
      !(await confirm({
        title: `Remove “${field.label || field.key}”?`,
        message:
          "It disappears from new requests once you publish. Requests already submitted keep their answers.",
        confirmLabel: "Remove",
      }))
    )
      return;
    setFields(
      fields
        .filter((f) => f.key !== field.key)
        .map((f, i) => ({ ...f, position: i + 1 })),
    );
    if (selectedFieldKey === field.key) setSelectedFieldKey(null);
  }

  function moveField(key: string, dir: -1 | 1) {
    const idx = fields.findIndex((f) => f.key === key);
    if (idx === -1) return;
    const target = idx + dir;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[idx], next[target]] = [next[target]!, next[idx]!];
    setFields(next.map((f, i) => ({ ...f, position: i + 1 })));
  }

  async function saveDraft(): Promise<boolean> {
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
        throw new Error(
          body.message || body.error || "The draft couldn't be saved.",
        );
      }
      setSaved(current);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function publish() {
    const pathWarning = workflow.publishedVersionNumber
      ? ""
      : ` Note: the approval path “${workflow.name}” isn't published yet, so employees can't submit until it is.`;
    if (
      !(await confirm({
        title: form.publishedVersion
          ? "Publish these changes?"
          : "Publish this form?",
        message:
          "New requests use this version straight away. Requests already submitted keep the version they started with." +
          pathWarning,
        confirmLabel: "Publish",
      }))
    )
      return;
    if (!(await saveDraft())) return;
    setBusy("publish");
    setError(null);
    try {
      const response = await fetch(
        `/api/workflow/admin/forms/${form.id}/publish`,
        { method: "POST" },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          body.message || body.error || "The form couldn't be published.",
        );
      }
      setFreshKeys(new Set());
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

  if (!loaded)
    return (
      <p className="text-stone flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading the form…
      </p>
    );

  const query = paletteQuery.trim().toLowerCase();
  const paletteMatches = FIELD_TYPE_META.filter(
    (meta) =>
      !query ||
      meta.label.toLowerCase().includes(query) ||
      meta.hint.toLowerCase().includes(query),
  );
  const publishBlocked = formProblems.length > 0 || (form.isBuiltIn ?? false);
  const nothingToPublish =
    !!form.publishedVersion && !unpublishedChanges && !dirty;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-stone text-xs font-semibold tracking-[0.06em] uppercase">
            Request type
          </p>
          <h1 className="text-ink mt-1 text-2xl font-semibold">
            {name || form.name}
          </h1>
          {description ? (
            <p className="text-stone mt-1 max-w-2xl text-sm">{description}</p>
          ) : null}
          <p className="text-stone mt-2 text-xs">
            {dirty ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{" "}
                Unsaved changes
              </span>
            ) : (
              "All changes saved as a draft"
            )}
            {busy === "workflow" ? " · Changing the approval path…" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/workflows/admin/forms/${form.id}/notifications`}
            className="border-hairline-strong hover:bg-surface inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium"
          >
            <Bell className="h-4 w-4" /> Notifications
          </Link>
          <Link
            href={`/workflows/admin/forms/${form.id}/people`}
            className="border-hairline-strong hover:bg-surface inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium"
          >
            <Users className="h-4 w-4" /> People
          </Link>
          <button
            type="button"
            onClick={() => setAiOpen((v) => !v)}
            className="border-hairline-strong hover:bg-surface inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium"
          >
            <Sparkles className="h-4 w-4" /> Draft with AI
          </button>
          <button
            type="button"
            onClick={() => void saveDraft()}
            disabled={!!busy || !dirty}
            className="border-hairline-strong hover:bg-surface rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            {busy === "save" ? "Saving…" : "Save draft"}
          </button>
          <button
            type="button"
            onClick={() => void publish()}
            disabled={!!busy || publishBlocked || nothingToPublish}
            title={
              publishBlocked
                ? (formProblems[0] ?? "Built-in forms can't be changed.")
                : nothingToPublish
                  ? "Everything is already published."
                  : undefined
            }
            className="bg-ink text-canvas rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy === "publish" ? "Publishing…" : "Publish"}
          </button>
        </div>
      </header>

      <LaunchPath
        steps={steps}
        live={isLive}
        formId={form.id}
        formName={name || form.name}
      />

      {error ? (
        <div
          role="alert"
          className="rounded-lg bg-rose-100 px-4 py-3 text-sm text-rose-800 dark:bg-rose-400/15 dark:text-rose-300"
        >
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

      <div
        role="tablist"
        aria-label="Form sections"
        className="border-hairline-soft flex gap-1 border-b"
      >
        {(
          [
            ["editor", "Fields"],
            ["preview", "Preview as employee"],
            ["settings", "Settings"],
          ] as const
        ).map(([key, label]) => (
          <TabButton key={key} active={tab === key} onClick={() => setTab(key)}>
            {label}
          </TabButton>
        ))}
      </div>

      {tab === "editor" ? (
        <div className="grid items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)_360px]">
          {/* Left: grouped field palette */}
          <aside className="border-hairline bg-canvas rounded-xl border p-3 lg:sticky lg:top-4">
            <h3 className="text-ink px-1 text-sm font-semibold">Add a field</h3>
            <div className="relative mt-2">
              <Search className="text-stone absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
              <Input
                value={paletteQuery}
                onChange={(event) => setPaletteQuery(event.target.value)}
                placeholder="Search field types"
                aria-label="Search field types"
                className="h-8 pl-8 text-xs"
              />
            </div>
            <div className="mt-2 max-h-[calc(100vh-12rem)] space-y-3 overflow-y-auto pr-1">
              {FIELD_TYPE_GROUPS.map((group) => {
                const items = paletteMatches.filter(
                  (meta) => meta.group === group,
                );
                if (items.length === 0) return null;
                return (
                  <div key={group}>
                    <p className="text-stone px-1 pb-1 text-[11px] font-semibold tracking-[0.05em] uppercase">
                      {group}
                    </p>
                    <div className="space-y-0.5">
                      {items.map((meta) => {
                        const Icon = meta.icon;
                        return (
                          <button
                            key={meta.value}
                            type="button"
                            onClick={() => addField(meta.value)}
                            className="hover:bg-surface flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition-colors"
                          >
                            <span className="border-hairline-soft bg-canvas text-ink flex h-7 w-7 shrink-0 items-center justify-center rounded-md border">
                              <Icon className="h-3.5 w-3.5" strokeWidth={1.9} />
                            </span>
                            <span className="min-w-0">
                              <span className="text-ink block text-xs font-medium">
                                {meta.label}
                              </span>
                              <span className="text-stone block truncate text-[11px]">
                                {meta.hint}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {paletteMatches.length === 0 ? (
                <p className="text-stone px-1 py-4 text-center text-xs">
                  No field type matches.
                </p>
              ) : null}
            </div>
          </aside>

          {/* Middle: the form as employees will fill it */}
          <section className="border-hairline bg-canvas rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-ink text-sm font-semibold">
                Fields{" "}
                <span className="text-stone ml-1 font-normal">
                  ({fields.length})
                </span>
              </h3>
              {fields.length > 1 ? (
                <span className="text-stone text-xs">Drag to reorder</span>
              ) : null}
            </div>
            {fields.length === 0 ? (
              <div className="border-hairline-strong mt-4 rounded-xl border border-dashed px-6 py-12 text-center">
                <p className="text-ink text-sm font-semibold">No fields yet</p>
                <p className="text-stone mx-auto mt-1 max-w-sm text-xs leading-5">
                  Pick a field type on the left, or use “Draft with AI” to
                  describe the form in a sentence.
                </p>
              </div>
            ) : (
              <ol className="mt-3 space-y-1.5">
                {fields.map((f, i) => {
                  const meta = fieldTypeMeta(f.type);
                  const Icon = meta.icon;
                  const selected = selectedFieldKey === f.key;
                  const hasLogic = !!f.visibilityRules;
                  if (f.type === "SECTION_HEADER") {
                    return (
                      <li
                        key={f.key}
                        draggable
                        onDragStart={(e) => {
                          setDragKey(f.key);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (dragKey && dragKey !== f.key)
                            setDragOverKey(f.key);
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
                        className={cn(
                          "group flex items-center gap-2 rounded-lg px-1 pt-3 pb-1",
                          dragOverKey === f.key && "ring-ink/20 ring-2",
                        )}
                      >
                        <GripVertical
                          className="text-stone h-4 w-4 cursor-grab"
                          aria-hidden
                        />
                        <button
                          type="button"
                          onClick={() => selectField(f.key)}
                          className={cn(
                            "text-ink flex-1 truncate border-b pb-1 text-left text-xs font-semibold tracking-[0.05em] uppercase",
                            selected ? "border-ink" : "border-hairline",
                          )}
                        >
                          {f.label || "Untitled section"}
                        </button>
                        <FieldRowActions
                          index={i}
                          count={fields.length}
                          onMove={(dir) => moveField(f.key, dir)}
                          onDelete={() => void deleteField(f)}
                        />
                      </li>
                    );
                  }
                  return (
                    <li
                      key={f.key}
                      draggable
                      onDragStart={(e) => {
                        setDragKey(f.key);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (dragKey && dragKey !== f.key) setDragOverKey(f.key);
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
                      className={cn(
                        "group flex items-center gap-2 rounded-lg border px-2 py-2 transition",
                        selected
                          ? "border-ink bg-surface/60"
                          : "border-hairline-soft hover:border-hairline-strong",
                        dragKey === f.key && "opacity-40",
                        dragOverKey === f.key && "ring-ink/20 ring-2",
                      )}
                    >
                      <GripVertical
                        className="text-stone h-4 w-4 shrink-0 cursor-grab"
                        aria-hidden
                      />
                      <button
                        type="button"
                        onClick={() => selectField(f.key)}
                        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                      >
                        <span className="bg-surface text-ink flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                          <Icon className="h-4 w-4" strokeWidth={1.9} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="text-ink block truncate text-sm font-medium">
                            {f.label || (
                              <span className="text-amber-700 dark:text-amber-300">
                                No label
                              </span>
                            )}
                            {f.required ? (
                              <span className="text-coral-dark ml-0.5">*</span>
                            ) : null}
                          </span>
                          <span className="text-stone flex flex-wrap items-center gap-x-2 text-xs">
                            {meta.label}
                            {f.visibility === "HIDDEN" ? (
                              <span className="inline-flex items-center gap-1">
                                <EyeOff className="h-3 w-3" /> Hidden
                              </span>
                            ) : f.visibility === "ADMINISTRATIVE" ? (
                              <span className="inline-flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3" /> Reviewers
                                only
                              </span>
                            ) : null}
                            {hasLogic ? (
                              <span className="inline-flex items-center gap-1">
                                <GitBranch className="h-3 w-3" /> Shown when…
                              </span>
                            ) : null}
                          </span>
                        </span>
                      </button>
                      <FieldRowActions
                        index={i}
                        count={fields.length}
                        onMove={(dir) => moveField(f.key, dir)}
                        onDelete={() => void deleteField(f)}
                      />
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          {/* Right: field settings */}
          <aside className="border-hairline bg-canvas rounded-xl border p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
            {selectedField ? (
              <>
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = fieldTypeMeta(selectedField.type).icon;
                    return <Icon className="text-stone h-4 w-4" />;
                  })()}
                  <h3 className="text-ink text-sm font-semibold">
                    {fieldTypeMeta(selectedField.type).label}
                  </h3>
                </div>
                <FieldEditor
                  key={selection}
                  field={selectedField}
                  onChange={(patch) => updateField(selectedField.key, patch)}
                  fieldList={fields}
                  siblingForms={siblingForms}
                />
              </>
            ) : (
              <div className="py-6 text-center">
                <Eye className="text-stone mx-auto h-5 w-5" />
                <p className="text-ink mt-2 text-sm font-semibold">
                  Select a field
                </p>
                <p className="text-stone mt-1 text-xs leading-5">
                  Change its label, make it required, or show it only when
                  another answer matches.
                </p>
              </div>
            )}
          </aside>
        </div>
      ) : tab === "preview" ? (
        <div className="border-hairline bg-canvas mx-auto max-w-3xl rounded-xl border p-6">
          <p className="text-stone text-xs">
            What an employee sees when filling it in (read-only).
          </p>
          <h2 className="text-ink mt-3 text-xl font-semibold">
            {name || form.name}
          </h2>
          {description ? (
            <p className="text-stone mt-1 text-sm">{description}</p>
          ) : null}
          <div className="mt-5">
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
          workflows={workflows}
          workflowId={workflowDefinitionId}
          onChangeWorkflow={(id) => void changeWorkflow(id)}
          workflowBusy={busy === "workflow"}
        />
      )}
    </div>
  );
}

function FieldRowActions({
  index,
  count,
  onMove,
  onDelete,
}: {
  index: number;
  count: number;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 opacity-60 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
      <button
        type="button"
        onClick={() => onMove(-1)}
        disabled={index === 0}
        aria-label="Move up"
        className="text-stone hover:text-ink rounded p-1 disabled:opacity-30"
      >
        <ArrowUp className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onMove(1)}
        disabled={index === count - 1}
        aria-label="Move down"
        className="text-stone hover:text-ink rounded p-1 disabled:opacity-30"
      >
        <ArrowDown className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Remove field"
        className="text-stone hover:text-coral-dark rounded p-1"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
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
  workflows,
  workflowId,
  onChangeWorkflow,
  workflowBusy,
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
  workflows: WorkflowOption[];
  workflowId: string;
  onChangeWorkflow: (id: string) => void;
  workflowBusy: boolean;
}) {
  const chosen = workflows.find((w) => w.id === workflowId);
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Left: editable settings (2 cols) */}
      <div className="space-y-4 lg:col-span-2">
        <div className="border-hairline bg-canvas rounded-xl border p-5">
          <h2 className="text-h5 text-ink">Approval path</h2>
          <p className="text-caption text-stone mt-0.5">
            The workflow every new request of this type follows. Requests
            already submitted keep the path they started on.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="min-w-64 flex-1">
              <Select
                value={workflowId}
                onValueChange={onChangeWorkflow}
                disabled={workflowBusy || isBuiltIn}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {workflows.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                      {w.publishedVersionNumber ? "" : " · not published"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Link
              href={`/workflows/designer/${workflowId}`}
              className="border-hairline-strong hover:bg-surface rounded-lg border px-3 py-2 text-sm font-medium"
            >
              Open path
            </Link>
          </div>
          {chosen && !chosen.publishedVersionNumber ? (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
              This path isn&apos;t published, so employees can&apos;t submit
              yet.
            </p>
          ) : null}
        </div>

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
                Example:{" "}
                <span className="text-ink font-mono">
                  {exampleReference(refFormat)}
                </span>
                {" · "}Tokens: <code>{"{YYYY}"}</code>, <code>{"{YY}"}</code>,{" "}
                <code>{"{MM}"}</code>, <code>{"{DD}"}</code>,{" "}
                <code>{"{seq:04}"}</code>. A request keeps its number for life.
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
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300"
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
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-300"
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
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">
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
      type="button"
      role="tab"
      aria-selected={active}
      className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-ink text-ink"
          : "text-stone hover:text-ink border-transparent"
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
    <div className="text-caption mt-3 space-y-3">
      <label className="block">
        <span className="text-stone">
          {field.type === "SECTION_HEADER"
            ? "Section title"
            : "Question / label"}
        </span>
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
        field.type === "RADIO" ||
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

      <FieldKeyEditor
        key={field.key}
        fieldKey={field.key}
        onRename={(key) => onChange({ key })}
      />
    </div>
  );
}

/** The technical key, tucked away: renaming it updates every reference. */
function FieldKeyEditor({
  fieldKey,
  onRename,
}: {
  fieldKey: string;
  onRename: (key: string) => void;
}) {
  const [draft, setDraft] = useState(fieldKey);
  return (
    <details className="group border-hairline-soft border-t pt-3">
      <summary className="text-stone hover:text-ink cursor-pointer text-xs font-medium select-none">
        Advanced
      </summary>
      <label className="mt-2 block">
        <span className="text-stone">Field key</span>
        <div className="mt-1 flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="border-hairline-strong bg-canvas text-body-sm text-ink w-full rounded-md border px-2 py-1.5 font-mono"
          />
          <button
            type="button"
            disabled={!draft.trim() || fieldKeyFromLabel(draft) === fieldKey}
            onClick={() => {
              const clean = fieldKeyFromLabel(draft);
              setDraft(clean);
              onRename(clean);
            }}
            className="border-hairline-strong hover:bg-surface rounded-md border px-2.5 text-xs font-medium disabled:opacity-40"
          >
            Rename
          </button>
        </div>
        <span className="text-stone mt-1 block">
          Used by reports, conditions and the approval path. Conditions and
          field visibility update automatically.
        </span>
      </label>
    </details>
  );
}

function exampleReference(format: string): string {
  const now = new Date();
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return format
    .replace(/\{YYYY\}/g, String(now.getFullYear()))
    .replace(/\{YY\}/g, pad(now.getFullYear() % 100))
    .replace(/\{MM\}/g, pad(now.getMonth() + 1))
    .replace(/\{DD\}/g, pad(now.getDate()))
    .replace(/\{seq:0?(\d+)\}/g, (_m, width: string) => pad(1, Number(width)))
    .replace(/\{seq\}/g, "1");
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
      // "service#slug" is edited as the service field itself.
      fieldKey: fieldKeyFromServiceSlugKey(left.field) ?? left.field,
      op: rec.op as LogicRule["op"],
      value:
        right?.const === undefined || right.const === null
          ? ""
          : String(right.const),
    });
  }
  return { combinator, rules };
}

function logicToExpr(
  state: LogicState,
  serviceFieldKeys: ReadonlySet<string> = new Set(),
): unknown {
  const arr = state.rules.map((r) => ({
    op: r.op,
    // A service field is compared by the service's slug, which is the same
    // in every environment (its id is not).
    left: {
      field: serviceFieldKeys.has(r.fieldKey)
        ? serviceSlugKey(r.fieldKey)
        : r.fieldKey,
    },
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
  const serviceFieldKeys = new Set(
    peers.filter((f) => isAccessServiceField(f)).map((f) => f.key),
  );

  // Services to pick from when a rule looks at a service field.
  const [services, setServices] = useState<
    Array<{ slug: string; label: string }>
  >([]);
  const needsServices = serviceFieldKeys.size > 0;
  useEffect(() => {
    if (!needsServices) return;
    let cancelled = false;
    fetch("/api/workflow/lookups/ACCESS_SERVICES?q=&limit=50")
      .then((r) => (r.ok ? r.json() : { results: [] }))
      .then(
        (data: {
          results?: Array<{
            label: string;
            publicMetadata?: { slug?: string };
          }>;
        }) => {
          if (cancelled) return;
          setServices(
            (data.results ?? [])
              .filter((o) => o.publicMetadata?.slug)
              .map((o) => ({ slug: o.publicMetadata!.slug!, label: o.label })),
          );
        },
      )
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, [needsServices]);

  const persist = (next: LogicState | null) => {
    if (!next || next.rules.length === 0) {
      onChange({ visibilityRules: undefined });
    } else {
      onChange({
        visibilityRules: logicToExpr(next, serviceFieldKeys) as never,
      });
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
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-800 uppercase dark:bg-amber-400/15 dark:text-amber-300">
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
                    {(serviceFieldKeys.has(r.fieldKey)
                      ? (["==", "!="] as LogicRule["op"][])
                      : (Object.keys(OP_LABELS) as LogicRule["op"][])
                    ).map((op) => (
                      <option key={op} value={op}>
                        {serviceFieldKeys.has(r.fieldKey)
                          ? op === "=="
                            ? "is"
                            : "is not"
                          : OP_LABELS[op]}
                      </option>
                    ))}
                  </select>
                  {serviceFieldKeys.has(r.fieldKey) ? (
                    <select
                      value={r.value}
                      onChange={(e) => updateRule(i, { value: e.target.value })}
                      aria-label="Service"
                      className="border-hairline bg-canvas text-caption text-ink min-w-0 flex-1 rounded-md border px-2 py-1"
                    >
                      <option value="">Choose a service…</option>
                      {services.map((svc) => (
                        <option key={svc.slug} value={svc.slug}>
                          {svc.label}
                        </option>
                      ))}
                      {r.value &&
                      !services.some((svc) => svc.slug === r.value) ? (
                        <option value={r.value}>
                          {r.value} (not in this environment)
                        </option>
                      ) : null}
                    </select>
                  ) : (
                    <input
                      value={r.value}
                      onChange={(e) => updateRule(i, { value: e.target.value })}
                      placeholder="value"
                      className="border-hairline bg-canvas text-caption text-ink min-w-0 flex-1 rounded-md border px-2 py-1"
                    />
                  )}
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
                      updateRule(i, {
                        fieldKey: e.target.value,
                        op: "==",
                        value: "",
                      })
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
