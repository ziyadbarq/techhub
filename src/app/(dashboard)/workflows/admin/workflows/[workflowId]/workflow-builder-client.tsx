"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Bell,
  CheckCircle2,
  Clock,
  Cog,
  GitBranch,
  Hourglass,
  Info,
  Play,
  Trash2,
  Webhook,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import { confirm } from "@/components/design";
import { StepFieldVisibilityCard } from "@/components/workflows/step-field-visibility-card";
import { formatTime } from "@/lib/utils/date-format";
import { WorkflowAiAssistant } from "@/components/workflows/workflow-ai-assistant";

interface Definition {
  id: string;
  name: string;
  description: string | null;
  publishedVersionNumber: number | null;
  formCount: number;
}

interface User {
  id: string;
  name: string | null;
  email: string;
}
interface Role {
  id: string;
  name: string;
}

type StepType =
  | "APPROVAL"
  | "EXECUTION"
  | "INFO_ACK"
  | "AUTOMATION"
  | "NOTIFICATION"
  | "CONDITIONAL_BRANCH"
  | "DELAY"
  | "SCHEDULE"
  | "WEBHOOK"
  | "SUB_WORKFLOW";

interface Assignee {
  kind:
    | "USER"
    | "ROLE"
    | "REQUESTER"
    | "FIELD_USER"
    | "REQUESTER_MANAGER"
    | "ACCESS_SERVICE_ROLE"
    | "FALLBACK";
  userId?: string;
  roleId?: string;
  fieldKey?: string;
  /** ACCESS_SERVICE_ROLE: field key of the LOOKUP[ACCESS_SERVICES] field */
  serviceSnapshotKey?: string;
  /** ACCESS_SERVICE_ROLE: role within the service */
  serviceRole?: "OWNER" | "CYBERSECURITY" | "IMPLEMENTER";
  /** FALLBACK: primary spec (simplified — only REQUESTER_MANAGER supported here) */
  primary?: { kind: "REQUESTER_MANAGER" };
  /** FALLBACK: USER_PICKER field key to use when primary resolves empty */
  fallbackFieldKey?: string;
  /** FALLBACK: expression field key that forces fallback when non-empty */
  forceFallbackWhenField?: string;
}

interface StepDef {
  key: string;
  type: StepType;
  position: number;
  // APPROVAL steps branch per action; everything else follows one default
  // edge. Readers narrow with `"default" in next` before reading either.
  next?: { default?: string } | { onAction: Record<string, string> };
  config: Record<string, unknown>;
}

interface Graph {
  start: string;
  steps: StepDef[];
}

interface StepTypeMeta {
  value: StepType;
  label: string;
  icon: LucideIcon;
  category: "Human" | "Automation" | "Routing";
  hint: string;
}

const STEP_TYPES: ReadonlyArray<StepTypeMeta> = [
  {
    value: "APPROVAL",
    label: "Approval",
    icon: CheckCircle2,
    category: "Human",
    hint: "Approver decides approve/reject",
  },
  {
    value: "EXECUTION",
    label: "Execution",
    icon: Play,
    category: "Human",
    hint: "Assignee marks the work complete",
  },
  {
    value: "INFO_ACK",
    label: "Info / Ack",
    icon: Info,
    category: "Human",
    hint: "User reads & acknowledges",
  },
  {
    value: "AUTOMATION",
    label: "Automation",
    icon: Cog,
    category: "Automation",
    hint: "Engine runs a registered handler",
  },
  {
    value: "NOTIFICATION",
    label: "Notification",
    icon: Bell,
    category: "Automation",
    hint: "Send a templated email, no action",
  },
  {
    value: "WEBHOOK",
    label: "Webhook",
    icon: Webhook,
    category: "Automation",
    hint: "Call external HTTP endpoint",
  },
  {
    value: "CONDITIONAL_BRANCH",
    label: "Conditional branch",
    icon: GitBranch,
    category: "Routing",
    hint: "Route by field-value rules",
  },
  {
    value: "DELAY",
    label: "Delay",
    icon: Hourglass,
    category: "Routing",
    hint: "Wait N business days/hours",
  },
  {
    value: "SCHEDULE",
    label: "Schedule",
    icon: Clock,
    category: "Routing",
    hint: "Wait for window respecting blackouts",
  },
  {
    value: "SUB_WORKFLOW",
    label: "Sub-workflow",
    icon: Workflow,
    category: "Routing",
    hint: "Submit a child request and wait",
  },
];

function metaFor(type: StepType): StepTypeMeta {
  return STEP_TYPES.find((t) => t.value === type) ?? STEP_TYPES[0]!;
}

const TYPE_TONE: Record<StepType, string> = {
  APPROVAL: "bg-yellow-light text-yellow-dark",
  EXECUTION: "bg-mint-light text-moss-dark",
  INFO_ACK: "bg-sky-light text-blue-pressed",
  AUTOMATION: "bg-surface-featured text-ink",
  NOTIFICATION: "bg-rose-light text-coral-dark",
  CONDITIONAL_BRANCH: "bg-blush-light text-coral-dark",
  DELAY: "bg-sand-light text-charcoal",
  SCHEDULE: "bg-sand-light text-charcoal",
  WEBHOOK: "bg-lilac-light text-ink",
  SUB_WORKFLOW: "bg-teal-light text-moss-dark",
};

function uniqueKey(steps: StepDef[], base: string): string {
  let n = 1;
  let candidate = base;
  while (steps.some((s) => s.key === candidate)) {
    candidate = `${base}_${++n}`;
  }
  return candidate;
}

function defaultConfigFor(type: StepType): Record<string, unknown> {
  switch (type) {
    case "APPROVAL":
      return {
        type: "APPROVAL",
        assignees: [],
        multiAssigneePolicy: "ANY",
        allowReject: true,
      };
    case "EXECUTION":
      return { type: "EXECUTION", assignees: [{ kind: "REQUESTER" }] };
    case "INFO_ACK":
      return { type: "INFO_ACK", assignees: [] };
    case "AUTOMATION":
      return { type: "AUTOMATION", handler: "auto-approve" };
    case "NOTIFICATION":
      return { type: "NOTIFICATION", templateKey: "" };
    case "CONDITIONAL_BRANCH":
      return { type: "CONDITIONAL_BRANCH", branches: [] };
    case "DELAY":
      return { type: "DELAY", durationMs: 0 };
    case "SCHEDULE":
      return { type: "SCHEDULE" };
    case "WEBHOOK":
      return { type: "WEBHOOK", url: "", method: "POST", failOnError: true };
    case "SUB_WORKFLOW":
      return { type: "SUB_WORKFLOW", childFormId: "", waitForOutcome: true };
  }
}

type FieldStateValue = "EDITABLE" | "READ_ONLY" | "HIDDEN";

interface LinkedFormRef {
  id: string;
  name: string;
}

export function WorkflowBuilderClient({
  definition,
  users,
  roles,
  accessServiceNames,
  linkedForms = [],
}: {
  definition: Definition;
  users: User[];
  roles: Role[];
  accessServiceNames?: string[];
  linkedForms?: LinkedFormRef[];
}) {
  const router = useRouter();
  const [graph, setGraph] = useState<Graph>({ start: "", steps: [] });
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [tab, setTab] = useState<"steps" | "fieldState">("steps");
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(
          `/api/workflow/admin/workflows/${definition.id}/draft`,
        );
        if (!response.ok) throw new Error("Failed to load draft");
        const body = (await response.json()) as { draft: { graphJson: Graph } };
        if (!cancelled) {
          const g = body.draft.graphJson || { start: "", steps: [] };
          setGraph({
            start: g.start ?? "",
            steps: (g.steps ?? []).map((s, i) => ({
              ...s,
              position: s.position ?? i + 1,
            })),
          });
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
  }, [definition.id]);

  const selected = graph.steps.find((s) => s.key === selectedKey) ?? null;

  function addStep(type: StepType) {
    const baseKey = type.toLowerCase();
    const key = uniqueKey(graph.steps, baseKey);
    const newStep: StepDef = {
      key,
      type,
      position: graph.steps.length + 1,
      config: defaultConfigFor(type),
    };
    setGraph({
      start: graph.start || key,
      steps: [...graph.steps, newStep],
    });
    setSelectedKey(key);
  }

  function updateStep(originalKey: string, patch: Partial<StepDef>) {
    setGraph({
      ...graph,
      start:
        patch.key && originalKey === graph.start
          ? (patch.key as string)
          : graph.start,
      steps: graph.steps.map((s) =>
        s.key === originalKey ? { ...s, ...patch } : s,
      ),
    });
    if (patch.key) setSelectedKey(patch.key);
  }

  function deleteStep(key: string) {
    const next = graph.steps
      .filter((s) => s.key !== key)
      .map((s, i) => ({ ...s, position: i + 1 }));
    setGraph({
      start: graph.start === key ? (next[0]?.key ?? "") : graph.start,
      steps: next,
    });
    if (selectedKey === key) setSelectedKey(null);
  }

  function moveStep(key: string, dir: -1 | 1) {
    const idx = graph.steps.findIndex((s) => s.key === key);
    if (idx === -1) return;
    const target = idx + dir;
    if (target < 0 || target >= graph.steps.length) return;
    const next = [...graph.steps];
    [next[idx], next[target]] = [next[target], next[idx]];
    setGraph({
      ...graph,
      steps: next.map((s, i) => ({ ...s, position: i + 1 })),
    });
  }

  async function saveDraft() {
    setBusy("save");
    setError(null);
    try {
      const response = await fetch(
        `/api/workflow/admin/workflows/${definition.id}/draft`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(graph),
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
        title: "Publish workflow draft?",
        message:
          "Once published, this version is immutable. In-flight requests stay pinned to their original version.",
        confirmLabel: "Publish",
      }))
    )
      return;
    setBusy("publish");
    setError(null);
    try {
      await fetch(`/api/workflow/admin/workflows/${definition.id}/draft`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(graph),
      });
      const response = await fetch(
        `/api/workflow/admin/workflows/${definition.id}/publish`,
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

  if (!loaded) return <p className="text-stone text-sm">Loading draft…</p>;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{definition.name}</h1>
          <p className="text-stone text-sm">
            {definition.publishedVersionNumber
              ? `Published v${definition.publishedVersionNumber}`
              : "Not yet published"}{" "}
            · {definition.formCount} form(s) using this workflow
          </p>
        </div>
        <div className="flex gap-2">
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
            disabled={!!busy || graph.steps.length === 0 || !graph.start}
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
        <WorkflowAiAssistant
          existingStepKeys={graph.steps.map((s) => s.key)}
          workflowName={definition.name}
          workflowDescription={definition.description}
          roleNames={roles.map((r) => r.name)}
          accessServiceNames={accessServiceNames ?? []}
          onClose={() => setAiOpen(false)}
          onApply={(result) => {
            // Replaces the canvas with what the user just reviewed. Still a
            // local draft — Save draft and Publish stay manual.
            setGraph({
              start: result.start,
              steps: result.steps.map((step) => ({
                key: step.key,
                type: step.type as StepType,
                position: step.position,
                next: step.next,
                config: step.config,
              })),
            });
            setSelectedKey(result.start);
            setAiOpen(false);
          }}
        />
      ) : null}

      <div className="border-hairline-soft flex gap-1 border-b">
        <button
          onClick={() => setTab("steps")}
          className={`text-body-sm-medium relative px-3 py-2 transition ${
            tab === "steps" ? "text-ink" : "text-stone hover:text-ink"
          }`}
        >
          Steps
          {tab === "steps" ? (
            <span className="bg-brand-yellow-deep absolute right-0 -bottom-px left-0 h-0.5" />
          ) : null}
        </button>
        <button
          onClick={() => setTab("fieldState")}
          className={`text-body-sm-medium relative px-3 py-2 transition ${
            tab === "fieldState" ? "text-ink" : "text-stone hover:text-ink"
          }`}
        >
          Field state
          {linkedForms.length > 0 ? (
            <span className="bg-yellow-light text-yellow-dark ml-1.5 inline-flex h-4 items-center rounded-full px-1.5 text-[10px] font-semibold">
              {linkedForms.length} form
              {linkedForms.length === 1 ? "" : "s"}
            </span>
          ) : null}
          {tab === "fieldState" ? (
            <span className="bg-brand-yellow-deep absolute right-0 -bottom-px left-0 h-0.5" />
          ) : null}
        </button>
      </div>

      {tab === "fieldState" ? (
        <FieldStateTab linkedForms={linkedForms} steps={graph.steps} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Left: palette grouped by category */}
          <aside className="border-hairline bg-canvas rounded-xl border p-4 lg:col-span-3">
            <h3 className="text-body-sm-medium text-ink">Add step</h3>
            <div className="mt-3 space-y-4">
              {(["Human", "Automation", "Routing"] as const).map((cat) => (
                <div key={cat}>
                  <p className="text-stone mb-1.5 text-[11px] font-semibold tracking-[0.05em] uppercase">
                    {cat}
                  </p>
                  <div className="space-y-1">
                    {STEP_TYPES.filter((t) => t.category === cat).map((t) => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.value}
                          onClick={() => addStep(t.value)}
                          title={t.hint}
                          className="group border-hairline-soft bg-canvas text-body-sm text-charcoal hover:border-hairline-strong hover:bg-surface flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left transition"
                        >
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${TYPE_TONE[t.value]}`}
                          >
                            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                          </span>
                          <span className="truncate">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Middle: steps list */}
          <section className="border-hairline bg-canvas rounded-xl border p-4 lg:col-span-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-body-sm-medium text-ink">
                Steps
                <span className="text-caption text-stone ml-2">
                  ({graph.steps.length})
                </span>
              </h3>
              <label className="text-caption flex items-center gap-2">
                <span className="text-stone">Start step:</span>
                <select
                  value={graph.start}
                  onChange={(e) =>
                    setGraph({ ...graph, start: e.target.value })
                  }
                  className="border-hairline-strong bg-canvas text-body-sm text-ink rounded-md border px-2 py-1"
                >
                  <option value="">—</option>
                  {graph.steps.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.key}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {graph.steps.length === 0 ? (
              <p className="text-body-sm text-stone mt-6 text-center">
                Add a step from the palette to start.
              </p>
            ) : (
              <ol className="mt-3 space-y-1.5">
                {graph.steps.map((s, i) => {
                  const meta = metaFor(s.type);
                  const Icon = meta.icon;
                  const isStart = graph.start === s.key;
                  const isEnd =
                    !s.next || !("default" in s.next) || !s.next.default;
                  const selected = selectedKey === s.key;
                  return (
                    <li
                      key={s.key}
                      className={`group rounded-lg border px-3 py-2 transition ${
                        selected
                          ? "border-brand-yellow-deep bg-yellow-light"
                          : "border-hairline-soft hover:border-hairline-strong"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedKey(s.key)}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        >
                          <span className="text-caption text-stone font-mono">
                            #{i + 1}
                          </span>
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${TYPE_TONE[s.type]}`}
                          >
                            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-body-sm-medium text-ink truncate font-mono">
                                {s.key}
                              </span>
                              {isStart ? (
                                <span className="bg-mint-light text-moss-dark rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                                  Start
                                </span>
                              ) : null}
                              {isEnd ? (
                                <span className="bg-blush-light text-coral-dark rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                                  End
                                </span>
                              ) : null}
                            </div>
                            <div className="text-caption text-stone truncate">
                              {meta.label}
                              {!isEnd && s.next && "default" in s.next ? (
                                <span> → {s.next.default}</span>
                              ) : null}
                            </div>
                          </div>
                        </button>
                        <div className="flex shrink-0 items-center gap-0.5">
                          <button
                            onClick={() => moveStep(s.key, -1)}
                            disabled={i === 0}
                            aria-label="Move up"
                            className="text-stone hover:bg-canvas hover:text-ink rounded p-1 transition disabled:opacity-30"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => moveStep(s.key, 1)}
                            disabled={i === graph.steps.length - 1}
                            aria-label="Move down"
                            className="text-stone hover:bg-canvas hover:text-ink rounded p-1 transition disabled:opacity-30"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => deleteStep(s.key)}
                            aria-label="Delete step"
                            className="text-stone hover:bg-canvas hover:text-coral-dark rounded p-1 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          {/* Right: step config */}
          <aside className="border-hairline bg-canvas rounded-xl border p-4 lg:col-span-4">
            <h3 className="text-sm font-semibold">Step configuration</h3>
            {selected ? (
              <StepEditor
                step={selected}
                allSteps={graph.steps}
                users={users}
                roles={roles}
                onChange={(patch) => updateStep(selected.key, patch)}
              />
            ) : (
              <p className="text-stone mt-2 text-xs">
                Select a step to configure.
              </p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

interface LoadedFormDraft {
  fields: Array<{ key: string; label: string; type: string }>;
  perStepFieldState: Record<string, Record<string, FieldStateValue>>;
  /** All raw fields, kept verbatim so we can write them back unchanged. */
  rawFields: unknown[];
}

function FieldStateTab({
  linkedForms,
  steps,
}: {
  linkedForms: LinkedFormRef[];
  steps: StepDef[];
}) {
  const [pickedFormId, setPickedFormId] = useState<string>(
    linkedForms[0]?.id ?? "",
  );
  const [draft, setDraft] = useState<LoadedFormDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const persistableSteps = steps.filter(
    (s) =>
      s.type === "APPROVAL" || s.type === "EXECUTION" || s.type === "INFO_ACK",
  );

  // Lazy-load the picked form's draft.
  useEffect(() => {
    if (!pickedFormId) {
      setDraft(null);
      return;
    }
    let stopped = false;
    setLoading(true);
    setSaveError(null);
    fetch(`/api/workflow/admin/forms/${pickedFormId}/draft`)
      .then((r) => r.json())
      .then((data: { draft: { schemaJson: unknown } }) => {
        if (stopped) return;
        const schema = data.draft.schemaJson as
          | {
              fields?: Array<{ key: string; label: string; type: string }>;
              perStepFieldState?: Record<
                string,
                Record<string, FieldStateValue>
              >;
            }
          | undefined;
        const all = schema?.fields ?? [];
        setDraft({
          rawFields: all as unknown[],
          fields: all
            .filter((f) => f.type !== "SECTION_HEADER" && f.type !== "COMPUTED")
            .map((f) => ({ key: f.key, label: f.label, type: f.type })),
          perStepFieldState: schema?.perStepFieldState ?? {},
        });
      })
      .catch(() => {
        if (!stopped) setDraft(null);
      })
      .finally(() => {
        if (!stopped) setLoading(false);
      });
    return () => {
      stopped = true;
    };
  }, [pickedFormId]);

  const persist = async (
    next: Record<string, Record<string, FieldStateValue>>,
  ) => {
    if (!pickedFormId || !draft) return;
    setBusy(true);
    setSaveError(null);
    try {
      const writeRes = await fetch(
        `/api/workflow/admin/forms/${pickedFormId}/draft`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            fields: draft.rawFields,
            perStepFieldState: next,
          }),
        },
      );
      if (!writeRes.ok) {
        const body = await writeRes.json().catch(() => ({}));
        throw new Error(body.message || body.error || "Save failed");
      }
      setSavedAt(new Date());
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  // Empty state — no linked forms
  if (linkedForms.length === 0) {
    return (
      <div className="border-hairline bg-canvas rounded-xl border p-8 text-center">
        <p className="text-body-md-medium text-ink">No linked forms</p>
        <p className="text-body-sm text-stone mt-2">
          Per-step field state lives on the form. Link this workflow to a form
          first — open the form&apos;s editor and pick this workflow in the
          header dropdown.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border-hairline-soft bg-surface-soft flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-body-sm-medium text-ink">Editing form:</span>
          {linkedForms.length === 1 ? (
            <span className="text-body-sm text-charcoal font-mono">
              {linkedForms[0]!.name}
            </span>
          ) : (
            <select
              value={pickedFormId}
              onChange={(e) => setPickedFormId(e.target.value)}
              className="border-hairline-strong bg-canvas text-body-sm text-ink rounded-md border px-3 py-1.5"
            >
              {linkedForms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          )}
          <span className="text-caption text-stone">
            Changes save into this form&apos;s draft.
          </span>
        </div>
        <div className="text-caption text-stone">
          {loading
            ? "loading…"
            : busy
              ? "saving…"
              : savedAt
                ? `saved ${formatTime(savedAt)}`
                : ""}
        </div>
      </div>

      {saveError ? (
        <div className="bg-brand-red/40 text-body-sm text-coral-dark rounded-md border border-(--color-brand-red-dark) px-3 py-2">
          {saveError}
        </div>
      ) : null}

      {loading || !draft ? (
        <div className="border-hairline-soft bg-canvas text-body-sm text-stone rounded-md border p-8 text-center">
          {loading ? "Loading form…" : "Pick a form to start editing."}
        </div>
      ) : draft.fields.length === 0 ? (
        <p className="border-hairline-soft bg-canvas text-body-sm text-stone rounded-md border p-5">
          The linked form has no fields yet. Add fields in the form builder
          first.
        </p>
      ) : persistableSteps.length === 0 ? (
        <p className="border-hairline-soft bg-canvas text-body-sm text-stone rounded-md border p-5">
          Per-step field state applies to human steps (Approval, Execution, Info
          / Ack). Add at least one such step.
        </p>
      ) : (
        persistableSteps.map((s) => (
          <StepFieldVisibilityCard
            key={s.key}
            stepKey={s.key}
            stepLabel={`${s.key} — ${s.type}`}
            fields={draft.fields}
            state={draft.perStepFieldState[s.key]}
            onChange={(next) => {
              const updated = {
                ...draft.perStepFieldState,
                [s.key]: next,
              };
              setDraft({ ...draft, perStepFieldState: updated });
              void persist(updated);
            }}
          />
        ))
      )}
    </div>
  );
}

function StepEditor({
  step,
  allSteps,
  users,
  roles,
  onChange,
}: {
  step: StepDef;
  allSteps: StepDef[];
  users: User[];
  roles: Role[];
  onChange: (patch: Partial<StepDef>) => void;
}) {
  const config = step.config as Record<string, unknown>;
  function fromGraphSpec(raw: unknown): Assignee {
    const s = raw as Record<string, unknown>;
    if (s.kind === "ACCESS_SERVICE_ROLE") {
      return {
        kind: "ACCESS_SERVICE_ROLE",
        serviceSnapshotKey: (s.serviceSnapshotKey as string) ?? "",
        serviceRole: ((s.role as string) ?? "OWNER") as
          "OWNER" | "CYBERSECURITY" | "IMPLEMENTER",
      };
    }
    if (s.kind === "FALLBACK") {
      const fw = s.forceFallbackWhen as Record<string, unknown> | undefined;
      const fwField =
        fw?.left &&
        typeof (fw.left as Record<string, unknown>).field === "string"
          ? ((fw.left as Record<string, unknown>).field as string)
          : "";
      return {
        kind: "FALLBACK",
        primary: (s.primary as { kind: "REQUESTER_MANAGER" }) ?? {
          kind: "REQUESTER_MANAGER",
        },
        fallbackFieldKey: (s.fallbackFieldKey as string) ?? "",
        forceFallbackWhenField: fwField,
      };
    }
    return s as unknown as Assignee;
  }

  const assignees = Array.isArray(config.assignees)
    ? (config.assignees as unknown[]).map(fromGraphSpec)
    : [];

  function updateConfig(patch: Record<string, unknown>) {
    onChange({ config: { ...config, ...patch } });
  }

  function toGraphSpec(a: Assignee): Record<string, unknown> {
    if (a.kind === "ACCESS_SERVICE_ROLE") {
      return {
        kind: "ACCESS_SERVICE_ROLE",
        serviceSnapshotKey: a.serviceSnapshotKey ?? "",
        role: a.serviceRole ?? "OWNER",
      };
    }
    if (a.kind === "FALLBACK") {
      const spec: Record<string, unknown> = {
        kind: "FALLBACK",
        primary: a.primary ?? { kind: "REQUESTER_MANAGER" },
        fallbackFieldKey: a.fallbackFieldKey ?? "",
      };
      if (a.forceFallbackWhenField) {
        spec.forceFallbackWhen = {
          op: "!=",
          left: { field: a.forceFallbackWhenField },
          right: { const: "" },
        };
      }
      return spec;
    }
    return a as unknown as Record<string, unknown>;
  }

  function updateAssignees(next: Assignee[]) {
    updateConfig({ assignees: next.map(toGraphSpec) });
  }

  return (
    <div className="mt-2 space-y-3 text-xs">
      <label className="block">
        <span className="text-stone">Step key</span>
        <input
          value={step.key}
          onChange={(e) => onChange({ key: e.target.value })}
          className="border-hairline-strong bg-canvas mt-0.5 w-full rounded-md border px-2 py-1 font-mono"
        />
      </label>
      <label className="block">
        <span className="text-stone">Routes to (default)</span>
        <select
          value={(step.next as { default?: string } | undefined)?.default ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onChange({ next: v ? { default: v } : undefined });
          }}
          className="border-hairline-strong bg-canvas mt-0.5 w-full rounded-md border px-2 py-1"
        >
          <option value="">— Close request —</option>
          {allSteps
            .filter((s) => s.key !== step.key)
            .map((s) => (
              <option key={s.key} value={s.key}>
                {s.key}
              </option>
            ))}
        </select>
      </label>

      {/* Assignee management for assigning step types */}
      {(step.type === "APPROVAL" ||
        step.type === "EXECUTION" ||
        step.type === "INFO_ACK") && (
        <div className="border-hairline-soft rounded-md border p-2">
          <p className="font-medium">Assignees</p>
          {assignees.length === 0 ? (
            <p className="text-stone mt-1">No assignees yet.</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {assignees.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-1">
                  <span className="font-mono text-[11px]">
                    {a.kind}
                    {a.kind === "USER" && a.userId
                      ? `: ${users.find((u) => u.id === a.userId)?.email ?? a.userId}`
                      : ""}
                    {a.kind === "ROLE" && a.roleId
                      ? `: ${roles.find((r) => r.id === a.roleId)?.name ?? a.roleId}`
                      : ""}
                    {a.kind === "FIELD_USER" && a.fieldKey
                      ? `: field=${a.fieldKey}`
                      : ""}
                    {a.kind === "ACCESS_SERVICE_ROLE" && a.serviceSnapshotKey
                      ? `: ${a.serviceSnapshotKey}/${a.serviceRole ?? "OWNER"}`
                      : ""}
                    {a.kind === "FALLBACK" && a.fallbackFieldKey
                      ? `: manager→${a.fallbackFieldKey}`
                      : ""}
                  </span>
                  <button
                    onClick={() =>
                      updateAssignees(assignees.filter((_, j) => j !== i))
                    }
                    className="text-coral-dark rounded border border-(--color-brand-red-dark) px-1 text-[10px]"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 flex flex-wrap gap-1">
            <button
              onClick={() =>
                updateAssignees([
                  ...assignees,
                  { kind: "USER", userId: users[0]?.id ?? "" },
                ])
              }
              className="border-hairline-strong rounded border px-1.5 py-0.5 text-[10px]"
            >
              + User
            </button>
            <button
              onClick={() =>
                updateAssignees([
                  ...assignees,
                  { kind: "ROLE", roleId: roles[0]?.id ?? "" },
                ])
              }
              className="border-hairline-strong rounded border px-1.5 py-0.5 text-[10px]"
            >
              + Role
            </button>
            <button
              onClick={() =>
                updateAssignees([...assignees, { kind: "REQUESTER" }])
              }
              className="border-hairline-strong rounded border px-1.5 py-0.5 text-[10px]"
            >
              + Requester
            </button>
            <button
              onClick={() =>
                updateAssignees([
                  ...assignees,
                  { kind: "FIELD_USER", fieldKey: "" },
                ])
              }
              className="border-hairline-strong rounded border px-1.5 py-0.5 text-[10px]"
            >
              + Field user
            </button>
            <button
              onClick={() =>
                updateAssignees([...assignees, { kind: "REQUESTER_MANAGER" }])
              }
              className="border-hairline-strong rounded border px-1.5 py-0.5 text-[10px]"
            >
              + Manager
            </button>
            <button
              onClick={() =>
                updateAssignees([
                  ...assignees,
                  {
                    kind: "ACCESS_SERVICE_ROLE",
                    serviceSnapshotKey: "",
                    serviceRole: "OWNER",
                  },
                ])
              }
              className="border-hairline-strong rounded border px-1.5 py-0.5 text-[10px]"
            >
              + Service role
            </button>
            <button
              onClick={() =>
                updateAssignees([
                  ...assignees,
                  {
                    kind: "FALLBACK",
                    primary: { kind: "REQUESTER_MANAGER" },
                    fallbackFieldKey: "",
                    forceFallbackWhenField: "",
                  },
                ])
              }
              className="border-hairline-strong rounded border px-1.5 py-0.5 text-[10px]"
            >
              + Manager+fallback
            </button>
          </div>
          {/* Assignee detail editors */}
          {assignees.map((a, i) => (
            <div key={i} className="mt-2 space-y-1">
              {a.kind === "USER" && (
                <select
                  value={a.userId ?? ""}
                  onChange={(e) => {
                    const next = [...assignees];
                    next[i] = { ...a, userId: e.target.value };
                    updateAssignees(next);
                  }}
                  className="border-hairline-strong bg-canvas w-full rounded-md border px-2 py-1"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email}
                    </option>
                  ))}
                </select>
              )}
              {a.kind === "ROLE" && (
                <select
                  value={a.roleId ?? ""}
                  onChange={(e) => {
                    const next = [...assignees];
                    next[i] = { ...a, roleId: e.target.value };
                    updateAssignees(next);
                  }}
                  className="border-hairline-strong bg-canvas w-full rounded-md border px-2 py-1"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              )}
              {a.kind === "FIELD_USER" && (
                <input
                  value={a.fieldKey ?? ""}
                  onChange={(e) => {
                    const next = [...assignees];
                    next[i] = { ...a, fieldKey: e.target.value };
                    updateAssignees(next);
                  }}
                  placeholder="field key (e.g., owner)"
                  className="border-hairline-strong bg-canvas w-full rounded-md border px-2 py-1 font-mono"
                />
              )}
              {a.kind === "ACCESS_SERVICE_ROLE" && (
                <div className="space-y-1">
                  <input
                    value={a.serviceSnapshotKey ?? ""}
                    onChange={(e) => {
                      const next = [...assignees];
                      next[i] = { ...a, serviceSnapshotKey: e.target.value };
                      updateAssignees(next);
                    }}
                    placeholder="Service field key (LOOKUP[ACCESS_SERVICES])"
                    className="border-hairline-strong bg-canvas w-full rounded-md border px-2 py-1 font-mono text-[11px]"
                  />
                  <select
                    value={a.serviceRole ?? "OWNER"}
                    onChange={(e) => {
                      const next = [...assignees];
                      next[i] = {
                        ...a,
                        serviceRole: e.target.value as
                          "OWNER" | "CYBERSECURITY" | "IMPLEMENTER",
                      };
                      updateAssignees(next);
                    }}
                    className="border-hairline-strong bg-canvas w-full rounded-md border px-2 py-1 text-[11px]"
                  >
                    <option value="OWNER">Owner</option>
                    <option value="CYBERSECURITY">Cybersecurity</option>
                    <option value="IMPLEMENTER">Implementer</option>
                  </select>
                </div>
              )}
              {a.kind === "FALLBACK" && (
                <div className="space-y-1">
                  <p className="text-stone text-[10px]">
                    Primary: Requester&apos;s line manager
                  </p>
                  <input
                    value={a.fallbackFieldKey ?? ""}
                    onChange={(e) => {
                      const next = [...assignees];
                      next[i] = { ...a, fallbackFieldKey: e.target.value };
                      updateAssignees(next);
                    }}
                    placeholder="Fallback USER_PICKER field key"
                    className="border-hairline-strong bg-canvas w-full rounded-md border px-2 py-1 font-mono text-[11px]"
                  />
                  <input
                    value={a.forceFallbackWhenField ?? ""}
                    onChange={(e) => {
                      const next = [...assignees];
                      next[i] = {
                        ...a,
                        forceFallbackWhenField: e.target.value,
                      };
                      updateAssignees(next);
                    }}
                    placeholder="Skip manager when this field is non-empty (optional)"
                    className="border-hairline-strong bg-canvas w-full rounded-md border px-2 py-1 font-mono text-[11px]"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {step.type === "APPROVAL" && (
        <label className="block">
          <span className="text-stone">Multi-assignee policy</span>
          <select
            value={(config.multiAssigneePolicy as string) ?? "ANY"}
            onChange={(e) =>
              updateConfig({ multiAssigneePolicy: e.target.value })
            }
            className="border-hairline-strong bg-canvas mt-0.5 w-full rounded-md border px-2 py-1"
          >
            <option value="ANY">ANY (1 vote)</option>
            <option value="ALL">ALL</option>
            <option value="MAJORITY">MAJORITY</option>
            <option value="UNANIMOUS">UNANIMOUS</option>
            <option value="QUORUM">QUORUM</option>
          </select>
        </label>
      )}

      {step.type === "WEBHOOK" && (
        <>
          <label className="block">
            <span className="text-stone">URL</span>
            <input
              value={(config.url as string) ?? ""}
              onChange={(e) => updateConfig({ url: e.target.value })}
              placeholder="https://api.example.com/hook"
              className="border-hairline-strong bg-canvas mt-0.5 w-full rounded-md border px-2 py-1 font-mono"
            />
          </label>
          <label className="block">
            <span className="text-stone">Method</span>
            <select
              value={(config.method as string) ?? "POST"}
              onChange={(e) => updateConfig({ method: e.target.value })}
              className="border-hairline-strong bg-canvas mt-0.5 w-full rounded-md border px-2 py-1"
            >
              {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        </>
      )}

      {step.type === "AUTOMATION" && (
        <label className="block">
          <span className="text-stone">Handler key</span>
          <select
            value={(config.handler as string) ?? "auto-approve"}
            onChange={(e) => updateConfig({ handler: e.target.value })}
            className="border-hairline-strong bg-canvas mt-0.5 w-full rounded-md border px-2 py-1"
          >
            <option value="auto-approve">auto-approve</option>
            <option value="set-field">set-field</option>
            <option value="generate-reference-number">
              generate-reference-number
            </option>
          </select>
        </label>
      )}

      {step.type === "DELAY" && (
        <label className="block">
          <span className="text-stone">Duration (ms)</span>
          <input
            type="number"
            value={(config.durationMs as number) ?? 0}
            onChange={(e) =>
              updateConfig({ durationMs: Number(e.target.value) })
            }
            className="border-hairline-strong bg-canvas mt-0.5 w-full rounded-md border px-2 py-1"
          />
        </label>
      )}
    </div>
  );
}
