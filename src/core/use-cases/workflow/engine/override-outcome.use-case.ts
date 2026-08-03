/**
 * Workflow Override Outcome Use Case
 *
 * Thin wrapper around `WorkflowEngine.overrideOutcome`. Admin override that
 * forces a terminal outcome on a request — CANCELLED for cancellation-class
 * outcomes (WITHDRAWN, REJECTED, SUPERSEDED, ABANDONED, EXPIRED) and CLOSED
 * for close-class outcomes (SUCCESSFUL, SUCCESSFUL_WITH_ISSUES, UNSUCCESSFUL).
 * Notes required for any non-SUCCESSFUL outcome (PRD §10.2).
 */

import { inject, injectable } from "inversify";

import { DI_TOKENS } from "@/di/types";
import type { ActorContext } from "@/core/domain/workflow";
import type {
  IWorkflowEngine,
  TerminalOutcome,
} from "@/core/repositories/workflow";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { LogExecution } from "@/lib/decorators/log-execution.decorator";

@injectable()
export class WorkflowOverrideOutcomeUseCase {
  constructor(
    @inject(DI_TOKENS.IWorkflowEngine)
    private readonly engine: IWorkflowEngine,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("workflow.override-outcome")
  async execute(
    requestId: string,
    outcome: TerminalOutcome,
    ctx: ActorContext,
    notes?: string,
    outcomeCodeId?: string | null,
  ): Promise<void> {
    return this.engine.overrideOutcome(
      requestId,
      outcome,
      ctx,
      notes,
      outcomeCodeId,
    );
  }
}
