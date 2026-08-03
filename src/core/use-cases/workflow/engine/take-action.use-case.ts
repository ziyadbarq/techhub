/**
 * Workflow Take Action Use Case
 *
 * Thin wrapper around `WorkflowEngine.takeAction`. Validates the step is
 * ACTIVE, the actor is in the assignee snapshot, then delegates to the
 * step's executor (APPROVE / REJECT / COMPLETE / ACKNOWLEDGE / REQUEST_INFO
 * / PROVIDE_INFO) and advances or rejects the request based on the result.
 */

import { inject, injectable } from "inversify";

import { DI_TOKENS } from "@/di/types";
import type { ActorContext, TakeActionInput } from "@/core/domain/workflow";
import type { IWorkflowEngine } from "@/core/repositories/workflow";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { LogExecution } from "@/lib/decorators/log-execution.decorator";

@injectable()
export class WorkflowTakeActionUseCase {
  constructor(
    @inject(DI_TOKENS.IWorkflowEngine)
    private readonly engine: IWorkflowEngine,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("workflow.take-action")
  async execute(input: TakeActionInput, ctx: ActorContext): Promise<void> {
    return this.engine.takeAction(input, ctx);
  }
}
