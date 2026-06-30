/**
 * Delay Step Executor
 *
 * Waits N ms. The schedule-tick cron advances delayed steps.
 * Activation completes immediately if duration is 0; otherwise stays ACTIVE.
 */

import { injectable } from "inversify";

import { InvalidStateError } from "@/core/domain/workflow";
import type { StepConfig } from "@/core/domain/workflow";
import type {
  ActionResult,
  ActivationResult,
  IStepExecutor,
} from "@/core/repositories/workflow";

@injectable()
export class DelayStepExecutor implements IStepExecutor {
  readonly type = "DELAY" as const;

  async activate(config: StepConfig): Promise<ActivationResult> {
    const cfg = config as Extract<StepConfig, { type: "DELAY" }>;
    if ((cfg.durationMs ?? 0) <= 0) return { kind: "AUTO_COMPLETE" };
    return { kind: "ACTIVE" };
  }

  async handleAction(): Promise<ActionResult> {
    throw new InvalidStateError("Delay steps do not accept user actions");
  }
}
