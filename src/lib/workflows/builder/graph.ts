/**
 * Workflow builder — pure graph helpers.
 *
 * The builder edits the same graph JSON the engine runs (see
 * `@/core/domain/workflow/types`). Everything here is pure so the routing
 * rules are unit-tested, and so the screen never invents behaviour the engine
 * does not have:
 *
 *   APPROVE   → `next.onAction.APPROVE`, else `next.onAction.__default__`;
 *               no target closes the request as completed.
 *   REJECT    → never routed. The engine returns the request to the requester
 *               (status DRAFT) to correct and resubmit, per rejection policy.
 *               An `onAction.REJECT` already in a graph is preserved verbatim
 *               but is not shown as a route, because it is not one.
 *   other     → `next.default`; none closes the request as completed.
 */

import { hasOptionUsers } from "./assignees";

export type StepType =
  | "APPROVAL"
  | "EXECUTION"
  | "INFO_ACK"
  | "AUTOMATION"
  | "NOTIFICATION"
  | "CONDITIONAL_BRANCH"
  | "DELAY"
  | "SCHEDULE"
  | "WEBHOOK"
  | "SUB_WORKFLOW"
  | "WAIT_FOR_EVENT";

export type StepRouting =
  { default?: string } | { onAction: Record<string, string> };

export interface StepDef {
  key: string;
  type: StepType;
  position: number;
  /** Human-readable step name shown everywhere instead of the key. */
  name?: string;
  next?: StepRouting;
  config: Record<string, unknown>;
}

export interface Graph {
  start: string;
  steps: StepDef[];
}

export const HUMAN_STEP_TYPES: ReadonlySet<StepType> = new Set([
  "APPROVAL",
  "EXECUTION",
  "INFO_ACK",
]);

export const STEP_TYPE_LABEL: Record<StepType, string> = {
  APPROVAL: "Approval",
  EXECUTION: "Task",
  INFO_ACK: "Acknowledgement",
  AUTOMATION: "Automation",
  NOTIFICATION: "Notification",
  CONDITIONAL_BRANCH: "Condition",
  DELAY: "Wait",
  SCHEDULE: "Schedule",
  WEBHOOK: "Webhook",
  SUB_WORKFLOW: "Sub-request",
  WAIT_FOR_EVENT: "Wait for event",
};

/** What a newly added step is called until the author renames it. */
export const DEFAULT_STEP_NAME: Record<StepType, string> = {
  APPROVAL: "Approval",
  EXECUTION: "Complete the work",
  INFO_ACK: "Acknowledge",
  AUTOMATION: "Automation",
  NOTIFICATION: "Send notification",
  CONDITIONAL_BRANCH: "Decide the route",
  DELAY: "Wait",
  SCHEDULE: "Wait for a window",
  WEBHOOK: "Call external system",
  SUB_WORKFLOW: "Open a sub-request",
  WAIT_FOR_EVENT: "Wait for event",
};

export function stepName(step: Pick<StepDef, "name" | "key">): string {
  const name = step.name?.trim();
  if (name) return name;
  // Older graphs have keys only: "security_review" → "Security review".
  const words = step.key.replace(/[_-]+/g, " ").trim();
  return words ? words[0]!.toUpperCase() + words.slice(1) : step.key;
}

/* -------------------------------------------------------------------------- */
/*                                   routing                                   */
/* -------------------------------------------------------------------------- */

/** Where the step goes when it finishes normally (approved / done). */
export function happyNext(step: StepDef): string | null {
  const next = step.next;
  if (!next) return null;
  if ("onAction" in next) {
    return next.onAction.APPROVE || next.onAction.__default__ || null;
  }
  return next.default || null;
}

/** Point the normal route at `target` (null = close the request). */
export function withHappyNext(step: StepDef, target: string | null): StepDef {
  if (step.type === "APPROVAL") {
    // Keep any other per-action entries exactly as they were.
    const existing =
      step.next && "onAction" in step.next ? { ...step.next.onAction } : {};
    delete existing.__default__;
    if (target) existing.APPROVE = target;
    else delete existing.APPROVE;
    const hasEntries = Object.keys(existing).length > 0;
    return { ...step, next: hasEntries ? { onAction: existing } : undefined };
  }
  return { ...step, next: target ? { default: target } : undefined };
}

/** Every step key this step can route to (normal route + condition branches). */
export function targetsOf(step: StepDef): string[] {
  const targets = new Set<string>();
  const happy = happyNext(step);
  if (happy) targets.add(happy);
  if (step.type === "CONDITIONAL_BRANCH") {
    const branches = step.config.branches;
    if (Array.isArray(branches)) {
      for (const branch of branches) {
        const goTo = (branch as { goTo?: unknown }).goTo;
        if (typeof goTo === "string" && goTo) targets.add(goTo);
      }
    }
    const fallback = step.config.default;
    if (typeof fallback === "string" && fallback) targets.add(fallback);
  }
  return [...targets];
}

/* -------------------------------------------------------------------------- */
/*                                  editing                                    */
/* -------------------------------------------------------------------------- */

function renumber(steps: StepDef[]): StepDef[] {
  return steps.map((step, index) => ({ ...step, position: index + 1 }));
}

export function slugKey(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return slug || "step";
}

export function uniqueKey(steps: readonly StepDef[], base: string): string {
  let candidate = base;
  let n = 1;
  while (steps.some((s) => s.key === candidate)) candidate = `${base}_${++n}`;
  return candidate;
}

export function defaultConfigFor(type: StepType): Record<string, unknown> {
  switch (type) {
    case "APPROVAL":
      return {
        type,
        assignees: [],
        multiAssigneePolicy: "ANY",
        allowReject: true,
      };
    case "EXECUTION":
      return { type, assignees: [] };
    case "INFO_ACK":
      return { type, assignees: [{ kind: "REQUESTER" }] };
    case "AUTOMATION":
      return { type, handler: "auto-approve" };
    case "NOTIFICATION":
      return { type, templateKey: "" };
    case "CONDITIONAL_BRANCH":
      return { type, branches: [] };
    case "DELAY":
      return { type, durationMs: 24 * 60 * 60 * 1000 };
    case "SCHEDULE":
      return { type };
    case "WEBHOOK":
      return { type, url: "", method: "POST", failOnError: true };
    case "SUB_WORKFLOW":
      return { type, childFormId: "", waitForOutcome: true };
    case "WAIT_FOR_EVENT":
      return { type };
  }
}

export function createStep(
  steps: readonly StepDef[],
  type: StepType,
  name = DEFAULT_STEP_NAME[type],
): StepDef {
  return {
    key: uniqueKey(steps, slugKey(name)),
    type,
    name,
    position: steps.length + 1,
    config: defaultConfigFor(type),
  };
}

/**
 * Insert `step` after `afterKey` (null = at the very beginning) and wire it
 * into the normal route: whatever `afterKey` led to now follows the new step.
 */
export function insertStep(
  graph: Graph,
  step: StepDef,
  afterKey: string | null,
): Graph {
  const steps = [...graph.steps];
  if (afterKey === null) {
    const wired = graph.start ? withHappyNext(step, graph.start) : step;
    return { start: wired.key, steps: renumber([wired, ...steps]) };
  }
  const index = steps.findIndex((s) => s.key === afterKey);
  if (index === -1) {
    return {
      start: graph.start || step.key,
      steps: renumber([...steps, step]),
    };
  }
  const previous = steps[index]!;
  const wired = withHappyNext(step, happyNext(previous));
  steps[index] = withHappyNext(previous, wired.key);
  steps.splice(index + 1, 0, wired);
  return { start: graph.start || wired.key, steps: renumber(steps) };
}

function replaceTarget(
  step: StepDef,
  from: string,
  to: string | null,
): StepDef {
  let next = step.next;
  if (next && "onAction" in next) {
    const onAction: Record<string, string> = {};
    for (const [action, target] of Object.entries(next.onAction)) {
      if (target !== from) onAction[action] = target;
      else if (to) onAction[action] = to;
    }
    next = Object.keys(onAction).length ? { onAction } : undefined;
  } else if (next && next.default === from) {
    next = to ? { default: to } : undefined;
  }

  let config = step.config;
  if (step.type === "CONDITIONAL_BRANCH") {
    const branches = Array.isArray(config.branches)
      ? (config.branches as Array<Record<string, unknown>>)
          .map((branch) =>
            branch.goTo === from
              ? to
                ? { ...branch, goTo: to }
                : null
              : branch,
          )
          .filter(
            (branch): branch is Record<string, unknown> => branch !== null,
          )
      : config.branches;
    const fallback =
      config.default === from ? (to ?? undefined) : config.default;
    config = { ...config, branches, default: fallback };
    if (config.default === undefined) delete config.default;
  }
  return { ...step, next, config };
}

/**
 * Remove a step. Anything that routed to it now routes to where it would have
 * gone, so the path stays connected instead of silently ending.
 */
export function removeStep(graph: Graph, key: string): Graph {
  const removed = graph.steps.find((s) => s.key === key);
  if (!removed) return graph;
  const bridge = happyNext(removed);
  const steps = graph.steps
    .filter((s) => s.key !== key)
    .map((s) => replaceTarget(s, key, bridge === key ? null : bridge));
  const start =
    graph.start === key ? (bridge ?? steps[0]?.key ?? "") : graph.start;
  return { start, steps: renumber(steps) };
}

/** Rename a step key and every reference to it. */
export function renameStepKey(graph: Graph, from: string, to: string): Graph {
  if (!to || from === to || graph.steps.some((s) => s.key === to)) return graph;
  return {
    start: graph.start === from ? to : graph.start,
    steps: graph.steps.map((s) => {
      const renamed = s.key === from ? { ...s, key: to } : s;
      return replaceTarget(renamed, from, to);
    }),
  };
}

export function moveStep(graph: Graph, key: string, direction: -1 | 1): Graph {
  const index = graph.steps.findIndex((s) => s.key === key);
  const target = index + direction;
  if (index === -1 || target < 0 || target >= graph.steps.length) return graph;
  const steps = [...graph.steps];
  [steps[index], steps[target]] = [steps[target]!, steps[index]!];
  return { ...graph, steps: renumber(steps) };
}

/* -------------------------------------------------------------------------- */
/*                               pre-publish checks                            */
/* -------------------------------------------------------------------------- */

export interface GraphIssue {
  /** Step the issue belongs to, or null for the workflow as a whole. */
  stepKey: string | null;
  message: string;
}

/** Keys of every step the request can actually get to from the first step. */
export function reachableKeys(graph: Graph): Set<string> {
  const byKey = new Map(graph.steps.map((s) => [s.key, s]));
  const seen = new Set<string>();
  const queue = graph.start ? [graph.start] : [];
  while (queue.length) {
    const key = queue.shift()!;
    if (seen.has(key)) continue;
    const step = byKey.get(key);
    if (!step) continue;
    seen.add(key);
    queue.push(...targetsOf(step));
  }
  return seen;
}

/**
 * What would stop this workflow working, in plain words. The server runs its
 * own publish validation; this catches the common mistakes while editing.
 */
export function checkGraph(graph: Graph): GraphIssue[] {
  const issues: GraphIssue[] = [];
  const keys = new Set(graph.steps.map((s) => s.key));

  if (graph.steps.length === 0) {
    return [{ stepKey: null, message: "Add at least one step." }];
  }
  if (!graph.start || !keys.has(graph.start)) {
    issues.push({ stepKey: null, message: "Choose the first step." });
  }

  const seenKeys = new Set<string>();
  for (const step of graph.steps) {
    const label = `“${stepName(step)}”`;
    if (seenKeys.has(step.key)) {
      issues.push({
        stepKey: step.key,
        message: `${label} shares its key with another step.`,
      });
    }
    seenKeys.add(step.key);

    for (const target of targetsOf(step)) {
      if (!keys.has(target)) {
        issues.push({
          stepKey: step.key,
          message: `${label} routes to a step that no longer exists.`,
        });
      }
      if (target === step.key) {
        issues.push({
          stepKey: step.key,
          message: `${label} routes to itself.`,
        });
      }
    }

    const cfg = step.config;
    if (HUMAN_STEP_TYPES.has(step.type)) {
      const assignees = Array.isArray(cfg.assignees) ? cfg.assignees : [];
      if (assignees.length === 0) {
        issues.push({
          stepKey: step.key,
          message: `${label} has nobody assigned. Choose who ${step.type === "APPROVAL" ? "approves" : "does it"}.`,
        });
      }
      for (const raw of assignees) {
        const a = raw as Record<string, unknown>;
        const incomplete =
          (a.kind === "USER" && !a.userId) ||
          (a.kind === "ROLE" && !a.roleId) ||
          (a.kind === "FIELD_USER" && !a.fieldKey) ||
          (a.kind === "ACCESS_SERVICE_ROLE" && !a.serviceSnapshotKey) ||
          (a.kind === "FALLBACK" && !a.fallbackFieldKey) ||
          (a.kind === "OPTION_USERS" && (!a.fieldKey || !hasOptionUsers(a)));
        if (incomplete) {
          issues.push({
            stepKey: step.key,
            message: `${label} has an assignee that isn't fully chosen.`,
          });
          break;
        }
      }
    }
    if (
      step.type === "APPROVAL" &&
      cfg.onlyWhenServiceRequiresManagerApproval !== undefined &&
      !String(cfg.onlyWhenServiceRequiresManagerApproval ?? "").trim()
    ) {
      issues.push({
        stepKey: step.key,
        message: `${label} depends on the chosen service; pick the service field.`,
      });
    }
    if (step.type === "APPROVAL" && cfg.multiAssigneePolicy === "QUORUM") {
      const quorum = Number(cfg.quorum);
      if (!Number.isInteger(quorum) || quorum < 1) {
        issues.push({
          stepKey: step.key,
          message: `${label} needs the number of approvals required.`,
        });
      }
    }
    if (step.type === "NOTIFICATION" && !String(cfg.templateKey ?? "").trim()) {
      issues.push({
        stepKey: step.key,
        message: `${label} needs an email template.`,
      });
    }
    if (
      step.type === "WEBHOOK" &&
      !/^https?:\/\/\S+$/.test(String(cfg.url ?? ""))
    ) {
      issues.push({
        stepKey: step.key,
        message: `${label} needs a valid URL.`,
      });
    }
    if (step.type === "DELAY" && !(Number(cfg.durationMs) > 0)) {
      issues.push({
        stepKey: step.key,
        message: `${label} needs a wait longer than zero.`,
      });
    }
    if (step.type === "SUB_WORKFLOW" && !String(cfg.childFormId ?? "").trim()) {
      issues.push({
        stepKey: step.key,
        message: `${label} needs the form to open.`,
      });
    }
  }

  if (graph.start && keys.has(graph.start)) {
    const live = reachableKeys(graph);
    for (const step of graph.steps) {
      if (!live.has(step.key)) {
        issues.push({
          stepKey: step.key,
          message: `“${stepName(step)}” is never reached. Connect it, or remove it.`,
        });
      }
    }
  }
  return issues;
}

/* -------------------------------------------------------------------------- */
/*                                  templates                                  */
/* -------------------------------------------------------------------------- */

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  build: () => Graph;
}

function chain(steps: Array<Omit<StepDef, "position" | "next">>): Graph {
  const wired = steps.map((step, index) => {
    const base: StepDef = { ...step, position: index + 1 };
    const following = steps[index + 1];
    return following ? withHappyNext(base, following.key) : base;
  });
  return { start: wired[0]?.key ?? "", steps: wired };
}

const managerApproval = (): Omit<StepDef, "position" | "next"> => ({
  key: "manager_approval",
  type: "APPROVAL",
  name: "Line manager approval",
  config: {
    type: "APPROVAL",
    assignees: [{ kind: "REQUESTER_MANAGER" }],
    multiAssigneePolicy: "ANY",
    allowReject: true,
  },
});

export const WORKFLOW_TEMPLATES: readonly WorkflowTemplate[] = [
  {
    id: "manager",
    name: "Line manager approval",
    description:
      "The requester's manager approves, then the request is complete.",
    build: () => chain([managerApproval()]),
  },
  {
    id: "manager-team",
    name: "Manager approval, then a team does the work",
    description:
      "Manager approves, a team completes the task, the requester is told.",
    build: () =>
      chain([
        managerApproval(),
        {
          key: "fulfilment",
          type: "EXECUTION",
          name: "Fulfil the request",
          config: { type: "EXECUTION", assignees: [] },
        },
        {
          key: "requester_informed",
          type: "INFO_ACK",
          name: "Requester informed",
          config: {
            type: "INFO_ACK",
            assignees: [{ kind: "REQUESTER" }],
            message: "Your request has been completed.",
          },
        },
      ]),
  },
  {
    id: "two-approvals",
    name: "Two approvals",
    description: "Manager approves, then a second approver (e.g. security).",
    build: () =>
      chain([
        managerApproval(),
        {
          key: "second_approval",
          type: "APPROVAL",
          name: "Security review",
          config: {
            type: "APPROVAL",
            assignees: [],
            multiAssigneePolicy: "ANY",
            allowReject: true,
          },
        },
      ]),
  },
];
