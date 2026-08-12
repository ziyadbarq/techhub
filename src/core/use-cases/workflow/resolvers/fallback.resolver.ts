import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { AssigneeSpec } from "@/core/domain/workflow";
import type {
  ExecCtx,
  IAssigneeResolver,
  IAssigneeResolverRegistry,
} from "@/core/repositories/workflow";
import type { IExpressionEvaluator } from "@/infrastructure/services/workflow/expression-evaluator.service";

@injectable()
export class FallbackAssigneeResolver implements IAssigneeResolver {
  readonly kind = "FALLBACK" as const;

  constructor(
    @inject(DI_TOKENS.IWorkflowAssigneeResolverRegistry)
    private readonly registry: IAssigneeResolverRegistry,
    @inject(DI_TOKENS.IWorkflowExpressionEvaluator)
    private readonly evaluator: IExpressionEvaluator,
  ) {}

  async resolve(
    spec: AssigneeSpec,
    exec: ExecCtx & { requesterId: string },
  ): Promise<string[]> {
    if (spec.kind !== "FALLBACK") return [];

    // 1. Evaluate forceFallbackWhen — if true, skip primary and use fallback field directly
    if (spec.forceFallbackWhen) {
      const force = this.evaluator.evaluateBoolean(spec.forceFallbackWhen, {
        fields: exec.fieldValues,
      });
      if (force) {
        return this.resolveFromField(spec.fallbackFieldKey, exec.fieldValues);
      }
    }

    // 2. Try primary resolver
    const primaryResolver = this.registry.get(spec.primary.kind);
    const primaryIds = await primaryResolver.resolve(spec.primary, exec);
    if (primaryIds.length > 0) return primaryIds;

    // 3. Fall back to the field value
    return this.resolveFromField(spec.fallbackFieldKey, exec.fieldValues);
  }

  private resolveFromField(
    fieldKey: string,
    fieldValues: Record<string, unknown>,
  ): string[] {
    const value = fieldValues[fieldKey];
    if (typeof value === "string" && value) return [value];
    if (Array.isArray(value)) {
      return (value as unknown[]).filter(
        (x): x is string => typeof x === "string" && Boolean(x),
      );
    }
    return [];
  }
}
