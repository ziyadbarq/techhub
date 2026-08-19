import { describe, it, expect } from "vitest";
import { validateFormSchema } from "../form-schema.validator";
import type {
  FormSchema,
  IExpressionEvaluatorLike,
} from "../form-schema.validator";
import { ConfigurationError } from "@/core/domain/workflow";

// Simple evaluator stubs
const alwaysVisible: IExpressionEvaluatorLike = {
  evaluateBoolean: () => true,
};
const alwaysHidden: IExpressionEvaluatorLike = {
  evaluateBoolean: () => false,
};
const throwingEvaluator: IExpressionEvaluatorLike = {
  evaluateBoolean: () => {
    throw new Error("bad expression");
  },
};

function textField(
  overrides: Partial<FormSchema["fields"][0]> = {},
): FormSchema["fields"][0] {
  return {
    key: "title",
    label: "Title",
    type: "SHORT_TEXT",
    required: true,
    position: 0,
    ...overrides,
  };
}

function schema(
  fields: FormSchema["fields"],
  perStepFieldState?: FormSchema["perStepFieldState"],
): FormSchema {
  return { fields, perStepFieldState };
}

// ─── Unknown field rejection ──────────────────────────────────────────────────

describe("unknown field policy", () => {
  it("rejects values with keys not in schema", () => {
    const result = validateFormSchema(
      schema([textField()]),
      { title: "ok", injected: "evil" },
      alwaysVisible,
    );
    expect(result.isValid).toBe(false);
    expect(
      result.errors.some(
        (e) => e.fieldKey === "injected" && e.message.includes("UNKNOWN_FIELD"),
      ),
    ).toBe(true);
  });

  it("allows values that exactly match schema keys", () => {
    const result = validateFormSchema(
      schema([textField()]),
      { title: "hello" },
      alwaysVisible,
    );
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValues.title).toBe("hello");
  });
});

// ─── Protected field stripping ────────────────────────────────────────────────

describe("protected field stripping", () => {
  it("strips SYSTEM_FIELD keys from sanitizedValues", () => {
    const result = validateFormSchema(
      schema([
        {
          key: "req_name",
          label: "Requester",
          type: "SYSTEM_FIELD",
          position: 0,
        },
      ]),
      {},
      alwaysVisible,
    );
    expect(result.isValid).toBe(true);
    expect("req_name" in result.sanitizedValues).toBe(false);
  });

  it("strips COMPUTED keys", () => {
    const result = validateFormSchema(
      schema([
        {
          key: "computed_score",
          label: "Score",
          type: "COMPUTED",
          position: 0,
        },
      ]),
      {},
      alwaysVisible,
    );
    expect("computed_score" in result.sanitizedValues).toBe(false);
  });

  it("strips SECTION_HEADER keys", () => {
    const result = validateFormSchema(
      schema([
        {
          key: "header_1",
          label: "Section",
          type: "SECTION_HEADER",
          position: 0,
        },
      ]),
      {},
      alwaysVisible,
    );
    expect("header_1" in result.sanitizedValues).toBe(false);
  });

  it("strips _sys_ prefixed keys", () => {
    const result = validateFormSchema(
      schema([
        {
          key: "_sys_requester",
          label: "Sys Field",
          type: "SHORT_TEXT",
          position: 0,
        },
      ]),
      {},
      alwaysVisible,
    );
    expect("_sys_requester" in result.sanitizedValues).toBe(false);
  });
});

// ─── Required field validation ────────────────────────────────────────────────

describe("required field validation", () => {
  it("fails when required visible field is empty", () => {
    const result = validateFormSchema(
      schema([textField({ required: true })]),
      { title: "" },
      alwaysVisible,
    );
    expect(result.isValid).toBe(false);
    expect(result.errors[0].fieldKey).toBe("title");
  });

  it("fails when required visible field is missing from values", () => {
    const result = validateFormSchema(
      schema([textField({ required: true })]),
      {},
      alwaysVisible,
    );
    expect(result.isValid).toBe(false);
  });

  it("passes when required field is hidden by visibilityRules (evaluates false)", () => {
    const result = validateFormSchema(
      schema([
        textField({
          required: true,
          visibilityRules: { const: false },
        }),
      ]),
      {},
      alwaysHidden,
    );
    expect(result.isValid).toBe(true);
  });

  it("passes when required field is HIDDEN in perStepFieldState", () => {
    const result = validateFormSchema(
      schema([textField({ required: true })], { SUBMIT: { title: "HIDDEN" } }),
      {},
      alwaysVisible,
      "SUBMIT",
    );
    expect(result.isValid).toBe(true);
  });

  it("passes when field has ADMINISTRATIVE visibility", () => {
    const result = validateFormSchema(
      schema([textField({ required: true, visibility: "ADMINISTRATIVE" })]),
      {},
      alwaysVisible,
    );
    expect(result.isValid).toBe(true);
  });

  it("passes when required field has a value", () => {
    const result = validateFormSchema(
      schema([textField({ required: true })]),
      { title: "Hello World" },
      alwaysVisible,
    );
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValues.title).toBe("Hello World");
  });
});

// ─── Malformed expression → ConfigurationError ────────────────────────────────

describe("malformed visibility expression", () => {
  it("throws ConfigurationError (not silent HIDDEN) on evaluator throw", () => {
    const f = textField({ visibilityRules: { const: true } });
    expect(() =>
      validateFormSchema(schema([f]), { title: "x" }, throwingEvaluator),
    ).toThrow(ConfigurationError);
  });
});

// ─── SYSTEM_FIELD always READ_ONLY regardless of perStepFieldState ────────────

describe("SYSTEM_FIELD matrix override", () => {
  it("treats SYSTEM_FIELD as READ_ONLY even if perStepFieldState says EDITABLE", () => {
    const sf: FormSchema["fields"][0] = {
      key: "req_email",
      label: "Email",
      type: "SYSTEM_FIELD",
      position: 0,
      required: false,
    };
    const result = validateFormSchema(
      schema([sf], { SUBMIT: { req_email: "EDITABLE" } }),
      {},
      alwaysVisible,
      "SUBMIT",
    );
    // SYSTEM_FIELD is stripped — should not appear in sanitizedValues
    expect("req_email" in result.sanitizedValues).toBe(false);
    expect(result.isValid).toBe(true);
  });
});

// ─── Primitive type validation ────────────────────────────────────────────────

describe("NUMBER type validation", () => {
  it("accepts finite numbers", () => {
    const result = validateFormSchema(
      schema([{ key: "qty", label: "Qty", type: "NUMBER", position: 0 }]),
      { qty: 42 },
      alwaysVisible,
    );
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValues.qty).toBe(42);
  });

  it("rejects Infinity", () => {
    const result = validateFormSchema(
      schema([{ key: "qty", label: "Qty", type: "NUMBER", position: 0 }]),
      { qty: Infinity },
      alwaysVisible,
    );
    expect(result.isValid).toBe(false);
  });

  it("coerces string number to number in sanitizedValues", () => {
    const result = validateFormSchema(
      schema([{ key: "qty", label: "Qty", type: "NUMBER", position: 0 }]),
      { qty: "7" },
      alwaysVisible,
    );
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValues.qty).toBe(7);
  });

  it("rejects value below config.min", () => {
    const result = validateFormSchema(
      schema([
        {
          key: "qty",
          label: "Qty",
          type: "NUMBER",
          position: 0,
          config: { min: 5 },
        },
      ]),
      { qty: 2 },
      alwaysVisible,
    );
    expect(result.isValid).toBe(false);
    expect(result.errors[0].message).toMatch(/at least 5/);
  });

  it("rejects value above config.max", () => {
    const result = validateFormSchema(
      schema([
        {
          key: "qty",
          label: "Qty",
          type: "NUMBER",
          position: 0,
          config: { max: 10 },
        },
      ]),
      { qty: 99 },
      alwaysVisible,
    );
    expect(result.isValid).toBe(false);
    expect(result.errors[0].message).toMatch(/at most 10/);
  });
});

describe("DATE / DATETIME type validation", () => {
  it("accepts valid ISO date string", () => {
    const result = validateFormSchema(
      schema([{ key: "due", label: "Due", type: "DATE", position: 0 }]),
      { due: "2025-06-15" },
      alwaysVisible,
    );
    expect(result.isValid).toBe(true);
  });

  it("rejects non-date string", () => {
    const result = validateFormSchema(
      schema([{ key: "due", label: "Due", type: "DATE", position: 0 }]),
      { due: "not-a-date" },
      alwaysVisible,
    );
    expect(result.isValid).toBe(false);
  });
});

describe("CHECKBOX type validation", () => {
  it("accepts boolean true", () => {
    const result = validateFormSchema(
      schema([{ key: "agree", label: "Agree", type: "CHECKBOX", position: 0 }]),
      { agree: true },
      alwaysVisible,
    );
    expect(result.isValid).toBe(true);
  });

  it("rejects non-boolean string", () => {
    const result = validateFormSchema(
      schema([{ key: "agree", label: "Agree", type: "CHECKBOX", position: 0 }]),
      { agree: "true" },
      alwaysVisible,
    );
    expect(result.isValid).toBe(false);
  });
});

describe("DROPDOWN type validation", () => {
  const dropdownField: FormSchema["fields"][0] = {
    key: "priority",
    label: "Priority",
    type: "DROPDOWN",
    position: 0,
    config: {
      options: [{ value: "LOW" }, { value: "MEDIUM" }, { value: "HIGH" }],
    },
  };

  it("accepts a valid option", () => {
    const result = validateFormSchema(
      schema([dropdownField]),
      { priority: "LOW" },
      alwaysVisible,
    );
    expect(result.isValid).toBe(true);
  });

  it("rejects an option not in the list", () => {
    const result = validateFormSchema(
      schema([dropdownField]),
      { priority: "CRITICAL" },
      alwaysVisible,
    );
    expect(result.isValid).toBe(false);
    expect(result.errors[0].message).toMatch(/invalid option/);
  });
});

describe("MULTI_SELECT type validation", () => {
  const msField: FormSchema["fields"][0] = {
    key: "tags",
    label: "Tags",
    type: "MULTI_SELECT",
    position: 0,
    config: { options: [{ value: "A" }, { value: "B" }, { value: "C" }] },
  };

  it("accepts valid array of options", () => {
    const result = validateFormSchema(
      schema([msField]),
      { tags: ["A", "C"] },
      alwaysVisible,
    );
    expect(result.isValid).toBe(true);
  });

  it("rejects non-array value", () => {
    const result = validateFormSchema(
      schema([msField]),
      { tags: "A" },
      alwaysVisible,
    );
    expect(result.isValid).toBe(false);
  });

  it("rejects array containing invalid option", () => {
    const result = validateFormSchema(
      schema([msField]),
      { tags: ["A", "Z"] },
      alwaysVisible,
    );
    expect(result.isValid).toBe(false);
    expect(result.errors[0].message).toMatch(/invalid options/);
  });
});

describe("REPEATER type validation", () => {
  const repeaterField: FormSchema["fields"][0] = {
    key: "items",
    label: "Items",
    type: "REPEATER",
    position: 0,
    config: { maxRows: 3 },
  };

  it("accepts array within maxRows limit", () => {
    const result = validateFormSchema(
      schema([repeaterField]),
      { items: [{ a: 1 }, { a: 2 }] },
      alwaysVisible,
    );
    expect(result.isValid).toBe(true);
  });

  it("rejects array exceeding maxRows", () => {
    const result = validateFormSchema(
      schema([repeaterField]),
      { items: [{ a: 1 }, { a: 2 }, { a: 3 }, { a: 4 }] },
      alwaysVisible,
    );
    expect(result.isValid).toBe(false);
    expect(result.errors[0].message).toMatch(/maximum rows/);
  });

  it("rejects non-array value", () => {
    const result = validateFormSchema(
      schema([repeaterField]),
      { items: "not-an-array" },
      alwaysVisible,
    );
    expect(result.isValid).toBe(false);
  });
});

describe("SHORT_TEXT / LONG_TEXT validation", () => {
  it("rejects non-string value", () => {
    const result = validateFormSchema(
      schema([{ key: "note", label: "Note", type: "SHORT_TEXT", position: 0 }]),
      { note: 42 },
      alwaysVisible,
    );
    expect(result.isValid).toBe(false);
  });

  it("rejects string exceeding maxLength", () => {
    const result = validateFormSchema(
      schema([
        {
          key: "note",
          label: "Note",
          type: "SHORT_TEXT",
          position: 0,
          config: { maxLength: 10 },
        },
      ]),
      { note: "a".repeat(11) },
      alwaysVisible,
    );
    expect(result.isValid).toBe(false);
    expect(result.errors[0].message).toMatch(/maximum length/);
  });
});

// ─── Empty-value passthrough ──────────────────────────────────────────────────

describe("empty optional fields", () => {
  it("does not validate type for null/undefined/empty-string values", () => {
    const result = validateFormSchema(
      schema([{ key: "qty", label: "Qty", type: "NUMBER", position: 0 }]),
      { qty: "" },
      alwaysVisible,
    );
    expect(result.isValid).toBe(true);
  });
});

// ─── perStepFieldState matrix ─────────────────────────────────────────────────

describe("perStepFieldState matrix", () => {
  it("READ_ONLY via matrix skips required check and includes value", () => {
    const result = validateFormSchema(
      schema([textField({ required: true })], {
        REVIEW: { title: "READ_ONLY" },
      }),
      {},
      alwaysVisible,
      "REVIEW",
    );
    // Required skipped because READ_ONLY → isAdministrative = true
    expect(result.isValid).toBe(true);
  });

  it("HIDDEN via matrix excludes field from sanitizedValues", () => {
    const result = validateFormSchema(
      schema([textField()], { REVIEW: { title: "HIDDEN" } }),
      { title: "visible-but-hidden-in-step" },
      alwaysVisible,
      "REVIEW",
    );
    expect("title" in result.sanitizedValues).toBe(false);
  });
});
