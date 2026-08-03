/**
 * Workflow Resume Use Case
 *
 * Thin wrapper around `WorkflowEngine.resume`. Lifts a hold by moving the
 * request back to IN_REVIEW, clearing the hold reason, emitting RESUME SLA
 * events, notifying watchers, and dispatching `request.resumed` event
 * bindings.
 */

import { inject, injectable } from "inversify";

import { DI_TOKENS } from "@/di/types";
import type { ActorContext } from "@/core/domain/workflow";
import type { IWorkflowEngine } from "@/core/repositories/workflow";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { LogExecution } from "@/lib/decorators/log-execution.decorator";

@injectable()
export class WorkflowResumeUseCase {
  constructor(
    @inject(DI_TOKENS.IWorkflowEngine)
    private readonly engine: IWorkflowEngine,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("workflow.resume")
  async execute(requestId: string, ctx: ActorContext): Promise<void> {
    return this.engine.resume(requestId, ctx);
  }
}
