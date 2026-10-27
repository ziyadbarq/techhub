/**
 * The form assistant's output is untrusted input. These tests pin the two
 * guards between a pasted reply and the builder canvas: the Zod contract and
 * the per-type checks that catch fields which validate but cannot be used.
 */

import { describe, expect, it } from "vitest";

import {
  AI_ALLOWED_FIELD_TYPES,
  AI_SYSTEM_FIELDS,
  GeneratedFormSchema,
  buildFormPrompt,
  findFormProblems,
  type GeneratedFormDTO,
} from "../form-ai-contract";

const validForm: GeneratedFormDTO = {
  summary: "Collects what is needed to grant system access.",
  fields: [
    {
      key: "target_system",
      label: "Target system",
      type: "SHORT_TEXT",
      required: true,
      position: 0,
    },
    {
      key: "access_level",
      label: "Access level",
      type: "DROPDOWN",
      position: 1,
      config: { options: ["Read", "Write", "Admin"] },
    },
    {
      key: "justification",
      label: "Business justification",
      type: "LONG_TEXT",
      required: true,
      position: 2,
    },
  ],
};

describe("GeneratedFormSchema", () => {
  it("accepts a well-formed draft", () => {
    expect(GeneratedFormSchema.safeParse(validForm).success).toBe(true);
    expect(findFormProblems(validForm)).toEqual([]);
  });

  it("rejects a field type the builder cannot render", () => {
    const result = GeneratedFormSchema.safeParse({
      ...validForm,
      fields: [{ key: "a", label: "A", type: "SIGNATURE_PAD", position: 0 }],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a field key with illegal characters", () => {
    const result = GeneratedFormSchema.safeParse({
      ...validForm,
      fields: [
        { key: "bad key!", label: "A", type: "SHORT_TEXT", position: 0 },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a visibility value outside the three the builder offers", () => {
    const result = GeneratedFormSchema.safeParse({
      ...validForm,
      fields: [
        {
          key: "a",
          label: "A",
          type: "SHORT_TEXT",
          position: 0,
          visibility: "SECRET",
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("caps the field count so one reply cannot balloon", () => {
    const fields = Array.from({ length: 41 }, (_, i) => ({
      key: `f_${i}`,
      label: `Field ${i}`,
      type: "SHORT_TEXT" as const,
      position: i,
    }));

    expect(
      GeneratedFormSchema.safeParse({ ...validForm, fields }).success,
    ).toBe(false);
  });
});

describe("findFormProblems", () => {
  it("catches a dropdown with no options — it would render empty", () => {
    const problems = findFormProblems({
      ...validForm,
      fields: [{ key: "a", label: "Pick one", type: "DROPDOWN", position: 0 }],
    });

    expect(problems.some((p) => p.includes("at least one option"))).toBe(true);
  });

  it("catches a multi-select with an empty options array", () => {
    const problems = findFormProblems({
      ...validForm,
      fields: [
        {
          key: "a",
          label: "Pick some",
          type: "MULTI_SELECT",
          position: 0,
          config: { options: [] },
        },
      ],
    });

    expect(problems.some((p) => p.includes("at least one option"))).toBe(true);
  });

  it("accepts a LOOKUP backed by the service catalog without options", () => {
    const problems = findFormProblems({
      ...validForm,
      fields: [
        {
          key: "service",
          label: "Service",
          type: "LOOKUP",
          position: 0,
          config: { dataSource: "ACCESS_SERVICES" },
        },
      ],
    });

    expect(problems).toEqual([]);
  });

  it("catches a LOOKUP pointed at a source that does not exist", () => {
    const problems = findFormProblems({
      ...validForm,
      fields: [
        {
          key: "service",
          label: "Service",
          type: "LOOKUP",
          position: 0,
          config: { dataSource: "SAP" },
        },
      ],
    });

    expect(problems.some((p) => p.includes("SAP"))).toBe(true);
  });

  it("catches a SYSTEM_FIELD bound to nothing", () => {
    const problems = findFormProblems({
      ...validForm,
      fields: [
        { key: "who", label: "Requester", type: "SYSTEM_FIELD", position: 0 },
      ],
    });

    expect(problems.some((p) => p.includes("systemField"))).toBe(true);
  });

  it("catches a repeater with no sub-fields", () => {
    const problems = findFormProblems({
      ...validForm,
      fields: [{ key: "items", label: "Items", type: "REPEATER", position: 0 }],
    });

    expect(problems.some((p) => p.includes("no sub-fields"))).toBe(true);
  });

  it("catches duplicate field keys", () => {
    const problems = findFormProblems({
      ...validForm,
      fields: [
        { key: "dup", label: "A", type: "SHORT_TEXT", position: 0 },
        { key: "dup", label: "B", type: "SHORT_TEXT", position: 1 },
      ],
    });

    expect(problems.some((p) => p.includes("share the key"))).toBe(true);
  });
});

describe("buildFormPrompt", () => {
  it("names every field type the builder can render", () => {
    const prompt = buildFormPrompt();

    for (const type of AI_ALLOWED_FIELD_TYPES) {
      expect(prompt).toContain(type);
    }
  });

  it("names every system field binding", () => {
    const prompt = buildFormPrompt();

    for (const systemField of AI_SYSTEM_FIELDS) {
      expect(prompt).toContain(systemField);
    }
  });

  it("lists the catalog's services when there are any", () => {
    const prompt = buildFormPrompt({ accessServiceNames: ["vpn", "jira"] });

    expect(prompt).toContain("ACCESS_SERVICES");
    expect(prompt).toContain("vpn");
    expect(prompt).toContain("jira");
  });

  it("omits the catalog section when there are none", () => {
    expect(buildFormPrompt()).not.toContain("Services currently in the");
  });

  it("offers existing field keys for reuse", () => {
    const prompt = buildFormPrompt({
      existingFieldKeys: ["justification", "target_system"],
    });

    expect(prompt).toContain("justification, target_system");
  });

  it("warns against inventing options the assistant cannot know", () => {
    expect(buildFormPrompt()).toContain("Do not invent dropdown options");
  });
});
