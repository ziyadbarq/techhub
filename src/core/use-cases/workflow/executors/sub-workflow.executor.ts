/**
 * Sub-Workflow Step Executor
 *
 * Spawns a child request via `engine.submit`, links it to the parent via
 * RequestLink, and either advances immediately (fire-and-forget) or stays
 * ACTIVE waiting for the child to close.
 *
 * The "wait for outcome" path is completed by a separate completion hook
 * inside the engine — when any request closes, parent steps waiting on it
 * are advanced.
 */

import { inject, injectable } from "inversify";

import { DI_TOKENS } from "@/di/types";
import { ConfigurationError, InvalidStateError } from "@/core/domain/workflow";
import type { StepConfig, SubWorkflowStepConfig } from "@/core/domain/workflow";
import type {
  ActionResult,
  ActivationResult,
  ExecCtx,
  IStepExecutor,
  IWorkflowEngine,
} from "@/core/repositories/workflow";

type WorkflowEngineProvider = () => IWorkflowEngine;

@injectable()
export class SubWorkflowStepExecutor implements IStepExecutor {
  readonly type = "SUB_WORKFLOW" as const;

  constructor(
    @inject(DI_TOKENS.IWorkflowEngineProvider)
    private readonly getEngine: WorkflowEngineProvider,
  ) {}

  async activate(config: StepConfig, exec: ExecCtx): Promise<ActivationResult> {
    const cfg = config as SubWorkflowStepConfig;
    if (!cfg.childFormId) {
      throw new ConfigurationError("Sub-workflow step requires childFormId");
    }

    // Map parent fields → child field values
    const childValues: Record<string, unknown> = {};
    if (cfg.fieldMapping) {
      for (const [childKey, parentKey] of Object.entries(cfg.fieldMapping)) {
        childValues[childKey] = exec.fieldValues[parentKey] ?? null;
      }
    }

    const submission = await this.getEngine().submit(
      { formId: cfg.childFormId, fieldValues: childValues },
      exec.ctx,
    );

    // Persist the link so cancel-cascade and timeline rendering work.
    await exec.tx.requestLink.create({
      data: {
        sourceRequestId: submission.requestId,
        targetRequestId: exec.requestId,
        linkType: "sub-workflow",
        sourceFieldKey: "__sub_workflow_parent",
      },
    });

    const updates: Record<string, unknown> = {};
    if (cfg.childRequestIdField) {
      updates[cfg.childRequestIdField] = submission.requestId;
    }

    // Stash on the step instance so the engine can apply field updates and
    // (later) so the child-closed hook can find this step.
    await exec.tx.stepInstance.update({
      where: { id: exec.stepInstanceId },
      data: {
        outcomeJson: {
          childRequestId: submission.requestId,
          childReferenceNumber: submission.referenceNumber,
          fieldUpdates: updates,
          waitForOutcome: cfg.waitForOutcome !== false,
        } as object,
      },
    });

    const wait = cfg.waitForOutcome !== false;
    return wait ? { kind: "ACTIVE" } : { kind: "AUTO_COMPLETE" };
  }

  async handleAction(): Promise<ActionResult> {
    throw new InvalidStateError(
      "Sub-workflow steps do not accept direct user actions",
    );
  }
}
