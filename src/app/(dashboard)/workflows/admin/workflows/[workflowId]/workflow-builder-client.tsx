"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  CornerUpLeft,
  FileText,
  Flag,
  Loader2,
  Sparkles,
} from "lucide-react";

import { confirm } from "@/components/design";
import { WorkflowAiAssistant } from "@/components/workflows/workflow-ai-assistant";
import { formatTime } from "@/lib/utils/date-format";
import { cn } from "@/lib/utils";
import type {
  DirectoryRole,
  DirectoryUser,
  FormFieldRef,
} from "@/lib/workflows/builder/assignees";
import {
  checkGraph,
  createStep,
  insertStep,
  moveStep,
  reachableKeys,
  removeStep,
  renameStepKey,
  stepName,
  WORKFLOW_TEMPLATES,
  type Graph,
  type StepDef,
  type StepType,
} from "@/lib/workflows/builder/graph";

import { AddStepMenu } from "./add-step-menu";
import { FieldStateTab, type LinkedFormRef } from "./field-state-tab";
import { StepSettings } from "./step-settings";
import { WorkflowPath } from "./workflow-path";

interface Definition {
  id: string;
  name: string;
  description: string | null;
  publishedVersionNumber: number | null;
  formCount: number;
  publishedGraph: unknown;
}

function normalise(raw: unknown): Graph {
  const g = (raw ?? {}) as Partial<Graph>;
  return {
    start: g.start ?? "",
    steps: (g.steps ?? []).map((s, i) => ({
      ...s,
      position: s.position ?? i + 1,
    })),
  };
}

const snapshot = (graph: Graph) => JSON.stringify(graph);

export function WorkflowBuilderClient({
  definition,
  users,
  roles,
  accessServiceNames,
  linkedForms = [],
  emailTemplates = [],
  forms = [],
}: {
  definition: Definition;
  users: DirectoryUser[];
  roles: DirectoryRole[];
  accessServiceNames?: string[];
  linkedForms?: LinkedFormRef[];
  emailTemplates?: Array<{ key: string; subject: string }>;
  forms?: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [graph, setGraph] = useState<Graph>({ start: "", steps: [] });
  const [saved, setSaved] = useState<string>("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<"save" | "publish" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [tab, setTab] = useState<"path" | "fields">("path");
  const [aiOpen, setAiOpen] = useState(false);
  const [fields, setFields] = useState<FormFieldRef[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(
          `/api/workflow/admin/workflows/${definition.id}/draft`,
        );
        if (!response.ok) throw new Error("The workflow couldn't be loaded.");
        const body = (await response.json()) as {
          draft: { graphJson: unknown };
        };
        if (cancelled) return;
        const g = normalise(body.draft.graphJson);
        setGraph(g);
        setSaved(snapshot(g));
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [definition.id]);

  // Fields of the linked forms, so "person in the form" assignees are picked
  // from a list instead of typed as keys.
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      linkedForms.map((form) =>
        fetch(`/api/workflow/admin/forms/${form.id}/draft`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ),
    ).then((drafts) => {
      if (cancelled) return;
      const seen = new Set<string>();
      const all: FormFieldRef[] = [];
      for (const draft of drafts) {
        const list = (draft?.draft?.schemaJson?.fields ?? []) as FormFieldRef[];
        for (const field of list) {
          if (seen.has(field.key)) continue;
          seen.add(field.key);
          all.push({
            key: field.key,
            label: field.label,
            type: field.type,
            config: field.config,
          });
        }
      }
      setFields(all);
    });
    return () => {
      cancelled = true;
    };
  }, [linkedForms]);

  const dirty = loaded && snapshot(graph) !== saved;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const issues = useMemo(() => checkGraph(graph), [graph]);
  const unreachable = useMemo(() => {
    const live = reachableKeys(graph);
    return new Set(
      graph.steps.filter((s) => !live.has(s.key)).map((s) => s.key),
    );
  }, [graph]);
  const unpublished = useMemo(() => {
    if (!definition.publishedGraph) return true;
    return snapshot(graph) !== snapshot(normalise(definition.publishedGraph));
  }, [graph, definition.publishedGraph]);

  const directory = useMemo(
    () => ({ users, roles, fields }),
    [users, roles, fields],
  );
  const catalog = useMemo(
    () => ({ emailTemplates, forms }),
    [emailTemplates, forms],
  );
  const selected = graph.steps.find((s) => s.key === selectedKey) ?? null;

  function update(next: Graph) {
    setGraph(next);
    setServerErrors([]);
  }

  function insert(type: StepType, afterKey: string | null) {
    const step = createStep(graph.steps, type);
    update(insertStep(graph, step, afterKey));
    setSelectedKey(step.key);
  }

  function replaceStep(next: StepDef) {
    update({
      ...graph,
      steps: graph.steps.map((s) => (s.key === next.key ? next : s)),
    });
  }

  async function deleteSelected(step: StepDef) {
    const ok = await confirm({
      title: `Remove “${stepName(step)}”?`,
      message: "Steps that led here will continue to the step after it.",
      confirmLabel: "Remove",
    });
    if (!ok) return;
    update(removeStep(graph, step.key));
    setSelectedKey(null);
  }

  async function save(): Promise<boolean> {
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
        throw new Error(
          body.message || body.error || "The draft couldn't be saved.",
        );
      }
      setSaved(snapshot(graph));
      setSavedAt(new Date());
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function publish() {
    const ok = await confirm({
      title: "Publish this workflow?",
      message:
        "New requests will follow it straight away. Requests already in progress keep the version they started with.",
      confirmLabel: "Publish",
    });
    if (!ok) return;
    if (!(await save())) return;
    setBusy("publish");
    setError(null);
    setServerErrors([]);
    try {
      const response = await fetch(
        `/api/workflow/admin/workflows/${definition.id}/publish`,
        {
          method: "POST",
        },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const list = Array.isArray(body.errors)
          ? (body.errors as string[])
          : [];
        setServerErrors(list);
        throw new Error(
          body.message || body.error || "The workflow couldn't be published.",
        );
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  if (!loaded) {
    return (
      <p className="text-stone flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading the workflow…
      </p>
    );
  }

  const status = !definition.publishedVersionNumber
    ? { label: "Not published yet", tone: "bg-sand-light text-charcoal" }
    : unpublished
      ? {
          label: `Changes not published · live: v${definition.publishedVersionNumber}`,
          tone: "bg-yellow-light text-yellow-dark",
        }
      : {
          label: `Published · v${definition.publishedVersionNumber}`,
          tone: "bg-mint-light text-moss-dark",
        };

  const publishBlocked = issues.length > 0 || graph.steps.length === 0;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-stone text-xs font-semibold tracking-[0.06em] uppercase">
            Workflow
          </p>
          <h1 className="text-ink mt-1 text-2xl font-semibold">
            {definition.name}
          </h1>
          {definition.description ? (
            <p className="text-stone mt-1 max-w-2xl text-sm">
              {definition.description}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 font-semibold",
                status.tone,
              )}
            >
              {status.label}
            </span>
            <span className="text-stone">
              {dirty ? (
                <span className="text-yellow-dark inline-flex items-center gap-1.5 font-medium">
                  <span className="bg-yellow-dark h-1.5 w-1.5 rounded-full" />{" "}
                  Unsaved changes
                </span>
              ) : savedAt ? (
                `Draft saved at ${formatTime(savedAt)}`
              ) : (
                "Draft saved"
              )}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAiOpen((v) => !v)}
            className="border-hairline-strong hover:bg-surface inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium"
          >
            <Sparkles className="h-4 w-4" /> Draft with AI
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={!!busy || !dirty}
            className="border-hairline-strong hover:bg-surface rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            {busy === "save" ? "Saving…" : "Save draft"}
          </button>
          <button
            type="button"
            onClick={() => void publish()}
            disabled={!!busy || publishBlocked || (!unpublished && !dirty)}
            title={
              publishBlocked
                ? "Fix the items under “Before you publish” first."
                : !unpublished && !dirty
                  ? "Everything is already published."
                  : undefined
            }
            className="bg-ink text-canvas rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy === "publish" ? "Publishing…" : "Publish"}
          </button>
        </div>
      </header>

      {error ? (
        <div
          role="alert"
          className="bg-blush-light text-coral-dark rounded-lg px-4 py-3 text-sm"
        >
          <p className="font-medium">{error}</p>
          {serverErrors.length > 0 ? (
            <ul className="mt-1 list-disc pl-5 text-xs leading-5">
              {serverErrors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          ) : null}
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
            // Replaces the path with what the author reviewed. Still a local
            // draft: saving and publishing stay manual.
            update({
              start: result.start,
              steps: result.steps.map((step) => ({
                key: step.key,
                type: step.type as StepType,
                position: step.position,
                name: (step as { name?: string }).name,
                next: step.next,
                config: step.config,
              })),
            });
            setSelectedKey(null);
            setAiOpen(false);
          }}
        />
      ) : null}

      <div
        role="tablist"
        aria-label="Workflow sections"
        className="border-hairline-soft flex gap-1 border-b"
      >
        {(
          [
            ["path", "Path"],
            ["fields", "Field visibility"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "relative px-3 py-2 text-sm font-medium transition-colors",
              tab === key ? "text-ink" : "text-stone hover:text-ink",
            )}
          >
            {label}
            {key === "fields" && linkedForms.length > 0 ? (
              <span className="bg-surface text-stone ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                {linkedForms.length}
              </span>
            ) : null}
            {tab === key ? (
              <span className="bg-ink absolute right-0 -bottom-px left-0 h-0.5" />
            ) : null}
          </button>
        ))}
      </div>

      {tab === "fields" ? (
        <FieldStateTab linkedForms={linkedForms} steps={graph.steps} />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="border-hairline bg-surface/40 rounded-2xl border bg-[radial-gradient(circle,var(--color-hairline-strong)_1px,transparent_1px)] [background-size:20px_20px] px-4 py-10 sm:px-8">
            {graph.steps.length === 0 ? (
              <EmptyPath
                onTemplate={(id) => {
                  const template = WORKFLOW_TEMPLATES.find((t) => t.id === id);
                  if (template) update(template.build());
                }}
                onAdd={(type) => insert(type, null)}
              />
            ) : (
              <WorkflowPath
                graph={graph}
                directory={directory}
                issues={issues}
                unreachable={unreachable}
                selectedKey={selectedKey}
                onSelect={setSelectedKey}
                onInsert={insert}
              />
            )}
          </div>

          <aside className="border-hairline bg-canvas rounded-2xl border p-5 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
            {selected ? (
              <StepSettings
                key={selected.key}
                step={selected}
                graph={graph}
                directory={directory}
                catalog={catalog}
                issues={issues.filter((i) => i.stepKey === selected.key)}
                onChange={replaceStep}
                onRename={(key) => {
                  const renamed = renameStepKey(graph, selected.key, key);
                  if (renamed === graph) return false;
                  update(renamed);
                  setSelectedKey(key);
                  return true;
                }}
                onMakeFirst={() => update({ ...graph, start: selected.key })}
                onMove={(direction) =>
                  update(moveStep(graph, selected.key, direction))
                }
                onDelete={() => void deleteSelected(selected)}
                onClose={() => setSelectedKey(null)}
              />
            ) : (
              <Overview
                issues={issues}
                graph={graph}
                linkedForms={linkedForms}
                onSelect={setSelectedKey}
              />
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function Overview({
  issues,
  graph,
  linkedForms,
  onSelect,
}: {
  issues: ReturnType<typeof checkGraph>;
  graph: Graph;
  linkedForms: LinkedFormRef[];
  onSelect: (key: string) => void;
}) {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-ink text-sm font-semibold">Before you publish</h3>
        {issues.length === 0 ? (
          <p className="text-moss-dark mt-2 flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4" /> Everything is in place.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {issues.map((issue, i) => (
              <li key={i}>
                <button
                  type="button"
                  disabled={!issue.stepKey}
                  onClick={() => issue.stepKey && onSelect(issue.stepKey)}
                  className="hover:bg-surface flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-xs leading-5 disabled:hover:bg-transparent"
                >
                  <AlertTriangle className="text-yellow-dark mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="text-ink">{issue.message}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="text-ink text-sm font-semibold">How a request moves</h3>
        <ul className="text-stone mt-2 space-y-2 text-xs leading-5">
          <li className="flex gap-2">
            <CheckCircle2 className="text-moss-dark mt-0.5 h-3.5 w-3.5 shrink-0" />
            When a step is approved or done, it goes to the next step you chose.
          </li>
          <li className="flex gap-2">
            <CornerUpLeft className="text-coral-dark mt-0.5 h-3.5 w-3.5 shrink-0" />
            When it is rejected, it returns to the requester to correct and
            resubmit.
          </li>
          <li className="flex gap-2">
            <Flag className="text-moss-dark mt-0.5 h-3.5 w-3.5 shrink-0" />
            When there is no next step, the request is completed.
          </li>
        </ul>
        <p className="text-stone mt-3 text-xs">
          {graph.steps.length} step{graph.steps.length === 1 ? "" : "s"}. Click
          a step to change it, or{" "}
          <span className="text-ink font-medium">+</span> to add one.
        </p>
      </section>

      <section>
        <h3 className="text-ink text-sm font-semibold">
          Forms using this workflow
        </h3>
        {linkedForms.length === 0 ? (
          <p className="text-stone mt-2 text-xs">
            No form uses it yet. Link it from a form&apos;s settings.
          </p>
        ) : (
          <ul className="mt-2 space-y-1">
            {linkedForms.map((form) => (
              <li key={form.id}>
                <Link
                  href={`/workflows/admin/forms/${form.id}`}
                  className="text-ink hover:bg-surface flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm"
                >
                  <FileText className="text-stone h-4 w-4" /> {form.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function EmptyPath({
  onTemplate,
  onAdd,
}: {
  onTemplate: (id: string) => void;
  onAdd: (type: StepType) => void;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="text-ink text-lg font-semibold">
        How should requests be handled?
      </h2>
      <p className="text-stone mt-1 text-sm">
        Start from a common path, then adjust it.
      </p>
      <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
        {WORKFLOW_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onTemplate(template.id)}
            className="border-hairline bg-canvas hover:border-ink rounded-xl border p-4 transition-colors"
          >
            <span className="text-ink block text-sm font-semibold">
              {template.name}
            </span>
            <span className="text-stone mt-1 block text-xs leading-5">
              {template.description}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-6 flex justify-center">
        <AddStepMenu
          variant="button"
          label="Start from scratch"
          onAdd={onAdd}
        />
      </div>
    </div>
  );
}
