/**
 * Workflow Reject Use Case
 *
 * Thin wrapper around `WorkflowEngine.reject`. Admin-style reject by step
 * instance id: marks the step FAILED and closes the request UNSUCCESSFUL.
 * Distinct from the per-action REJECT inside `takeAction` (which routes to
 * `rejectInPlace` → DRAFT).
 */

import { inject, injectable } from "inversify";

import { DI_TOKENS } from "@/di/types";
import type { ActorContext } from "@/core/domain/workflow";
import type { IWorkflowEngine } from "@/core/repositories/workflow";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { LogExecution } from "@/lib/decorators/log-execution.decorator";

@injectable()
export class WorkflowRejectUseCase {
  constructor(
    @inject(DI_TOKENS.IWorkflowEngine)
    private readonly engine: IWorkflowEngine,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("workflow.reject")
  async execute(
    stepInstanceId: string,
    reason: string,
    ctx: ActorContext,
  ): Promise<void> {
    return this.engine.reject(stepInstanceId, reason, ctx);
  }
}
