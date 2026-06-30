/**
 * Workflow Place On Hold Use Case
 *
 * Thin wrapper around `WorkflowEngine.placeOnHold`. Pauses the request,
 * records the hold reason, emits PAUSE SLA events on every ACTIVE step,
 * notifies watchers, and dispatches `request.held` event bindings.
 */

import { inject, injectable } from "inversify";

import { DI_TOKENS } from "@/di/types";
import type { ActorContext } from "@/core/domain/workflow";
import type { IWorkflowEngine } from "@/core/repositories/workflow";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { LogExecution } from "@/lib/decorators/log-execution.decorator";

@injectable()
export class WorkflowPlaceOnHoldUseCase {
  constructor(
    @inject(DI_TOKENS.IWorkflowEngine)
    private readonly engine: IWorkflowEngine,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("workflow.place-on-hold")
  async execute(
    requestId: string,
    holdReasonId: string,
    ctx: ActorContext,
  ): Promise<void> {
    return this.engine.placeOnHold(requestId, holdReasonId, ctx);
  }
}
