/**
 * Workflow Force Advance Use Case
 *
 * Thin wrapper around `WorkflowEngine.forceAdvance`. Admin override that
 * marks the current step COMPLETED and advances along the graph's default
 * routing, bypassing the executor's normal `handleAction` logic.
 */

import { inject, injectable } from "inversify";

import { DI_TOKENS } from "@/di/types";
import type { ActorContext } from "@/core/domain/workflow";
import type { IWorkflowEngine } from "@/core/repositories/workflow";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { LogExecution } from "@/lib/decorators/log-execution.decorator";

@injectable()
export class WorkflowForceAdvanceUseCase {
  constructor(
    @inject(DI_TOKENS.IWorkflowEngine)
    private readonly engine: IWorkflowEngine,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("workflow.force-advance")
  async execute(stepInstanceId: string, ctx: ActorContext): Promise<void> {
    return this.engine.forceAdvance(stepInstanceId, ctx);
  }
}
