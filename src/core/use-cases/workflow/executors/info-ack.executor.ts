/**
 * Info / Acknowledgement Step Executor
 *
 * Assignees ACKNOWLEDGE.
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
export class InfoAckStepExecutor implements IStepExecutor {
  readonly type = "INFO_ACK" as const;

  async activate(): Promise<ActivationResult> {
    return { kind: "ACTIVE" };
  }

  async handleAction(
    _config: StepConfig,
    action: ActionKind,
  ): Promise<ActionResult> {
    if (action === "ACKNOWLEDGE") return { kind: "ADVANCE" };
    throw new InvalidStateError(
      `Info/Ack step does not accept action: ${action}`,
    );
  }
}
