import { describe, expect, it } from "vitest";
import type { WorkflowGraph } from "@/core/domain/workflow";
import { validateWorkflowForPublish } from "@/core/use-cases/workflow/validation/publish-workflow.validator";
import { checkGraph, happyNext } from "../graph";
import { REQUEST_TYPE_TEMPLATES } from "../request-type-templates";

const access = REQUEST_TYPE_TEMPLATES.find((t) => t.id === "access-request")!;

describe("access request template", () => {
  it("passes the builder checks and the server publish validation", () => {
    const graph = access.graph();
    expect(checkGraph(graph)).toEqual([]);
    const result = validateWorkflowForPublish(
      graph as unknown as WorkflowGraph,
      access.fields(),
    );
    expect(result.errors).toEqual([]);
  });

  it("routes manager → owner → cybersecurity → implementer → requester", () => {
    const graph = access.graph();
    const order: string[] = [];
    let key: string | null = graph.start;
    while (key) {
      order.push(key);
      const step = graph.steps.find((s) => s.key === key)!;
      key = happyNext(step);
    }
    expect(order).toEqual([
      "manager_approval",
      "owner_approval",
      "cybersecurity_approval",
      "implementation",
      "requester_informed",
    ]);
  });

  it("asks for the line manager only when the service requires it", () => {
    const manager = access.graph().steps[0]!;
    expect(manager.config.onlyWhenServiceRequiresManagerApproval).toBe(
      "service",
    );
  });

  it("only gives steps field states for fields that exist", () => {
    const keys = new Set(access.fields().map((f) => f.key));
    for (const byField of Object.values(access.perStepFieldState())) {
      for (const key of Object.keys(byField)) expect(keys.has(key)).toBe(true);
    }
  });
});
