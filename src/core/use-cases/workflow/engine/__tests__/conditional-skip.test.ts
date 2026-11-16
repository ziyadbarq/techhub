import { describe, expect, it } from "vitest";
import type { StepDefinition } from "@/core/domain/workflow";
import { validateWorkflowForPublish } from "../../validation/publish-workflow.validator";
import {
  decideConditionalSkip,
  serviceFieldGatingStep,
} from "../conditional-skip";

const approval = (gate?: string): StepDefinition =>
  ({
    key: "manager_approval",
    type: "APPROVAL",
    position: 1,
    config: {
      type: "APPROVAL",
      assignees: [{ kind: "REQUESTER_MANAGER" }],
      ...(gate !== undefined
        ? { onlyWhenServiceRequiresManagerApproval: gate }
        : {}),
    },
  }) as StepDefinition;

describe("decideConditionalSkip", () => {
  it("skips when the chosen service doesn't require manager approval", () => {
    expect(
      decideConditionalSkip(approval("service"), {
        serviceName: "GitLab",
        requireManagerApproval: false,
      }),
    ).toEqual({
      reason: "SERVICE_DOES_NOT_REQUIRE_MANAGER_APPROVAL",
      serviceName: "GitLab",
      serviceFieldKey: "service",
    });
  });

  it("runs the step when the service requires it", () => {
    expect(
      decideConditionalSkip(approval("service"), {
        serviceName: "Oracle OCI",
        requireManagerApproval: true,
      }),
    ).toBeNull();
  });

  it("fails safe: no snapshot means the step runs", () => {
    expect(decideConditionalSkip(approval("service"), null)).toBeNull();
  });

  it("ignores steps that aren't gated", () => {
    expect(serviceFieldGatingStep(approval())).toBeNull();
    expect(serviceFieldGatingStep(approval("  "))).toBeNull();
    expect(
      decideConditionalSkip(approval(), {
        serviceName: "GitLab",
        requireManagerApproval: false,
      }),
    ).toBeNull();
  });
});

describe("publish validation of the service gate", () => {
  const graph = (gate: string) => ({
    start: "manager_approval",
    steps: [approval(gate)],
  });
  const serviceField = {
    key: "service",
    type: "LOOKUP",
    config: { dataSource: "ACCESS_SERVICES" },
  };

  it("accepts a gate on a service lookup field", () => {
    expect(
      validateWorkflowForPublish(graph("service"), [serviceField]).isValid,
    ).toBe(true);
  });

  it("rejects a gate on a field that isn't a service lookup", () => {
    const result = validateWorkflowForPublish(graph("reason"), [
      serviceField,
      { key: "reason", type: "LONG_TEXT" },
    ]);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toMatch(/not an ACCESS_SERVICES lookup/);
  });
});
