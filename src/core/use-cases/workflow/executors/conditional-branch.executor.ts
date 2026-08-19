/**
 * Conditional Branch Step Executor
 *
 * Evaluates branches at activation time and routes to the matching `goTo` key.
 * Falls back to the configured `default` key when no branch matches.
 *
 * Enriches the expression context with `accessServices.<fieldKey>.*` data from
 * AccessServiceRequestSnapshot rows, enabling expressions like:
 *   { "field": "accessServices.service_field.requireManagerApproval" }
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
import type { IAccessServiceSnapshotRepository } from "@/core/repositories/workflow/access-service.repository.interface";

@injectable()
export class ConditionalBranchStepExecutor implements IStepExecutor {
  readonly type = "CONDITIONAL_BRANCH" as const;

  constructor(
    @inject(DI_TOKENS.IWorkflowExpressionEvaluator)
    private readonly evaluator: IExpressionEvaluator,
    @inject(DI_TOKENS.IAccessServiceSnapshotRepository)
    private readonly accessServiceSnapshots: IAccessServiceSnapshotRepository,
  ) {}

  async activate(config: StepConfig, exec: ExecCtx): Promise<ActivationResult> {
    const cfg = config as ConditionalBranchStepConfig;

    // Build accessServices.<fieldKey>.* from snapshot rows so expressions can reference
    // service properties without a live catalog query.
    const snapshots = await this.accessServiceSnapshots.findAllForRequest(
      exec.requestId,
      exec.tx,
    );
    const accessServicesCtx: Record<
      string,
      { requireManagerApproval: boolean; name: string; slug: string }
    > = {};
    for (const snap of snapshots) {
      accessServicesCtx[snap.sourceFieldKey] = {
        requireManagerApproval: snap.requireManagerApproval,
        name: snap.serviceName,
        slug: snap.serviceSlug,
      };
    }

    const enrichedFields: Record<string, unknown> = {
      ...exec.fieldValues,
      accessServices: accessServicesCtx,
    };

    const ctx = { fields: enrichedFields };
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
