/**
 * Wait-For-Event Step Executor
 *
 * Stays ACTIVE until an external system POSTs to
 * `/api/workflow/events/{requestId}/{eventKey}`.
 *
 * The callback handler — not this executor — is what advances the workflow
 * (it calls engine.forceAdvance internally). This executor only sets up the
 * waiting state.
 */

import { injectable } from "inversify";

import { InvalidStateError } from "@/core/domain/workflow";
import type {
  ActionResult,
  ActivationResult,
  IStepExecutor,
} from "@/core/repositories/workflow";

@injectable()
export class WaitForEventStepExecutor implements IStepExecutor {
  readonly type = "WAIT_FOR_EVENT" as const;

  async activate(): Promise<ActivationResult> {
    return { kind: "ACTIVE" };
  }

  async handleAction(): Promise<ActionResult> {
    throw new InvalidStateError(
      "Wait-for-event steps do not accept user actions; advance via the callback endpoint",
    );
  }
}
