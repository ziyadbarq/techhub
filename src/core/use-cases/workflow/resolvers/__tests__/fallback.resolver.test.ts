import { describe, it, expect, vi } from "vitest";
import { FallbackAssigneeResolver } from "../fallback.resolver";
import type {
  IAssigneeResolverRegistry,
  ExecCtx,
} from "@/core/repositories/workflow";
import type { IExpressionEvaluator } from "@/infrastructure/services/workflow/expression-evaluator.service";

function makeRegistry(
  resolverFn: (spec: unknown) => Promise<string[]>,
): IAssigneeResolverRegistry {
  return {
    get: vi.fn().mockReturnValue({ resolve: resolverFn }),
  } as unknown as IAssigneeResolverRegistry;
}

function makeEvaluator(result: boolean): IExpressionEvaluator {
  return {
    evaluate: vi.fn(),
    evaluateBoolean: vi.fn().mockReturnValue(result),
    evaluateNumber: vi.fn(),
  } as unknown as IExpressionEvaluator;
}

function makeExec(
  fieldValues: Record<string, unknown> = {},
): ExecCtx & { requesterId: string } {
  return {
    requestId: "req-001",
    requesterId: "user-req",
    stepInstanceId: "step-inst-001",
    fieldValues,
    ctx: { userId: "user-req", system: undefined },
    tx: {} as ExecCtx["tx"],
  };
}

describe("FallbackAssigneeResolver", () => {
  describe("when spec.kind is not FALLBACK", () => {
    it("returns [] without calling registry", async () => {
      const registry = makeRegistry(async () => []);
      const evaluator = makeEvaluator(false);
      const resolver = new FallbackAssigneeResolver(() => registry, evaluator);

      const result = await resolver.resolve({ kind: "REQUESTER" }, makeExec());

      expect(result).toEqual([]);
      expect(registry.get).not.toHaveBeenCalled();
    });
  });

  describe("primary resolver returns users", () => {
    it("uses primary result when primary resolves non-empty", async () => {
      const registry = makeRegistry(async () => ["manager-id"]);
      const evaluator = makeEvaluator(false);
      const resolver = new FallbackAssigneeResolver(() => registry, evaluator);

      const result = await resolver.resolve(
        {
          kind: "FALLBACK",
          primary: { kind: "REQUESTER_MANAGER" },
          fallbackFieldKey: "alternate_manager",
        },
        makeExec({ alternate_manager: "fallback-user" }),
      );

      expect(result).toEqual(["manager-id"]);
    });

    it("ignores fallbackFieldKey when primary resolves", async () => {
      const registry = makeRegistry(async () => ["manager-id"]);
      const evaluator = makeEvaluator(false);
      const resolver = new FallbackAssigneeResolver(() => registry, evaluator);

      const result = await resolver.resolve(
        {
          kind: "FALLBACK",
          primary: { kind: "REQUESTER_MANAGER" },
          fallbackFieldKey: "alternate_manager",
        },
        makeExec({ alternate_manager: "should-not-appear" }),
      );

      expect(result).not.toContain("should-not-appear");
    });
  });

  describe("primary resolver returns empty", () => {
    it("falls back to fallbackFieldKey string value", async () => {
      const registry = makeRegistry(async () => []);
      const evaluator = makeEvaluator(false);
      const resolver = new FallbackAssigneeResolver(() => registry, evaluator);

      const result = await resolver.resolve(
        {
          kind: "FALLBACK",
          primary: { kind: "REQUESTER_MANAGER" },
          fallbackFieldKey: "alternate_manager",
        },
        makeExec({ alternate_manager: "fallback-user-id" }),
      );

      expect(result).toEqual(["fallback-user-id"]);
    });

    it("falls back to fallbackFieldKey array value", async () => {
      const registry = makeRegistry(async () => []);
      const evaluator = makeEvaluator(false);
      const resolver = new FallbackAssigneeResolver(() => registry, evaluator);

      const result = await resolver.resolve(
        {
          kind: "FALLBACK",
          primary: { kind: "REQUESTER_MANAGER" },
          fallbackFieldKey: "alternate_manager",
        },
        makeExec({ alternate_manager: ["user-a", "user-b"] }),
      );

      expect(result).toEqual(["user-a", "user-b"]);
    });

    it("returns [] when fallback field is also empty", async () => {
      const registry = makeRegistry(async () => []);
      const evaluator = makeEvaluator(false);
      const resolver = new FallbackAssigneeResolver(() => registry, evaluator);

      const result = await resolver.resolve(
        {
          kind: "FALLBACK",
          primary: { kind: "REQUESTER_MANAGER" },
          fallbackFieldKey: "alternate_manager",
        },
        makeExec({ alternate_manager: "" }),
      );

      expect(result).toEqual([]);
    });

    it("returns [] when fallback field is absent", async () => {
      const registry = makeRegistry(async () => []);
      const evaluator = makeEvaluator(false);
      const resolver = new FallbackAssigneeResolver(() => registry, evaluator);

      const result = await resolver.resolve(
        {
          kind: "FALLBACK",
          primary: { kind: "REQUESTER_MANAGER" },
          fallbackFieldKey: "alternate_manager",
        },
        makeExec({}),
      );

      expect(result).toEqual([]);
    });
  });

  describe("forceFallbackWhen expression", () => {
    it("skips primary and uses fallback when forceFallbackWhen is true", async () => {
      const registry = makeRegistry(async () => ["manager-id"]);
      const evaluator = makeEvaluator(true); // force = true
      const resolver = new FallbackAssigneeResolver(() => registry, evaluator);

      const result = await resolver.resolve(
        {
          kind: "FALLBACK",
          primary: { kind: "REQUESTER_MANAGER" },
          fallbackFieldKey: "alternate_manager",
          forceFallbackWhen: {
            op: "!=",
            left: { field: "manager_unavailable_reason" },
            right: { const: "" },
          },
        },
        makeExec({
          manager_unavailable_reason: "On leave",
          alternate_manager: "forced-fallback-user",
        }),
      );

      expect(result).toEqual(["forced-fallback-user"]);
      expect(registry.get).not.toHaveBeenCalled();
    });

    it("uses primary when forceFallbackWhen is false", async () => {
      const registry = makeRegistry(async () => ["manager-id"]);
      const evaluator = makeEvaluator(false); // force = false
      const resolver = new FallbackAssigneeResolver(() => registry, evaluator);

      const result = await resolver.resolve(
        {
          kind: "FALLBACK",
          primary: { kind: "REQUESTER_MANAGER" },
          fallbackFieldKey: "alternate_manager",
          forceFallbackWhen: {
            op: "!=",
            left: { field: "manager_unavailable_reason" },
            right: { const: "" },
          },
        },
        makeExec({
          manager_unavailable_reason: "",
          alternate_manager: "fallback-user",
        }),
      );

      expect(result).toEqual(["manager-id"]);
    });

    it("forceFallbackWhen=true + empty fallback field → returns []", async () => {
      const registry = makeRegistry(async () => ["manager-id"]);
      const evaluator = makeEvaluator(true);
      const resolver = new FallbackAssigneeResolver(() => registry, evaluator);

      const result = await resolver.resolve(
        {
          kind: "FALLBACK",
          primary: { kind: "REQUESTER_MANAGER" },
          fallbackFieldKey: "alternate_manager",
          forceFallbackWhen: {
            op: "!=",
            left: { field: "reason" },
            right: { const: "" },
          },
        },
        makeExec({ reason: "On leave" }),
      );

      expect(result).toEqual([]);
    });

    it("evaluates expression against current fieldValues", async () => {
      const evaluator = makeEvaluator(false);
      const registry = makeRegistry(async () => ["mgr"]);
      const resolver = new FallbackAssigneeResolver(() => registry, evaluator);
      const fieldValues = { reason: "nothing" };

      await resolver.resolve(
        {
          kind: "FALLBACK",
          primary: { kind: "REQUESTER_MANAGER" },
          fallbackFieldKey: "alt",
          forceFallbackWhen: {
            op: "!=",
            left: { field: "reason" },
            right: { const: "" },
          },
        },
        makeExec(fieldValues),
      );

      expect(evaluator.evaluateBoolean).toHaveBeenCalledWith(
        expect.objectContaining({ op: "!=" }),
        { fields: fieldValues },
      );
    });
  });

  describe("resolveFromField edge cases", () => {
    it("filters non-string items from array fallback value", async () => {
      const registry = makeRegistry(async () => []);
      const evaluator = makeEvaluator(false);
      const resolver = new FallbackAssigneeResolver(() => registry, evaluator);

      const result = await resolver.resolve(
        {
          kind: "FALLBACK",
          primary: { kind: "REQUESTER_MANAGER" },
          fallbackFieldKey: "alt",
        },
        makeExec({ alt: ["valid-id", 42, null, "another-id"] }),
      );

      expect(result).toEqual(["valid-id", "another-id"]);
    });

    it("treats numeric field value as empty", async () => {
      const registry = makeRegistry(async () => []);
      const evaluator = makeEvaluator(false);
      const resolver = new FallbackAssigneeResolver(() => registry, evaluator);

      const result = await resolver.resolve(
        {
          kind: "FALLBACK",
          primary: { kind: "REQUESTER_MANAGER" },
          fallbackFieldKey: "alt",
        },
        makeExec({ alt: 123 }),
      );

      expect(result).toEqual([]);
    });
  });
});
