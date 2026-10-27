/**
 * Contract for AI-drafted workflows.
 *
 * Two halves that must stay in step: `buildWorkflowPrompt` describes the
 * shape to the assistant, and `GeneratedWorkflowSchema` enforces it on the
 * way back in. They live in one file so a change to either is impossible to
 * make without seeing the other — drift between them would show up as
 * replies that look right and never validate.
 *
 * Model output is untrusted input. A pasted reply is held to the same
 * contract a hand-authored draft satisfies; carrying it here by hand earns
 * it no shortcut.
 */

import { z } from "zod";

/**
 * Step types the engine has an executor for, with the palette grouping and
 * one-line meaning the builder shows. The assistant gets these verbatim so
 * it picks a type for the right reason.
 *
 * WAIT_FOR_EVENT is deliberately absent: the draft API rejects it too, and a
 * generated workflow blocking on an event nobody wired up would simply hang.
 */
export const AI_STEP_TYPES = [
  {
    type: "APPROVAL",
    group: "Human",
    means: "Approver decides approve/reject",
  },
  {
    type: "EXECUTION",
    group: "Human",
    means: "Assignee marks the work complete",
  },
  { type: "INFO_ACK", group: "Human", means: "User reads & acknowledges" },
  {
    type: "AUTOMATION",
    group: "Automation",
    means: "Engine runs a registered handler",
  },
  {
    type: "NOTIFICATION",
    group: "Automation",
    means: "Send a templated email, no action",
  },
  {
    type: "WEBHOOK",
    group: "Automation",
    means: "Call external HTTP endpoint",
  },
  {
    type: "CONDITIONAL_BRANCH",
    group: "Routing",
    means: "Route by field-value rules",
  },
  { type: "DELAY", group: "Routing", means: "Wait N business days/hours" },
  {
    type: "SCHEDULE",
    group: "Routing",
    means: "Wait for window respecting blackouts",
  },
  {
    type: "SUB_WORKFLOW",
    group: "Routing",
    means: "Submit a child request and wait",
  },
] as const;

export const AI_ALLOWED_STEP_TYPES = AI_STEP_TYPES.map((s) => s.type) as [
  string,
  ...string[],
];

/**
 * Field types the form builder offers, mirroring its own dropdown.
 * MULTI_USER_PICKER is absent on purpose — the builder does not list it.
 */
export const AI_ALLOWED_FIELD_TYPES = [
  "SHORT_TEXT",
  "LONG_TEXT",
  "NUMBER",
  "DATE",
  "DATETIME",
  "DROPDOWN",
  "MULTI_SELECT",
  "CHECKBOX",
  "FILE",
  "USER_PICKER",
  "REQUEST_LINK",
  "LOOKUP",
  "SCORED_MATRIX",
  "REPEATER",
  "COMPUTED",
  "SECTION_HEADER",
  "SYSTEM_FIELD",
] as const;

/** How a field behaves on a given step. */
export const AI_FIELD_STATES = ["EDITABLE", "READ_ONLY", "HIDDEN"] as const;

/**
 * How a step's assignee is resolved at runtime, with the meaning the builder
 * shows. The assistant proposes these by name; a person wires the concrete
 * users afterwards.
 */
export const AI_ASSIGNEE_KINDS = [
  { kind: "REQUESTER", means: "The person who submitted the request" },
  { kind: "REQUESTER_MANAGER", means: "The requester's line manager" },
  { kind: "ROLE", means: "Anyone holding a named role — needs roleName" },
  {
    kind: "FIELD_USER",
    means: "The user picked in a form field — needs fieldKey",
  },
  {
    kind: "ACCESS_SERVICE_ROLE",
    means: "Owner/Cybersecurity/Implementer of the selected access service",
  },
  {
    kind: "FALLBACK",
    means: "Requester's manager, falling back to a field when empty",
  },
] as const;

/** Roles within an access service, for ACCESS_SERVICE_ROLE assignees. */
export const AI_SERVICE_ROLES = [
  "OWNER",
  "CYBERSECURITY",
  "IMPLEMENTER",
] as const;

/** Policies for a step with more than one assignee, as the builder offers them. */
export const AI_MULTI_ASSIGNEE_POLICIES = [
  "ANY",
  "ALL",
  "MAJORITY",
  "UNANIMOUS",
  "QUORUM",
] as const;

/** Handlers the AUTOMATION executor can run. */
export const AI_AUTOMATION_HANDLERS = [
  "auto-approve",
  "set-field",
  "generate-reference-number",
] as const;

/** HTTP methods the WEBHOOK step offers. */
export const AI_WEBHOOK_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
] as const;

const keyRegex = /^[a-z0-9_]+$/i;

/**
 * USER is deliberately not offered: the assistant has no access to the user
 * directory, so naming a specific person would be a guess. Roles are named,
 * not id'd, and resolved against the live role list on paste.
 */
const generatedAssigneeSchema = z.union([
  z.object({ kind: z.literal("REQUESTER") }),
  z.object({ kind: z.literal("REQUESTER_MANAGER") }),
  z.object({ kind: z.literal("ROLE"), roleName: z.string().min(1) }),
  z.object({ kind: z.literal("FIELD_USER"), fieldKey: z.string().min(1) }),
  z.object({
    kind: z.literal("ACCESS_SERVICE_ROLE"),
    // Key of the LOOKUP[ACCESS_SERVICES] field the requester picks a service
    // in; the engine resolves that service's people at runtime.
    serviceSnapshotKey: z.string().min(1),
    // Stored as "role", not "serviceRole" — matches what the builder writes.
    role: z.enum(AI_SERVICE_ROLES),
  }),
  z.object({
    kind: z.literal("FALLBACK"),
    primary: z.object({ kind: z.literal("REQUESTER_MANAGER") }),
    fallbackFieldKey: z.string().min(1),
  }),
]);

const generatedStepSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(80)
    .regex(keyRegex, "Step key may only contain letters, digits and _"),
  type: z.enum(AI_ALLOWED_STEP_TYPES),
  position: z.number().int().nonnegative(),
  next: z
    .union([
      z.object({ default: z.string().min(1) }),
      z.object({ onAction: z.record(z.string(), z.string().min(1)) }),
    ])
    .optional(),
  // Assignees live inside config, matching what the engine stores.
  config: z
    .object({ assignees: z.array(generatedAssigneeSchema).max(5).optional() })
    .passthrough()
    .default({}),
});

const generatedFieldSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(80)
    .regex(keyRegex, "Field key may only contain letters, digits and _"),
  label: z.string().min(1).max(200),
  type: z.enum(AI_ALLOWED_FIELD_TYPES),
  required: z.boolean().optional(),
  position: z.number().int().nonnegative(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const GeneratedWorkflowSchema = z.object({
  summary: z.string().min(1).max(500),
  start: z.string().min(1),
  steps: z.array(generatedStepSchema).min(1).max(30),
  fields: z.array(generatedFieldSchema).max(40).optional(),
  /** stepKey -> fieldKey -> state. Anything unlisted defaults to EDITABLE. */
  perStepFieldState: z
    .record(z.string(), z.record(z.string(), z.enum(AI_FIELD_STATES)))
    .optional(),
});

export type GeneratedWorkflowDTO = z.infer<typeof GeneratedWorkflowSchema>;

/**
 * Structural checks Zod cannot express: a schema-valid draft can still name a
 * `start`, a `next` target, or a field-state key that does not exist, which
 * would strand the engine at runtime.
 *
 * @returns Human-readable problems; empty when the draft is sound.
 */
export function findGraphProblems(
  draft: GeneratedWorkflowDTO,
  /** Live role names; when given, ROLE assignees must match one exactly. */
  knownRoleNames?: string[],
): string[] {
  const problems: string[] = [];
  const stepKeys = new Set(draft.steps.map((s) => s.key));
  const fieldKeys = new Set((draft.fields ?? []).map((f) => f.key));

  if (stepKeys.size !== draft.steps.length) {
    problems.push("Two or more steps share the same key.");
  }

  if (!stepKeys.has(draft.start)) {
    problems.push(`Start step "${draft.start}" is not one of the steps.`);
  }

  for (const step of draft.steps) {
    if (!step.next) continue;

    const targets =
      "default" in step.next
        ? [step.next.default]
        : Object.values(step.next.onAction);

    for (const target of targets) {
      if (!stepKeys.has(target)) {
        problems.push(`Step "${step.key}" points at unknown step "${target}".`);
      }
    }
  }

  // Assignees name roles and fields that have to resolve.
  const roleSet = knownRoleNames ? new Set(knownRoleNames) : null;
  for (const step of draft.steps) {
    for (const assignee of step.config.assignees ?? []) {
      if (
        assignee.kind === "ROLE" &&
        roleSet &&
        !roleSet.has(assignee.roleName)
      ) {
        problems.push(
          `Step "${step.key}" assigns unknown role "${assignee.roleName}".`,
        );
      }

      if (
        assignee.kind === "FIELD_USER" &&
        fieldKeys.size > 0 &&
        !fieldKeys.has(assignee.fieldKey)
      ) {
        problems.push(
          `Step "${step.key}" assigns the user from unknown field "${assignee.fieldKey}".`,
        );
      }

      if (
        assignee.kind === "ACCESS_SERVICE_ROLE" &&
        fieldKeys.size > 0 &&
        !fieldKeys.has(assignee.serviceSnapshotKey)
      ) {
        problems.push(
          `Step "${step.key}" reads the service from unknown field "${assignee.serviceSnapshotKey}".`,
        );
      }

      if (
        assignee.kind === "FALLBACK" &&
        fieldKeys.size > 0 &&
        !fieldKeys.has(assignee.fallbackFieldKey)
      ) {
        problems.push(
          `Step "${step.key}" falls back to unknown field "${assignee.fallbackFieldKey}".`,
        );
      }
    }
  }

  const terminals = draft.steps.filter((s) => !s.next);
  if (terminals.length === 0) {
    problems.push("No terminal step — every step points somewhere onward.");
  }

  // Field states reference both axes, so both have to resolve.
  for (const [stepKey, states] of Object.entries(
    draft.perStepFieldState ?? {},
  )) {
    if (!stepKeys.has(stepKey)) {
      problems.push(`Field state refers to unknown step "${stepKey}".`);
      continue;
    }

    for (const fieldKey of Object.keys(states)) {
      if (fieldKeys.size > 0 && !fieldKeys.has(fieldKey)) {
        problems.push(
          `Step "${stepKey}" sets a state for unknown field "${fieldKey}".`,
        );
      }
    }
  }

  return problems;
}

export interface WorkflowPromptContext {
  /** The workflow's name, so the assistant drafts for the right thing. */
  workflowName?: string;
  /** The workflow's description, when the author wrote one. */
  workflowDescription?: string;
  /** Keys already on the canvas, offered for reuse. */
  existingStepKeys?: string[];
  /** Live role names, so the assistant picks real ones instead of inventing. */
  roleNames?: string[];
  /** Access services in the catalog, for ACCESS_SERVICE_ROLE assignees. */
  accessServiceNames?: string[];
}

/**
 * Build the prompt a user copies into their own AI assistant.
 *
 * Self-contained instructions that end with an invitation to describe the
 * process — the user types that part into the chat, exactly as they would
 * paste data under a "paste your data here" prompt. Everything the assistant
 * needs about this system is inlined, because it has no access to it and
 * cannot ask follow-up questions.
 */
export function buildWorkflowPrompt(
  context: WorkflowPromptContext = {},
): string {
  const palette = AI_STEP_TYPES.map(
    (s) => `  ${s.type.padEnd(19)} (${s.group}) — ${s.means}`,
  ).join("\n");

  const formSection = `
"fields" — the form the requester fills in (max 40):
  { "key": snake_case, "label": string, "type": <field type>, "required"?: boolean, "position": integer }

  Field types:
${AI_ALLOWED_FIELD_TYPES.map((t) => `    ${t}`).join("\n")}

"perStepFieldState" — how each field behaves on each step:
  { "<step key>": { "<field key>": "EDITABLE" | "READ_ONLY" | "HIDDEN" } }

  This is the important part. A field a requester fills in should usually be
  READ_ONLY once the request is under review, so approvers see what was
  submitted without it changing underneath them. Fields only a later step
  needs should be HIDDEN earlier. Anything you omit defaults to EDITABLE.

  Every step key and field key used here must exist above.

  Include "fields" and "perStepFieldState" only if the description asks for a
  form, or the workflow plainly needs one. Otherwise omit both keys.
`;

  const reuse = context.existingStepKeys?.length
    ? `\nReuse these step keys where they still apply: ${context.existingStepKeys.join(", ")}.`
    : "";

  const kinds = AI_ASSIGNEE_KINDS.map(
    (a) => `  ${a.kind.padEnd(21)} — ${a.means}`,
  ).join("\n");

  const roleList = context.roleNames?.length
    ? `\n  Roles available in this system — use the name EXACTLY as written,
  and if none fits, omit the assignee rather than inventing one:
${context.roleNames.map((r) => `    ${r}`).join("\n")}`
    : "";

  const serviceSection = context.accessServiceNames?.length
    ? `

  ACCESS SERVICES — this system keeps a catalog of IT services, each with its
  own Owner, Cybersecurity approver and Implementer. To route a step to those
  people instead of a fixed role:
    1. add a LOOKUP field with { "config": { "dataSource": "ACCESS_SERVICES" } }
       so the requester picks the service, and
    2. point the assignee's "serviceSnapshotKey" at that field's key.
  The engine then resolves whoever holds that role on the chosen service.

  Services currently in the catalog:
${context.accessServiceNames.map((n) => `    ${n}`).join("\n")}`
    : "";

  const assigneeSection = `${kinds}

  Shapes:
    { "kind": "REQUESTER" }
    { "kind": "REQUESTER_MANAGER" }
    { "kind": "ROLE", "roleName": "<role name>" }
    { "kind": "FIELD_USER", "fieldKey": "<field key>" }
    { "kind": "ACCESS_SERVICE_ROLE", "serviceSnapshotKey": "<LOOKUP field key>",
      "role": "${AI_SERVICE_ROLES.join('" | "')}" }
    { "kind": "FALLBACK", "primary": { "kind": "REQUESTER_MANAGER" },
      "fallbackFieldKey": "<USER_PICKER field key>" }

  Never name a specific person — there is no user directory here.${roleList}${serviceSection}
`;

  const about = [
    context.workflowName ? `Workflow name: ${context.workflowName}` : null,
    context.workflowDescription
      ? `Workflow description: ${context.workflowDescription}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `You are designing an approval workflow for an enterprise IT service
management system (TechHub). Reply with ONE JSON object and nothing else —
no markdown fences, no commentary.

STEP TYPES — use only these:
${palette}

SHAPE:
{
  "summary": string,            // one or two sentences
  "start": string,              // key of the first step
  "steps": [
    {
      "key": string,            // snake_case, unique, descriptive
                                // (manager_approval, not step_1)
      "type": <step type>,
      "position": integer,      // 0-based
      "next": object,           // omit on the terminal step
      "config": object          // {} when nothing to set
    }
  ],
  "fields": [...],              // optional — see below
  "perStepFieldState": {...}    // optional — see below
}

ROUTING:
- APPROVAL branches on the decision:
    { "onAction": { "APPROVE": "<step key>", "REJECT": "<step key>" } }
- Every other type follows one edge:
    { "default": "<step key>" }
- Every key named in "next" must be a step in this same reply.
- At least one step omits "next" — the terminal step. A rejection path
  usually ends at its own terminal step.

STEP CONFIG — "config" is per type and MUST carry its own "type" key:

  APPROVAL
    { "type": "APPROVAL", "assignees": [...], "allowReject": true,
      "multiAssigneePolicy": "${AI_MULTI_ASSIGNEE_POLICIES.join('" | "')}" }
    ANY = one vote is enough. ALL/UNANIMOUS = everyone. QUORUM = a threshold.

  EXECUTION
    { "type": "EXECUTION", "assignees": [...] }

  INFO_ACK
    { "type": "INFO_ACK", "assignees": [...] }

  AUTOMATION
    { "type": "AUTOMATION", "handler": "${AI_AUTOMATION_HANDLERS.join('" | "')}" }

  NOTIFICATION
    { "type": "NOTIFICATION", "templateKey": "" }
    Leave templateKey empty — a person picks the email template.

  CONDITIONAL_BRANCH
    { "type": "CONDITIONAL_BRANCH", "branches": [] }
    Leave branches empty — the rules are built in the UI. Route with "next".

  DELAY
    { "type": "DELAY", "durationMs": <milliseconds> }
    Milliseconds, not days. One business day ≈ 86400000.

  SCHEDULE
    { "type": "SCHEDULE" }
    Windows and blackout periods are configured separately.

  WEBHOOK
    { "type": "WEBHOOK", "url": "", "method": "${AI_WEBHOOK_METHODS.join('" | "')}",
      "failOnError": true }
    Leave url empty — never invent an endpoint.

  SUB_WORKFLOW
    { "type": "SUB_WORKFLOW", "childFormId": "", "waitForOutcome": true }
    Leave childFormId empty — a person picks the child form.

ASSIGNEES — who acts on a step. They live INSIDE config, not beside it,
and apply to APPROVAL, EXECUTION and INFO_ACK:
  "config": { "type": "...", "assignees": [ { "kind": ..., ... } ] }   // max 5

${assigneeSection}
${formSection}
RULES:
- Keep it as short as the description genuinely requires. Do not invent
  approval layers, notifications, or delays nobody asked for.
- Prefer an obvious, conventional shape over a clever one. A person reviews
  this before anything is published.${reuse}

${about ? `${about}\n\n` : ""}Now describe the process you want, in your own words, and reply with the
JSON object only.`;
}
