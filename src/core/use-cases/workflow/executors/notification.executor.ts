/**
 * Notification Step Executor
 *
 * Fires a notification at activation; auto-advances.
 * The actual sender is wired by infrastructure; this executor records the
 * intent and auto-completes immediately.
 */

import { injectable } from "inversify";

import { InvalidStateError } from "@/core/domain/workflow";
import type {
  ActionResult,
  ActivationResult,
  IStepExecutor,
} from "@/core/repositories/workflow";

@injectable()
export class NotificationStepExecutor implements IStepExecutor {
  readonly type = "NOTIFICATION" as const;

  async activate(): Promise<ActivationResult> {
    return { kind: "AUTO_COMPLETE" };
  }

  async handleAction(): Promise<ActionResult> {
    throw new InvalidStateError(
      "Notification steps do not accept user actions",
    );
  }
}
