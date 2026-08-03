/**
 * Approval Step Executor
 *
 * Assignees act with APPROVE / REJECT.
 * The multi-assignee policy controls when the step advances.
 */

import { injectable } from "inversify";

import { InvalidStateError } from "@/core/domain/workflow";
import type {
  ActionKind,
  ApprovalStepConfig,
  StepConfig,
} from "@/core/domain/workflow";
import type {
  ActionResult,
  ActivationResult,
  ExecCtx,
  IStepExecutor,
} from "@/core/repositories/workflow";

@injectable()
export class ApprovalStepExecutor implements IStepExecutor {
  readonly type = "APPROVAL" as const;

  async activate(): Promise<ActivationResult> {
    return { kind: "ACTIVE" };
  }

  async handleAction(
    config: StepConfig,
    action: ActionKind,
    exec: ExecCtx,
  ): Promise<ActionResult> {
    const cfg = config as ApprovalStepConfig;
    if (action === "REJECT") {
      if (cfg.allowReject === false) {
        throw new InvalidStateError("This approval step does not allow REJECT");
      }
      return { kind: "REJECT" };
    }
    if (action !== "APPROVE") {
      throw new InvalidStateError(
        `Approval step does not accept action: ${action}`,
      );
    }

    const policy = cfg.multiAssigneePolicy ?? "ANY";
    const required = await this.requiredApprovalCount(cfg, policy, exec);
    const current = await this.currentApprovalCount(exec);

    if (current + 1 >= required) {
      return { kind: "ADVANCE" };
    }
    return { kind: "RECORDED" };
  }

  private async requiredApprovalCount(
    cfg: ApprovalStepConfig,
    policy: NonNullable<ApprovalStepConfig["multiAssigneePolicy"]>,
    exec: ExecCtx,
  ): Promise<number> {
    const snapshotCount = await exec.tx.assigneeSnapshot.count({
      where: { stepInstanceId: exec.stepInstanceId },
    });
    switch (policy) {
      case "ANY":
        return 1;
      case "ALL":
      case "UNANIMOUS":
        return Math.max(1, snapshotCount);
      case "MAJORITY":
        return Math.max(1, Math.floor(snapshotCount / 2) + 1);
      case "QUORUM":
        return Math.max(1, cfg.quorum ?? 1);
    }
  }

  private async currentApprovalCount(exec: ExecCtx): Promise<number> {
    return exec.tx.auditEntry.count({
      where: {
        stepInstanceId: exec.stepInstanceId,
        action: "step.approve",
      },
    });
  }
}
