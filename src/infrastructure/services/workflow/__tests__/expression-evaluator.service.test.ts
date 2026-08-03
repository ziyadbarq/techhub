import { describe, it, expect } from "vitest";

import { ExpressionEvaluatorService } from "@/infrastructure/services/workflow/expression-evaluator.service";

const service = new ExpressionEvaluatorService();
const evaluate = service.evaluate.bind(service);
const evaluateBoolean = service.evaluateBoolean.bind(service);
const evaluateNumber = service.evaluateNumber.bind(service);

describe("expression DSL evaluator", () => {
  it("returns literal constants", () => {
    expect(evaluate({ const: 42 }, { fields: {} })).toBe(42);
    expect(evaluate({ const: "hello" }, { fields: {} })).toBe("hello");
    expect(evaluate({ const: true }, { fields: {} })).toBe(true);
  });

  it("reads field values, including dotted paths", () => {
    const ctx = { fields: { name: "Ada", profile: { rank: 5 } } };
    expect(evaluate({ field: "name" }, ctx)).toBe("Ada");
    expect(evaluate({ field: "profile.rank" }, ctx)).toBe(5);
    expect(evaluate({ field: "missing" }, ctx)).toBeUndefined();
  });

  it("evaluates comparisons and arithmetic", () => {
    const ctx = { fields: { x: 10, y: 3 } };
    expect(
      evaluateBoolean(
        { op: ">", left: { field: "x" }, right: { field: "y" } },
        ctx,
      ),
    ).toBe(true);
    expect(
      evaluateBoolean(
        { op: "<=", left: { const: 5 }, right: { const: 5 } },
        ctx,
      ),
    ).toBe(true);
    expect(
      evaluateNumber(
        { op: "+", left: { field: "x" }, right: { field: "y" } },
        ctx,
      ),
    ).toBe(13);
    expect(
      evaluateNumber(
        { op: "*", left: { field: "x" }, right: { field: "y" } },
        ctx,
      ),
    ).toBe(30);
  });

  it("supports and/or/not", () => {
    const ctx = { fields: { a: true, b: false } };
    expect(
      evaluateBoolean({ and: [{ field: "a" }, { not: { field: "b" } }] }, ctx),
    ).toBe(true);
    expect(
      evaluateBoolean({ or: [{ field: "b" }, { not: { field: "a" } }] }, ctx),
    ).toBe(false);
  });

  it("supports `in` membership", () => {
    expect(
      evaluateBoolean(
        {
          in: {
            value: { const: "B" },
            list: [{ const: "A" }, { const: "B" }, { const: "C" }],
          },
        },
        { fields: {} },
      ),
    ).toBe(true);
    expect(
      evaluateBoolean(
        {
          in: {
            value: { const: "Z" },
            list: [{ const: "A" }, { const: "B" }],
          },
        },
        { fields: {} },
      ),
    ).toBe(false);
  });

  it("addDays advances a date", () => {
    const base = new Date("2026-01-01T00:00:00Z");
    const result = evaluate(
      { addDays: { date: { const: base.toISOString() }, days: { const: 7 } } },
      { fields: {} },
    );
    expect(result instanceof Date).toBe(true);
    expect((result as Date).toISOString()).toBe("2026-01-08T00:00:00.000Z");
  });

  it("loose equality coerces between strings and numbers", () => {
    expect(
      evaluateBoolean(
        { op: "==", left: { const: "5" }, right: { const: 5 } },
        { fields: {} },
      ),
    ).toBe(true);
  });
});
