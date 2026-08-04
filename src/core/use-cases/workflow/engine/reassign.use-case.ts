/**
 * Workflow Reassign Use Case
 *
 * Thin wrapper around `WorkflowEngine.reassign`. Replaces the step's
 * assignee snapshot with a single new user id and appends an audit entry.
 */

import { inject, injectable } from "inversify";

import { DI_TOKENS } from "@/di/types";
import type { ActorContext } from "@/core/domain/workflow";
import type { IWorkflowEngine } from "@/core/repositories/workflow";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { LogExecution } from "@/lib/decorators/log-execution.decorator";

@injectable()
export class WorkflowReassignUseCase {
  constructor(
    @inject(DI_TOKENS.IWorkflowEngine)
    private readonly engine: IWorkflowEngine,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("workflow.reassign")
  async execute(
    stepInstanceId: string,
    toUserId: string,
    ctx: ActorContext,
  ): Promise<void> {
    return this.engine.reassign(stepInstanceId, toUserId, ctx);
  }
}
