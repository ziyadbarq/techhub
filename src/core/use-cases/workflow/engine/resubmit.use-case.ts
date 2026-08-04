/**
 * Workflow Resubmit Use Case
 *
 * Thin wrapper around `WorkflowEngine.resubmit`. Used after a same-record
 * rejection moved the request back to DRAFT. Applies field updates,
 * re-evaluates computed fields, marks the request SUBMITTED, and re-activates
 * the workflow's start step.
 */

import { inject, injectable } from "inversify";

import { DI_TOKENS } from "@/di/types";
import type { ActorContext } from "@/core/domain/workflow";
import type { IWorkflowEngine } from "@/core/repositories/workflow";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { LogExecution } from "@/lib/decorators/log-execution.decorator";

@injectable()
export class WorkflowResubmitUseCase {
  constructor(
    @inject(DI_TOKENS.IWorkflowEngine)
    private readonly engine: IWorkflowEngine,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("workflow.resubmit")
  async execute(
    requestId: string,
    fieldUpdates: Record<string, unknown>,
    ctx: ActorContext,
  ): Promise<void> {
    return this.engine.resubmit(requestId, fieldUpdates, ctx);
  }
}
