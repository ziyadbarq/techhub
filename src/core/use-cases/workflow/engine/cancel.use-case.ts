/**
 * Workflow Cancel Use Case
 *
 * Thin wrapper around `WorkflowEngine.cancel`. Cancels a request with a
 * terminal `CancelOutcome` and an audit note. Cascades to any inbound-linked
 * source requests as SUPERSEDED. Notes are required (PRD §10.2 — every
 * cancel outcome is non-SUCCESSFUL).
 */

import { inject, injectable } from "inversify";

import { DI_TOKENS } from "@/di/types";
import type { ActorContext } from "@/core/domain/workflow";
import type {
  CancelOutcome,
  IWorkflowEngine,
} from "@/core/repositories/workflow";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { LogExecution } from "@/lib/decorators/log-execution.decorator";

@injectable()
export class WorkflowCancelUseCase {
  constructor(
    @inject(DI_TOKENS.IWorkflowEngine)
    private readonly engine: IWorkflowEngine,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("workflow.cancel")
  async execute(
    requestId: string,
    outcome: CancelOutcome,
    note: string | undefined,
    ctx: ActorContext,
    outcomeCodeId?: string | null,
  ): Promise<void> {
    return this.engine.cancel(requestId, outcome, note, ctx, outcomeCodeId);
  }
}
