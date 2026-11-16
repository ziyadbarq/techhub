import { describe, expect, it } from "vitest";
import {
  checkGraph,
  createStep,
  happyNext,
  insertStep,
  removeStep,
  renameStepKey,
  stepName,
  targetsOf,
  withHappyNext,
  WORKFLOW_TEMPLATES,
  type Graph,
  type StepDef,
} from "../graph";
import {
  describeAssignee,
  summariseAssignees,
  approvalRuleLabel,
} from "../assignees";

const approval = (key: string, next?: StepDef["next"]): StepDef => ({
  key,
  type: "APPROVAL",
  position: 1,
  next,
  config: { type: "APPROVAL", assignees: [{ kind: "REQUESTER_MANAGER" }] },
});
const task = (key: string, next?: StepDef["next"]): StepDef => ({
  key,
  type: "EXECUTION",
  position: 1,
  next,
  config: { type: "EXECUTION", assignees: [{ kind: "REQUESTER" }] },
});

describe("routing", () => {
  it("reads the approve route, then __default__, then default", () => {
    expect(
      happyNext(approval("a", { onAction: { APPROVE: "b", REJECT: "x" } })),
    ).toBe("b");
    expect(happyNext(approval("a", { onAction: { __default__: "c" } }))).toBe(
      "c",
    );
    expect(happyNext(task("t", { default: "d" }))).toBe("d");
    expect(happyNext(task("t"))).toBeNull();
  });

  it("keeps other per-action entries when changing the approve route", () => {
    const step = withHappyNext(
      approval("a", { onAction: { APPROVE: "b", REJECT: "x" } }),
      "c",
    );
    expect(step.next).toEqual({ onAction: { APPROVE: "c", REJECT: "x" } });
    const closed = withHappyNext(step, null);
    expect(closed.next).toEqual({ onAction: { REJECT: "x" } });
  });

  it("never treats the reject entry as a route", () => {
    expect(targetsOf(approval("a", { onAction: { REJECT: "x" } }))).toEqual([]);
  });
});

describe("editing", () => {
  const base: Graph = {
    start: "a",
    steps: [approval("a", { onAction: { APPROVE: "b" } }), task("b")],
  };

  it("inserts a step between two and rewires the route", () => {
    const step = createStep(base.steps, "APPROVAL", "Security review");
    const graph = insertStep(base, step, "a");
    expect(graph.steps.map((s) => s.key)).toEqual([
      "a",
      "security_review",
      "b",
    ]);
    expect(happyNext(graph.steps[0]!)).toBe("security_review");
    expect(happyNext(graph.steps[1]!)).toBe("b");
    expect(graph.steps.map((s) => s.position)).toEqual([1, 2, 3]);
  });

  it("inserts at the beginning and makes it the first step", () => {
    const graph = insertStep(
      base,
      createStep(base.steps, "NOTIFICATION"),
      null,
    );
    expect(graph.start).toBe("send_notification");
    expect(happyNext(graph.steps[0]!)).toBe("a");
  });

  it("bridges the path when a step is removed", () => {
    const three: Graph = {
      start: "a",
      steps: [
        approval("a", { onAction: { APPROVE: "b" } }),
        task("b", { default: "c" }),
        task("c"),
      ],
    };
    const graph = removeStep(three, "b");
    expect(happyNext(graph.steps[0]!)).toBe("c");
    expect(removeStep(three, "a").start).toBe("b");
  });

  it("renames a key everywhere it is referenced", () => {
    const branch: StepDef = {
      key: "route",
      type: "CONDITIONAL_BRANCH",
      position: 3,
      config: {
        type: "CONDITIONAL_BRANCH",
        branches: [{ when: {}, goTo: "b" }],
        default: "b",
      },
    };
    const graph = renameStepKey(
      { ...base, steps: [...base.steps, branch] },
      "b",
      "fulfil",
    );
    expect(happyNext(graph.steps[0]!)).toBe("fulfil");
    expect(graph.steps[1]!.key).toBe("fulfil");
    expect(graph.steps[2]!.config).toMatchObject({
      branches: [{ goTo: "fulfil" }],
      default: "fulfil",
    });
    // A clash leaves the graph untouched.
    expect(renameStepKey(graph, "a", "fulfil")).toBe(graph);
  });

  it("falls back to a readable name from the key", () => {
    expect(stepName({ key: "security_review" })).toBe("Security review");
    expect(stepName({ key: "x", name: "  Line manager  " })).toBe(
      "Line manager",
    );
  });
});

describe("checkGraph", () => {
  it("passes every template except where an assignee must be chosen", () => {
    for (const template of WORKFLOW_TEMPLATES) {
      const issues = checkGraph(template.build());
      for (const issue of issues)
        expect(issue.message).toMatch(/nobody assigned/);
    }
    expect(checkGraph(WORKFLOW_TEMPLATES[0]!.build())).toEqual([]);
  });

  it("flags missing assignees, broken routes and unreachable steps", () => {
    const graph: Graph = {
      start: "a",
      steps: [
        {
          ...approval("a", { onAction: { APPROVE: "ghost" } }),
          config: { type: "APPROVAL", assignees: [] },
        },
        task("orphan"),
      ],
    };
    const messages = checkGraph(graph)
      .map((i) => i.message)
      .join("\n");
    expect(messages).toMatch(/nobody assigned/);
    expect(messages).toMatch(/no longer exists/);
    expect(messages).toMatch(/never reached/);
  });

  it("asks for a first step and at least one step", () => {
    expect(checkGraph({ start: "", steps: [] })[0]!.message).toMatch(
      /at least one step/,
    );
    expect(
      checkGraph({ start: "", steps: [task("t")] }).some((i) =>
        /first step/.test(i.message),
      ),
    ).toBe(true);
  });
});

describe("assignee descriptions", () => {
  const directory = {
    users: [{ id: "u1", name: "Sara Ali", email: "sara@barq.test" }],
    roles: [{ id: "r1", name: "security-officer" }],
    fields: [{ key: "owner", label: "System owner", type: "USER_PICKER" }],
  };

  it("describes each kind in plain words", () => {
    expect(describeAssignee({ kind: "REQUESTER_MANAGER" }, directory)).toBe(
      "Requester's line manager",
    );
    expect(describeAssignee({ kind: "ROLE", roleId: "r1" }, directory)).toBe(
      "Anyone with the Security Officer role",
    );
    expect(describeAssignee({ kind: "USER", userId: "u1" }, directory)).toBe(
      "Sara Ali",
    );
    expect(
      describeAssignee({ kind: "FIELD_USER", fieldKey: "owner" }, directory),
    ).toBe("The person in “System owner”");
    expect(describeAssignee({ kind: "ROLE" }, directory)).toBe(
      "A role (not chosen yet)",
    );
  });

  it("summarises several assignees on one line", () => {
    expect(
      summariseAssignees(
        [{ kind: "REQUESTER" }, { kind: "REQUESTER_MANAGER" }],
        directory,
      ),
    ).toBe("The requester +1");
    expect(summariseAssignees([], directory)).toBeNull();
  });

  it("labels the approval rule", () => {
    expect(approvalRuleLabel("ANY")).toBe("Any one of them");
    expect(approvalRuleLabel("QUORUM", 2)).toBe("At least 2");
    expect(approvalRuleLabel("UNANIMOUS")).toBe("Everyone");
  });
});
