import { describe, it, expect } from "vitest";
import {
  checkStepFieldUpdates,
  fieldStateAt,
  SUBMIT_STEP_KEY,
} from "../step-field-state";
import type { FormSchema } from "../types";

const schema: FormSchema = {
  fields: [
    {
      key: "title",
      label: "Title",
      type: "SHORT_TEXT",
      required: true,
      position: 1,
    },
    { key: "requester", label: "Requester", type: "SYSTEM_FIELD", position: 2 },
    {
      key: "assignee",
      label: "Assignee",
      type: "USER_PICKER",
      required: true,
      position: 3,
    },
    {
      key: "expiry",
      label: "Expiry",
      type: "DATE",
      required: true,
      position: 4,
      visibilityRules: { field: "temporary" },
    },
    { key: "notes", label: "Notes", type: "LONG_TEXT", position: 5 },
  ],
  perStepFieldState: {
    [SUBMIT_STEP_KEY]: { assignee: "HIDDEN" },
    governance: {
      title: "READ_ONLY",
      assignee: "EDITABLE",
      expiry: "READ_ONLY",
    },
    owner: { title: "READ_ONLY", assignee: "READ_ONLY" },
  },
};
const field = (key: string) => schema.fields.find((f) => f.key === key)!;
const shown = () => true;

describe("fieldStateAt", () => {
  it("uses the step's state, editable when the step doesn't say", () => {
    expect(fieldStateAt(schema, SUBMIT_STEP_KEY, field("assignee"))).toBe(
      "HIDDEN",
    );
    expect(fieldStateAt(schema, SUBMIT_STEP_KEY, field("title"))).toBe(
      "EDITABLE",
    );
    expect(fieldStateAt(schema, "governance", field("assignee"))).toBe(
      "EDITABLE",
    );
    expect(fieldStateAt(schema, "owner", field("notes"))).toBe("EDITABLE");
  });

  it("never lets anyone edit a system field", () => {
    const withState: FormSchema = {
      ...schema,
      perStepFieldState: { owner: { requester: "EDITABLE" } },
    };
    expect(fieldStateAt(withState, "owner", field("requester"))).toBe(
      "READ_ONLY",
    );
  });
});

describe("checkStepFieldUpdates", () => {
  const base = { title: "Report", assignee: "", temporary: false };

  it("rejects changes to fields the step can't edit", () => {
    const problems = checkStepFieldUpdates({
      schema,
      stepKey: "owner",
      updates: { title: "Changed", assignee: "u1", ghost: 1 },
      merged: { ...base, title: "Changed", assignee: "u1" },
      action: "REJECT",
      isShown: shown,
    });
    expect(problems).toEqual([
      "Title can't be changed at this step.",
      "Assignee can't be changed at this step.",
      '"ghost" is not a field of this form.',
    ]);
  });

  it("needs the step's required fields to approve, not to reject", () => {
    const args = {
      schema,
      stepKey: "governance",
      updates: {},
      merged: base,
      isShown: (f: { key: string }) => f.key !== "expiry",
    };
    expect(checkStepFieldUpdates({ ...args, action: "APPROVE" })).toEqual([
      "Assignee is required.",
    ]);
    expect(checkStepFieldUpdates({ ...args, action: "REJECT" })).toEqual([]);
    expect(
      checkStepFieldUpdates({
        ...args,
        action: "APPROVE",
        updates: { assignee: "u1" },
        merged: { ...base, assignee: "u1" },
      }),
    ).toEqual([]);
  });

  it("skips required fields hidden by their condition", () => {
    expect(
      checkStepFieldUpdates({
        schema,
        stepKey: "owner",
        updates: {},
        merged: { ...base },
        action: "APPROVE",
        isShown: (f) => f.key !== "expiry",
      }),
    ).toEqual([]);
  });
});
