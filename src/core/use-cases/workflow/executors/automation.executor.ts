/**
 * Automation Step Executor
 *
 * Handler runs at activation; step auto-advances based on the handler result.
 */

import { inject, injectable } from "inversify";

import { DI_TOKENS } from "@/di/types";
import { InvalidStateError } from "@/core/domain/workflow";
import type { StepConfig } from "@/core/domain/workflow";
import type {
  ActionResult,
  ActivationResult,
  ExecCtx,
  IAutomationHandlerRegistry,
  IStepExecutor,
} from "@/core/repositories/workflow";

@injectable()
export class AutomationStepExecutor implements IStepExecutor {
  readonly type = "AUTOMATION" as const;

  constructor(
    @inject(DI_TOKENS.IWorkflowAutomationHandlerRegistry)
    private readonly handlerRegistry: IAutomationHandlerRegistry,
  ) {}

  async activate(config: StepConfig, exec: ExecCtx): Promise<ActivationResult> {
    const cfg = config as Extract<StepConfig, { type: "AUTOMATION" }>;
    const handler = this.handlerRegistry.get(cfg.handler);
    const result = await handler.run(cfg.args ?? {}, exec);
    // Field updates are applied by the engine after activation returns.
    // Stash on outcomeJson; the engine reads it.
    await exec.tx.stepInstance.update({
      where: { id: exec.stepInstanceId },
      data: {
        outcomeJson: { fieldUpdates: result.fieldUpdates ?? {} } as object,
      },
    });
    return result.advance ? { kind: "AUTO_COMPLETE" } : { kind: "ACTIVE" };
  }

  async handleAction(): Promise<ActionResult> {
    throw new InvalidStateError("Automation steps do not accept user actions");
  }
}
