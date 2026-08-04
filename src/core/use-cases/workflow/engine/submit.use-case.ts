/**
 * Workflow Submit Use Case
 *
 * Thin wrapper around `WorkflowEngine.submit`. Validates the form is active
 * and published, materialises field values + REQUEST_LINK rows, snapshots
 * computed fields, resolves watchers, activates the start step, and dispatches
 * `request.submitted` notifications — all in a single Prisma transaction.
 */

import { inject, injectable } from "inversify";

import { DI_TOKENS } from "@/di/types";
import type { ActorContext, SubmitInput } from "@/core/domain/workflow";
import type { IWorkflowEngine } from "@/core/repositories/workflow";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { LogExecution } from "@/lib/decorators/log-execution.decorator";

@injectable()
export class WorkflowSubmitUseCase {
  constructor(
    @inject(DI_TOKENS.IWorkflowEngine)
    private readonly engine: IWorkflowEngine,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("workflow.submit")
  async execute(
    input: SubmitInput,
    ctx: ActorContext,
  ): Promise<{ requestId: string; referenceNumber: string }> {
    return this.engine.submit(input, ctx);
  }
}
