/**
 * Execution Step Executor
 *
 * Assignee marks the work COMPLETE.
 */

import { injectable } from "inversify";

import { InvalidStateError } from "@/core/domain/workflow";
import type { ActionKind, StepConfig } from "@/core/domain/workflow";
import type {
  ActionResult,
  ActivationResult,
  IStepExecutor,
} from "@/core/repositories/workflow";

@injectable()
export class ExecutionStepExecutor implements IStepExecutor {
  readonly type = "EXECUTION" as const;

  async activate(): Promise<ActivationResult> {
    return { kind: "ACTIVE" };
  }

  async handleAction(
    _config: StepConfig,
    action: ActionKind,
  ): Promise<ActionResult> {
    if (action === "COMPLETE") return { kind: "ADVANCE" };
    if (action === "REJECT") return { kind: "REJECT" };
    throw new InvalidStateError(
      `Execution step does not accept action: ${action}`,
    );
  }
}
