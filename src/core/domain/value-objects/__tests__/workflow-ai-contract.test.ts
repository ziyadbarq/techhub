/**
 * The AI assistant's output is untrusted input. These tests pin the two
 * guards that stand between a model response and the draft store: the Zod
 * contract and the graph check.
 */

import { describe, expect, it } from "vitest";

import {
  AI_ALLOWED_FIELD_TYPES,
  AI_ALLOWED_STEP_TYPES,
  AI_ASSIGNEE_KINDS,
  AI_MULTI_ASSIGNEE_POLICIES,
  AI_STEP_TYPES,
  GeneratedWorkflowSchema,
  buildWorkflowPrompt,
  findGraphProblems,
  type GeneratedWorkflowDTO,
} from "../workflow-ai-contract";

const validDraft: GeneratedWorkflowDTO = {
  summary: "Manager approves, then IT provisions.",
  start: "manager_approval",
  steps: [
    {
      key: "manager_approval",
      type: "APPROVAL",
      position: 0,
      next: {
        onAction: { APPROVE: "it_provision", REJECT: "notify_rejected" },
      },
      config: {},
    },
    { key: "it_provision", type: "EXECUTION", position: 1, config: {} },
    { key: "notify_rejected", type: "NOTIFICATION", position: 2, config: {} },
  ],
};

describe("GeneratedWorkflowSchema", () => {
  it("accepts a well-formed draft", () => {
    expect(GeneratedWorkflowSchema.safeParse(validDraft).success).toBe(true);
  });

  it("rejects a step type the engine has no executor for", () => {
    const result = GeneratedWorkflowSchema.safeParse({
      ...validDraft,
      steps: [{ key: "a", type: "DELETE_DATABASE", position: 0, config: {} }],
      start: "a",
    });

    expect(result.success).toBe(false);
  });

  it("rejects WAIT_FOR_EVENT, which the draft API also refuses", () => {
    const result = GeneratedWorkflowSchema.safeParse({
      ...validDraft,
      steps: [{ key: "a", type: "WAIT_FOR_EVENT", position: 0, config: {} }],
      start: "a",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a step key with characters the draft route forbids", () => {
    const result = GeneratedWorkflowSchema.safeParse({
      ...validDraft,
      start: "bad key!",
      steps: [{ key: "bad key!", type: "APPROVAL", position: 0, config: {} }],
    });

    expect(result.success).toBe(false);
  });

  it("caps the number of steps so one call cannot balloon", () => {
    const steps = Array.from({ length: 31 }, (_, i) => ({
      key: `step_${i}`,
      type: "EXECUTION" as const,
      position: i,
      config: {},
    }));

    const result = GeneratedWorkflowSchema.safeParse({
      ...validDraft,
      start: "step_0",
      steps,
    });

    expect(result.success).toBe(false);
  });
});

describe("findGraphProblems", () => {
  it("reports nothing for a sound graph", () => {
    expect(findGraphProblems(validDraft)).toEqual([]);
  });

  it("catches a start step that does not exist", () => {
    const problems = findGraphProblems({ ...validDraft, start: "ghost" });

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("ghost");
  });

  it("catches a next target that does not exist", () => {
    const problems = findGraphProblems({
      ...validDraft,
      steps: [
        {
          key: "manager_approval",
          type: "APPROVAL",
          position: 0,
          next: { default: "nowhere" },
          config: {},
        },
      ],
    });

    expect(problems.some((p) => p.includes("nowhere"))).toBe(true);
  });

  it("catches duplicate step keys", () => {
    const problems = findGraphProblems({
      ...validDraft,
      start: "dup",
      steps: [
        { key: "dup", type: "EXECUTION", position: 0, config: {} },
        { key: "dup", type: "EXECUTION", position: 1, config: {} },
      ],
    });

    expect(problems.some((p) => p.includes("same key"))).toBe(true);
  });

  it("catches an unreachable branch target in onAction", () => {
    const problems = findGraphProblems({
      ...validDraft,
      steps: [
        {
          key: "manager_approval",
          type: "APPROVAL",
          position: 0,
          next: { onAction: { APPROVE: "it_provision", REJECT: "missing" } },
          config: {},
        },
        { key: "it_provision", type: "EXECUTION", position: 1, config: {} },
      ],
    });

    expect(problems.some((p) => p.includes("missing"))).toBe(true);
  });
});

describe("buildWorkflowPrompt", () => {
  it("names every allowed step type so the model cannot invent one", () => {
    const prompt = buildWorkflowPrompt();

    for (const type of AI_ALLOWED_STEP_TYPES) {
      expect(prompt).toContain(type);
    }
  });

  it("offers existing step keys for reuse when the canvas is not empty", () => {
    const prompt = buildWorkflowPrompt({
      existingStepKeys: ["manager_approval", "it_provision"],
    });

    expect(prompt).toContain("manager_approval, it_provision");
  });

  it("does not mention reuse when the canvas is empty", () => {
    expect(buildWorkflowPrompt()).not.toContain(
      "Reuse these existing step keys",
    );
  });
});

describe("field state validation", () => {
  const withFields: GeneratedWorkflowDTO = {
    ...validDraft,
    fields: [
      {
        key: "justification",
        label: "Justification",
        type: "LONG_TEXT",
        position: 0,
      },
    ],
    perStepFieldState: {
      manager_approval: { justification: "READ_ONLY" },
    },
  };

  it("accepts states that reference a real step and field", () => {
    expect(GeneratedWorkflowSchema.safeParse(withFields).success).toBe(true);
    expect(findGraphProblems(withFields)).toEqual([]);
  });

  it("rejects a state value outside EDITABLE/READ_ONLY/HIDDEN", () => {
    const result = GeneratedWorkflowSchema.safeParse({
      ...withFields,
      perStepFieldState: { manager_approval: { justification: "DELETED" } },
    });

    expect(result.success).toBe(false);
  });

  it("catches a state attached to a step that does not exist", () => {
    const problems = findGraphProblems({
      ...withFields,
      perStepFieldState: { ghost_step: { justification: "HIDDEN" } },
    });

    expect(problems.some((p) => p.includes("ghost_step"))).toBe(true);
  });

  it("catches a state attached to a field that does not exist", () => {
    const problems = findGraphProblems({
      ...withFields,
      perStepFieldState: { manager_approval: { not_a_field: "HIDDEN" } },
    });

    expect(problems.some((p) => p.includes("not_a_field"))).toBe(true);
  });

  it("rejects a field key with illegal characters", () => {
    const result = GeneratedWorkflowSchema.safeParse({
      ...withFields,
      fields: [{ key: "bad key!", label: "X", type: "LONG_TEXT", position: 0 }],
    });

    expect(result.success).toBe(false);
  });
});

describe("terminal step", () => {
  it("catches a workflow where every step points onward", () => {
    const problems = findGraphProblems({
      ...validDraft,
      start: "a",
      steps: [
        {
          key: "a",
          type: "EXECUTION",
          position: 0,
          next: { default: "b" },
          config: {},
        },
        {
          key: "b",
          type: "EXECUTION",
          position: 1,
          next: { default: "a" },
          config: {},
        },
      ],
    });

    expect(problems.some((p) => p.includes("terminal"))).toBe(true);
  });
});

describe("prompt carries full system capability", () => {
  it("lists every step type with its palette group and meaning", () => {
    const prompt = buildWorkflowPrompt();

    for (const step of AI_STEP_TYPES) {
      expect(prompt).toContain(step.type);
      expect(prompt).toContain(step.means);
    }
  });

  it("explains the per-step field state model when fields are requested", () => {
    const prompt = buildWorkflowPrompt();

    expect(prompt).toContain("perStepFieldState");
    expect(prompt).toContain("READ_ONLY");
    expect(prompt).toContain("HIDDEN");
  });

  it("includes the workflow name and description when known", () => {
    const prompt = buildWorkflowPrompt({
      workflowName: "Access Request Workflow",
      workflowDescription: "Grants access to internal systems",
    });

    expect(prompt).toContain("Access Request Workflow");
    expect(prompt).toContain("Grants access to internal systems");
  });

  it("offers the multi-assignee policies", () => {
    const prompt = buildWorkflowPrompt();

    for (const policy of AI_MULTI_ASSIGNEE_POLICIES) {
      expect(prompt).toContain(policy);
    }
  });
});

describe("assignees", () => {
  const withAssignees: GeneratedWorkflowDTO = {
    ...validDraft,
    fields: [
      { key: "approver", label: "Approver", type: "USER_PICKER", position: 0 },
    ],
    steps: validDraft.steps.map((step, i) =>
      i === 0
        ? {
            ...step,
            config: {
              assignees: [{ kind: "ROLE", roleName: "security-officer" }],
            },
          }
        : step,
    ),
  };

  it("accepts a role that exists", () => {
    expect(
      findGraphProblems(withAssignees, ["security-officer", "auditor"]),
    ).toEqual([]);
  });

  it("catches a role the system does not have", () => {
    const problems = findGraphProblems(withAssignees, ["auditor"]);

    expect(problems.some((p) => p.includes("security-officer"))).toBe(true);
  });

  it("skips the role check when no role list is supplied", () => {
    expect(findGraphProblems(withAssignees)).toEqual([]);
  });

  it("catches FIELD_USER pointing at a field that does not exist", () => {
    const problems = findGraphProblems({
      ...withAssignees,
      steps: withAssignees.steps.map((step, i) =>
        i === 0
          ? {
              ...step,
              config: {
                assignees: [{ kind: "FIELD_USER", fieldKey: "ghost" }],
              },
            }
          : step,
      ),
    });

    expect(problems.some((p) => p.includes("ghost"))).toBe(true);
  });

  it("rejects an assignee kind that is not supported", () => {
    const result = GeneratedWorkflowSchema.safeParse({
      ...validDraft,
      steps: [
        {
          key: "a",
          type: "APPROVAL",
          position: 0,
          config: { assignees: [{ kind: "CEO" }] },
        },
      ],
      start: "a",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a USER assignee — there is no directory to name people from", () => {
    const result = GeneratedWorkflowSchema.safeParse({
      ...validDraft,
      steps: [
        {
          key: "a",
          type: "APPROVAL",
          position: 0,
          config: { assignees: [{ kind: "USER", userId: "abc" }] },
        },
      ],
      start: "a",
    });

    expect(result.success).toBe(false);
  });

  it("lists the real roles in the prompt and warns against inventing", () => {
    const prompt = buildWorkflowPrompt({
      roleNames: ["asset-coordinator", "security-officer"],
    });

    expect(prompt).toContain("asset-coordinator");
    expect(prompt).toContain("security-officer");
    expect(prompt).toContain("EXACTLY as written");
  });

  it("names every assignee kind in the prompt", () => {
    const prompt = buildWorkflowPrompt();

    for (const a of AI_ASSIGNEE_KINDS) {
      expect(prompt).toContain(a.kind);
    }
  });
});

describe("access service routing", () => {
  const serviceDraft: GeneratedWorkflowDTO = {
    summary: "Service owner approves, implementer provisions.",
    start: "owner_approval",
    steps: [
      {
        key: "owner_approval",
        type: "APPROVAL",
        position: 0,
        config: {
          assignees: [
            {
              kind: "ACCESS_SERVICE_ROLE",
              serviceSnapshotKey: "service",
              role: "OWNER",
            },
          ],
        },
        next: { onAction: { APPROVE: "provision", REJECT: "rejected" } },
      },
      { key: "provision", type: "EXECUTION", position: 1, config: {} },
      { key: "rejected", type: "NOTIFICATION", position: 2, config: {} },
    ],
    fields: [{ key: "service", label: "Service", type: "LOOKUP", position: 0 }],
  };

  it("accepts a service-routed step backed by a LOOKUP field", () => {
    expect(GeneratedWorkflowSchema.safeParse(serviceDraft).success).toBe(true);
    expect(findGraphProblems(serviceDraft)).toEqual([]);
  });

  it("catches a service read from a field that does not exist", () => {
    const problems = findGraphProblems({
      ...serviceDraft,
      steps: serviceDraft.steps.map((step, i) =>
        i === 0
          ? {
              ...step,
              config: {
                assignees: [
                  {
                    kind: "ACCESS_SERVICE_ROLE",
                    serviceSnapshotKey: "ghost",
                    role: "OWNER",
                  },
                ],
              },
            }
          : step,
      ),
    });

    expect(problems.some((p) => p.includes("ghost"))).toBe(true);
  });

  it("rejects a service role outside the three the catalog defines", () => {
    const result = GeneratedWorkflowSchema.safeParse({
      ...serviceDraft,
      steps: [
        {
          key: "a",
          type: "APPROVAL",
          position: 0,
          config: {
            assignees: [
              {
                kind: "ACCESS_SERVICE_ROLE",
                serviceSnapshotKey: "service",
                role: "CEO",
              },
            ],
          },
        },
      ],
      start: "a",
    });

    expect(result.success).toBe(false);
  });

  it("supports LOOKUP, the field type the catalog needs", () => {
    expect(AI_ALLOWED_FIELD_TYPES).toContain("LOOKUP");
  });

  it("lists the catalog's services in the prompt", () => {
    const prompt = buildWorkflowPrompt({ accessServiceNames: ["vpn", "jira"] });

    expect(prompt).toContain("ACCESS SERVICES");
    expect(prompt).toContain("vpn");
    expect(prompt).toContain("jira");
    expect(prompt).toContain("ACCESS_SERVICES");
  });

  it("omits the catalog section when there are no services", () => {
    expect(buildWorkflowPrompt()).not.toContain("Services currently in the");
  });
});
