import { describe, expect, it } from "vitest";
import { ExpressionEvaluatorService } from "@/infrastructure/services/workflow/expression-evaluator.service";
import { evaluateBoolean } from "@/lib/workflow/expression-client";
import {
  fieldKeyFromServiceSlugKey,
  isAccessServiceField,
  serviceSlugKey,
} from "../service-condition";

const showWhenGcp = {
  and: [
    {
      op: "==" as const,
      left: { field: "service#slug" },
      right: { const: "gcp" },
    },
  ],
};

describe("service conditions", () => {
  it("derives and reads back the slug key", () => {
    expect(serviceSlugKey("service")).toBe("service#slug");
    expect(fieldKeyFromServiceSlugKey("service#slug")).toBe("service");
    expect(fieldKeyFromServiceSlugKey("service")).toBeNull();
  });

  it("recognises access-service lookup fields only", () => {
    expect(
      isAccessServiceField({
        type: "LOOKUP",
        config: { dataSource: "ACCESS_SERVICES" },
      }),
    ).toBe(true);
    expect(
      isAccessServiceField({
        type: "LOOKUP",
        config: { dataSource: "static" },
      }),
    ).toBe(false);
    expect(isAccessServiceField({ type: "DROPDOWN" })).toBe(false);
  });

  it("is evaluated the same in the browser and on the server", () => {
    const server = new ExpressionEvaluatorService();
    for (const [slug, expected] of [
      ["gcp", true],
      ["gitlab", false],
    ] as const) {
      const ctx = { fields: { service: "some-id", "service#slug": slug } };
      expect(evaluateBoolean(showWhenGcp, ctx)).toBe(expected);
      expect(server.evaluateBoolean(showWhenGcp, ctx)).toBe(expected);
    }
    // No service chosen yet: the field stays hidden.
    expect(evaluateBoolean(showWhenGcp, { fields: {} })).toBe(false);
  });
});
