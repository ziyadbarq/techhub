/**
 * Conditional Branch Step Executor
 *
 * Evaluates branches at activation time and routes to the matching `goTo` key.
 * Falls back to the configured `default` key when no branch matches.
 */

import { inject, injectable } from "inversify";

import { DI_TOKENS } from "@/di/types";
import { InvalidStateError } from "@/core/domain/workflow";
import type {
  ConditionalBranchStepConfig,
  StepConfig,
} from "@/core/domain/workflow";
import type {
  ActionResult,
  ActivationResult,
  ExecCtx,
  IStepExecutor,
} from "@/core/repositories/workflow";
import type { IExpressionEvaluator } from "@/infrastructure/services/workflow/expression-evaluator.service";

@injectable()
export class ConditionalBranchStepExecutor implements IStepExecutor {
  readonly type = "CONDITIONAL_BRANCH" as const;

  constructor(
    @inject(DI_TOKENS.IWorkflowExpressionEvaluator)
    private readonly evaluator: IExpressionEvaluator,
  ) {}

  async activate(config: StepConfig, exec: ExecCtx): Promise<ActivationResult> {
    const cfg = config as ConditionalBranchStepConfig;
    const ctx = { fields: exec.fieldValues };
    for (const branch of cfg.branches) {
      if (this.evaluator.evaluateBoolean(branch.when, ctx)) {
        return { kind: "AUTO_COMPLETE", nextStepKey: branch.goTo };
      }
    }
    if (cfg.default) {
      return { kind: "AUTO_COMPLETE", nextStepKey: cfg.default };
    }
    return {
      kind: "AUTO_FAIL",
      reason: "No conditional branch matched and no default set",
    };
  }

  async handleAction(): Promise<ActionResult> {
    throw new InvalidStateError(
      "Conditional Branch steps do not accept user actions",
    );
  }
}
