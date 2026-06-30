/**
 * Workflow Engine — orchestrator
 *
 * Implements `IWorkflowEngine` (the public API). All state transitions are
 * wrapped in a single Prisma transaction so audit appends, field history,
 * SLA events, and assignee snapshots stay atomic with Request / StepInstance
 * mutations.
 *
 * Single-tenant: no `organizationId` is read or persisted. Actor identity
 * comes from `ctx.userId` (human) or `ctx.system` (engine-triggered).
 *
 * This class composes the 10 per-use-case wrappers via constructor injection;
 * the wrappers delegate back here. All shared private helpers (step
 * activation, advancement, finalization, cascade, watcher dispatch, event
 * notification dispatch, etc.) live as private methods on this class.
 */

import { inject, injectable } from "inversify";

import { DI_TOKENS } from "@/di/types";
import type { PrismaClient } from "@/generated/prisma/server";
import {
  ConfigurationError,
  InvalidStateError,
  NotFoundError,
} from "@/core/domain/workflow";
import type {
  ActorContext,
  AssigneeSpec,
  Expression,
  FormSchema,
  StepDefinition,
  SubmitInput,
  TakeActionInput,
  WorkflowGraph,
} from "@/core/domain/workflow";
import type {
  ActivationResult,
  CancelOutcome,
  ExecCtx,
  IAssigneeResolverRegistry,
  IStepExecutorRegistry,
  IWorkflowAuditRepository,
  IWorkflowDefinitionRepository,
  IWorkflowEngine,
  IWorkflowFormRepository,
  IWorkflowRequestRepository,
  IWorkflowSLAEventRepository,
  IWorkflowStepInstanceRepository,
  TerminalOutcome,
  Tx,
} from "@/core/repositories/workflow";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { LogExecution } from "@/lib/decorators/log-execution.decorator";
import type { IDelegationResolver } from "@/infrastructure/services/workflow/delegation-resolver.service";
import type { IExpressionEvaluator } from "@/infrastructure/services/workflow/expression-evaluator.service";
import type { INotificationService } from "@/infrastructure/services/workflow/notification.service";
import type { IReferenceNumberService } from "@/infrastructure/services/workflow/reference-numbers.service";

const ACTION_TO_AUDIT: Record<TakeActionInput["action"], string> = {
  APPROVE: "step.approve",
  REJECT: "step.reject",
  COMPLETE: "step.complete",
  ACKNOWLEDGE: "step.acknowledge",
  REQUEST_INFO: "step.request_info",
  PROVIDE_INFO: "step.provide_info",
};

@injectable()
export class WorkflowEngine implements IWorkflowEngine {
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
    @inject(DI_TOKENS.IWorkflowFormRepository)
    private readonly forms: IWorkflowFormRepository,
    @inject(DI_TOKENS.IWorkflowDefinitionRepository)
    private readonly workflows: IWorkflowDefinitionRepository,
    @inject(DI_TOKENS.IWorkflowRequestRepository)
    private readonly requests: IWorkflowRequestRepository,
    @inject(DI_TOKENS.IWorkflowStepInstanceRepository)
    private readonly steps: IWorkflowStepInstanceRepository,
    @inject(DI_TOKENS.IWorkflowAuditRepository)
    private readonly audit: IWorkflowAuditRepository,
    @inject(DI_TOKENS.IWorkflowSLAEventRepository)
    private readonly slaEvents: IWorkflowSLAEventRepository,
    @inject(DI_TOKENS.IWorkflowStepExecutorRegistry)
    private readonly executors: IStepExecutorRegistry,
    @inject(DI_TOKENS.IWorkflowAssigneeResolverRegistry)
    private readonly resolvers: IAssigneeResolverRegistry,
    @inject(DI_TOKENS.IWorkflowDelegationResolver)
    private readonly delegations: IDelegationResolver,
    @inject(DI_TOKENS.IWorkflowNotificationService)
    private readonly notifications: INotificationService,
    @inject(DI_TOKENS.IWorkflowExpressionEvaluator)
    private readonly expressionEvaluator: IExpressionEvaluator,
    @inject(DI_TOKENS.IWorkflowReferenceNumberService)
    private readonly referenceNumbers: IReferenceNumberService,
  ) {}

  // --------------------------------------------------------------------------
  // submit
  // --------------------------------------------------------------------------
  @LogExecution("workflow.submit")
  async submit(
    input: SubmitInput,
    ctx: ActorContext,
  ): Promise<{ requestId: string; referenceNumber: string }> {
    return this.prisma.$transaction(async (tx) => {
      const form = await this.forms.findById(tx, input.formId);
      if (!form) throw new NotFoundError("Form", input.formId);
      if (!form.isActive) throw new InvalidStateError("Form is inactive");

      const formVersion = await this.forms.findPublishedVersion(tx, form.id);
      if (!formVersion) {
        throw new ConfigurationError("Form has no published version");
      }

      // Required-field guard (defense-in-depth — UI also validates).
      const schema = formVersion.schemaJson as unknown as {
        fields?: Array<{
          key: string;
          label?: string;
          type: string;
          required?: boolean;
        }>;
      };
      const missing: string[] = [];
      for (const f of schema.fields ?? []) {
        if (!f.required) continue;
        if (f.type === "SECTION_HEADER" || f.type === "COMPUTED") continue;
        const v = (input.fieldValues as Record<string, unknown>)[f.key];
        if (
          v === null ||
          v === undefined ||
          (typeof v === "string" && v.trim() === "") ||
          (Array.isArray(v) && v.length === 0)
        ) {
          missing.push(f.label ?? f.key);
        }
      }
      if (missing.length > 0) {
        throw new InvalidStateError(
          `Required fields are missing: ${missing.join(", ")}`,
        );
      }

      const wfDef = await this.workflows.findById(
        tx,
        form.workflowDefinitionId,
      );
      if (!wfDef)
        throw new NotFoundError(
          "WorkflowDefinition",
          form.workflowDefinitionId,
        );

      const wfVersion = await this.workflows.findPublishedVersion(tx, wfDef.id);
      if (!wfVersion) {
        throw new ConfigurationError("Workflow has no published version");
      }

      const referenceNumber = await this.referenceNumbers.generate(form.id, tx);

      const request = await this.requests.create(tx, {
        referenceNumber,
        formId: form.id,
        formVersionId: formVersion.id,
        workflowVersionId: wfVersion.id,
        requesterId: ctx.userId ?? "",
        status: "SUBMITTED",
        submittedAt: new Date(),
      });

      await this.requests.setFieldValues(
        tx,
        request.id,
        formVersion.id,
        input.fieldValues,
      );

      // Materialise REQUEST_LINK fields as RequestLink rows. The field
      // value is the target request id; we use the field key as linkType
      // so cancel-cascade and parent-gating can identify the relation.
      for (const f of schema.fields ?? []) {
        if (f.type !== "REQUEST_LINK") continue;
        const targetId = (input.fieldValues as Record<string, unknown>)[f.key];
        if (typeof targetId !== "string" || targetId.trim() === "") continue;
        const target = await tx.request.findFirst({
          where: { id: targetId },
          select: { id: true },
        });
        if (!target) continue;
        await tx.requestLink.upsert({
          where: {
            sourceRequestId_targetRequestId_sourceFieldKey: {
              sourceRequestId: request.id,
              targetRequestId: target.id,
              sourceFieldKey: f.key,
            },
          },
          update: {},
          create: {
            sourceRequestId: request.id,
            targetRequestId: target.id,
            sourceFieldKey: f.key,
            linkType: "request_link",
          },
        });
      }

      // Snapshot computed fields against the submitted values.
      const computed = await this.recomputeComputedFields(
        tx,
        request.id,
        formVersion.id,
        input.fieldValues,
      );

      const submitAudit = await this.audit.append(tx, {
        ctx,
        requestId: request.id,
        action: "request.submit",
        payload: { fieldKeys: Object.keys(input.fieldValues) },
      });
      await this.audit.appendFieldHistory(tx, {
        requestId: request.id,
        formVersionId: formVersion.id,
        values: { ...input.fieldValues, ...computed },
        computedValues: computed,
        auditEntryId: submitAudit.id,
      });

      // Resolve watchers (PRD §13.4): requester (implicit) + form-level
      // role subscriptions. Resolved once at submit time and frozen.
      await this.resolveWatchers(tx, request.id, form.id, request.requesterId);

      const graph = wfVersion.graphJson as unknown as WorkflowGraph;
      await this.activateStep(tx, ctx, request.id, graph, graph.start);

      await this.dispatchEventNotifications(
        tx,
        ctx,
        "request.submitted",
        request.id,
      );

      return { requestId: request.id, referenceNumber };
    });
  }

  /**
   * Evaluate every COMPUTED field on the pinned form version against the
   * given values, persist the results, and return the map. The engine calls
   * this on submit, resubmit, and after every takeAction that includes
   * fieldUpdates so computed values stay coherent with their inputs.
   */
  private async recomputeComputedFields(
    tx: Tx,
    requestId: string,
    formVersionId: string,
    values: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const fv = await tx.formVersion.findUnique({
      where: { id: formVersionId },
      select: { schemaJson: true },
    });
    if (!fv) return {};
    const schema = fv.schemaJson as unknown as FormSchema;
    const ctx = { fields: values };
    const computed: Record<string, unknown> = {};
    for (const field of schema.fields ?? []) {
      if (field.type === "COMPUTED" && field.computedFormula) {
        try {
          computed[field.key] = this.expressionEvaluator.evaluate(
            field.computedFormula as Expression,
            ctx,
          );
        } catch {
          computed[field.key] = null;
        }
      }
    }
    if (Object.keys(computed).length > 0) {
      await this.requests.setFieldValues(
        tx,
        requestId,
        formVersionId,
        computed,
      );
    }
    return computed;
  }

  /** Watcher resolution at submission. Implicit requester + role subscriptions. */
  private async resolveWatchers(
    tx: Tx,
    requestId: string,
    formId: string,
    requesterId: string,
  ): Promise<void> {
    const seen = new Set<string>();
    seen.add(requesterId);

    const subs = await tx.watcherSubscription.findMany({
      where: { formId },
      select: { roleId: true },
    });
    if (subs.length > 0) {
      const memberRows = await tx.userRole.findMany({
        where: { roleId: { in: subs.map((s) => s.roleId) } },
        select: { userId: true },
      });
      for (const row of memberRows) seen.add(row.userId);
    }

    const rows = [...seen].map((userId) => ({
      requestId,
      userId,
      reason: userId === requesterId ? "requestor" : "subscription",
    }));
    await tx.watcher.createMany({ data: rows, skipDuplicates: true });
  }

  // --------------------------------------------------------------------------
  // takeAction
  // --------------------------------------------------------------------------
  @LogExecution("workflow.take-action")
  async takeAction(input: TakeActionInput, ctx: ActorContext): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const stepInstance = await this.steps.findById(tx, input.stepInstanceId);
      if (!stepInstance)
        throw new NotFoundError("StepInstance", input.stepInstanceId);
      if (stepInstance.status !== "ACTIVE") {
        throw new InvalidStateError(
          `Step is not ACTIVE: ${stepInstance.status}`,
        );
      }

      const request = await this.requests.findById(tx, stepInstance.requestId);
      if (!request) throw new NotFoundError("Request", stepInstance.requestId);
      if (
        request.status === "ON_HOLD" ||
        request.status === "CLOSED" ||
        request.status === "CANCELLED"
      ) {
        throw new InvalidStateError(
          `Request is ${request.status}; cannot take actions`,
        );
      }

      const wfVersion = await this.workflows.findVersion(
        tx,
        stepInstance.workflowVersionId,
      );
      if (!wfVersion)
        throw new NotFoundError(
          "WorkflowVersion",
          stepInstance.workflowVersionId,
        );
      const graph = wfVersion.graphJson as unknown as WorkflowGraph;
      const stepDef = findStep(graph, stepInstance.stepKey);

      // Authorization: only snapshot users (or admins via override paths) may act.
      if (ctx.userId) {
        const allowed = await tx.assigneeSnapshot.findFirst({
          where: { stepInstanceId: stepInstance.id, userId: ctx.userId },
          select: { id: true },
        });
        if (!allowed) {
          throw new InvalidStateError(
            "Actor is not in this step's assignee snapshot",
          );
        }
      }

      const fieldValues = await this.requests.getFieldValues(tx, request.id);
      const exec: ExecCtx = {
        tx,
        ctx,
        requestId: request.id,
        stepInstanceId: stepInstance.id,
        fieldValues,
      };

      const executor = this.executors.get(stepDef.config.type);
      const result = await executor.handleAction(
        stepDef.config,
        input.action,
        exec,
      );

      // Apply field updates submitted with the action (if any) and refresh
      // any COMPUTED fields whose inputs may have changed.
      let computedAfterAction: Record<string, unknown> = {};
      if (input.fieldUpdates && Object.keys(input.fieldUpdates).length > 0) {
        await this.requests.setFieldValues(
          tx,
          request.id,
          request.formVersionId,
          input.fieldUpdates,
        );
        const merged = await this.requests.getFieldValues(tx, request.id);
        computedAfterAction = await this.recomputeComputedFields(
          tx,
          request.id,
          request.formVersionId,
          merged,
        );
      }

      const actionAudit = await this.audit.append(tx, {
        ctx,
        requestId: request.id,
        stepInstanceId: stepInstance.id,
        action: ACTION_TO_AUDIT[input.action] ?? "step.action",
        payload: {
          action: input.action,
          comment: input.comment ?? null,
          fieldUpdateKeys: input.fieldUpdates
            ? Object.keys(input.fieldUpdates)
            : [],
        },
      });

      if (input.fieldUpdates) {
        await this.audit.appendFieldHistory(tx, {
          requestId: request.id,
          formVersionId: request.formVersionId,
          values: { ...input.fieldUpdates, ...computedAfterAction },
          computedValues: computedAfterAction,
          auditEntryId: actionAudit.id,
        });
      }

      switch (result.kind) {
        case "RECORDED":
          // step still needs more votes; nothing more to do
          return;
        case "REJECT":
          await this.rejectInPlace(
            tx,
            ctx,
            request.id,
            stepInstance.id,
            input.comment ?? null,
          );
          return;
        case "RETURN_TO_REQUESTER":
          await this.requests.update(tx, request.id, { status: "ON_HOLD" });
          return;
        case "ADVANCE":
          await this.completeStep(tx, stepInstance.id, "COMPLETED");
          await this.advanceFromStep(
            tx,
            ctx,
            request.id,
            graph,
            stepDef,
            input.action,
            result.nextStepKey,
          );
          return;
      }
    });
  }

  // --------------------------------------------------------------------------
  // resubmit (after a same-record rejection)
  // --------------------------------------------------------------------------
  @LogExecution("workflow.resubmit")
  async resubmit(
    requestId: string,
    fieldUpdates: Record<string, unknown>,
    ctx: ActorContext,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const req = await this.requests.findById(tx, requestId);
      if (!req) throw new NotFoundError("Request", requestId);
      if (req.status !== "DRAFT") {
        throw new InvalidStateError(
          `Cannot resubmit from ${req.status}; must be DRAFT`,
        );
      }

      let resubmitComputed: Record<string, unknown> = {};
      if (Object.keys(fieldUpdates).length > 0) {
        await this.requests.setFieldValues(
          tx,
          req.id,
          req.formVersionId,
          fieldUpdates,
        );
        const merged = await this.requests.getFieldValues(tx, req.id);
        resubmitComputed = await this.recomputeComputedFields(
          tx,
          req.id,
          req.formVersionId,
          merged,
        );
      }

      const submitAudit = await this.audit.append(tx, {
        ctx,
        requestId: req.id,
        action: "request.resubmit",
        payload: { fieldKeys: Object.keys(fieldUpdates) },
      });
      if (Object.keys(fieldUpdates).length > 0) {
        await this.audit.appendFieldHistory(tx, {
          requestId: req.id,
          formVersionId: req.formVersionId,
          values: { ...fieldUpdates, ...resubmitComputed },
          computedValues: resubmitComputed,
          auditEntryId: submitAudit.id,
        });
      }

      await this.requests.update(tx, req.id, {
        status: "SUBMITTED",
        submittedAt: new Date(),
      });

      const wfVersion = await this.workflows.findVersion(
        tx,
        req.workflowVersionId,
      );
      if (!wfVersion)
        throw new NotFoundError("WorkflowVersion", req.workflowVersionId);
      const graph = wfVersion.graphJson as unknown as WorkflowGraph;

      await this.activateStep(tx, ctx, req.id, graph, graph.start);
    });
  }

  /** Reject in place: same record. Mark current step FAILED, move to DRAFT for the requester to edit and resubmit. */
  private async rejectInPlace(
    tx: Tx,
    ctx: ActorContext,
    requestId: string,
    stepInstanceId: string,
    comment: string | null,
  ): Promise<void> {
    await this.completeStep(tx, stepInstanceId, "FAILED");
    // Cancel any pending step instances on this request so the next resubmit starts clean.
    await tx.stepInstance.updateMany({
      where: { requestId, status: "PENDING" },
      data: { status: "CANCELLED", completedAt: new Date() },
    });
    await this.requests.update(tx, requestId, {
      status: "DRAFT",
      currentStepInstanceId: null,
    });
    await this.audit.append(tx, {
      ctx,
      requestId,
      stepInstanceId,
      action: "request.return_to_draft_after_reject",
      payload: { comment },
    });
    await this.notifyWatchers(tx, requestId, {
      subject: "Request returned for correction",
      body: comment ?? "Edit and resubmit.",
      templateKey: "request.rejected",
    });
  }

  // --------------------------------------------------------------------------
  // placeOnHold / resume
  // --------------------------------------------------------------------------
  @LogExecution("workflow.place-on-hold")
  async placeOnHold(
    requestId: string,
    holdReasonId: string,
    ctx: ActorContext,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const req = await this.requests.findById(tx, requestId);
      if (!req) throw new NotFoundError("Request", requestId);
      if (req.status === "ON_HOLD") {
        throw new InvalidStateError("Request is already ON_HOLD");
      }
      if (["CLOSED", "CANCELLED", "DRAFT"].includes(req.status)) {
        throw new InvalidStateError(`Cannot hold from ${req.status}`);
      }
      await this.requests.update(tx, requestId, {
        status: "ON_HOLD",
        holdReasonId,
      });
      await this.audit.append(tx, {
        ctx,
        requestId,
        action: "request.hold",
        payload: { holdReasonId },
      });
      // Pause SLA clocks on every ACTIVE step (PRD §13.3, §10.3).
      const activeSteps = await tx.stepInstance.findMany({
        where: { requestId, status: "ACTIVE" },
        select: { id: true },
      });
      for (const s of activeSteps) {
        await this.slaEvents.append(tx, {
          stepInstanceId: s.id,
          eventType: "PAUSE",
          payload: { reason: "hold" },
        });
      }
      await this.notifyWatchers(tx, requestId, {
        subject: "Request placed on hold",
        body: "This request has been paused.",
        templateKey: "request.hold",
      });
      await this.dispatchEventNotifications(tx, ctx, "request.held", requestId);
    });
  }

  @LogExecution("workflow.resume")
  async resume(requestId: string, ctx: ActorContext): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const req = await this.requests.findById(tx, requestId);
      if (!req) throw new NotFoundError("Request", requestId);
      if (req.status !== "ON_HOLD") {
        throw new InvalidStateError(`Request is not ON_HOLD: ${req.status}`);
      }
      await this.requests.update(tx, requestId, {
        status: "IN_REVIEW",
        holdReasonId: null,
      });
      await this.audit.append(tx, {
        ctx,
        requestId,
        action: "request.resume",
        payload: {},
      });
      // Resume SLA clocks on the same ACTIVE steps.
      const activeSteps = await tx.stepInstance.findMany({
        where: { requestId, status: "ACTIVE" },
        select: { id: true },
      });
      for (const s of activeSteps) {
        await this.slaEvents.append(tx, {
          stepInstanceId: s.id,
          eventType: "RESUME",
          payload: { reason: "hold_cleared" },
        });
      }
      await this.notifyWatchers(tx, requestId, {
        subject: "Request resumed",
        body: "This request is moving again.",
        templateKey: "request.resume",
      });
      await this.dispatchEventNotifications(
        tx,
        ctx,
        "request.resumed",
        requestId,
      );
    });
  }

  // --------------------------------------------------------------------------
  // cancel (with linked-request cascade)
  // --------------------------------------------------------------------------
  @LogExecution("workflow.cancel")
  async cancel(
    requestId: string,
    outcome: CancelOutcome,
    note: string | undefined,
    ctx: ActorContext,
    outcomeCodeId?: string | null,
  ): Promise<void> {
    // Outcome notes are required for any non-SUCCESSFUL outcome (PRD §10.2).
    // For cancel, every outcome is non-SUCCESSFUL so notes are always required.
    if (!note || note.trim().length === 0) {
      throw new InvalidStateError(
        "Cancel requires a non-empty note (outcome ≠ SUCCESSFUL)",
      );
    }
    await this.prisma.$transaction(async (tx) => {
      await this.cancelRecursive(
        tx,
        requestId,
        outcome,
        note,
        ctx,
        outcomeCodeId ?? null,
        new Set(),
      );
    });
  }

  private async cancelRecursive(
    tx: Tx,
    requestId: string,
    outcome: CancelOutcome,
    note: string,
    ctx: ActorContext,
    outcomeCodeId: string | null,
    seen: Set<string>,
  ): Promise<void> {
    if (seen.has(requestId)) return;
    seen.add(requestId);

    const req = await this.requests.findById(tx, requestId);
    if (!req) return;
    if (req.status === "CLOSED" || req.status === "CANCELLED") return;

    // Cancel any inbound-linked source requests first (cascade).
    const inbound = await this.requests.findInboundLinks(tx, requestId);
    for (const link of inbound) {
      await this.cancelRecursive(
        tx,
        link.sourceRequestId,
        "SUPERSEDED",
        `Superseded by cancellation of parent ${requestId}`,
        ctx,
        null,
        seen,
      );
    }

    await this.requests.update(tx, requestId, {
      status: "CANCELLED",
      outcome,
      outcomeNotes: note,
      outcomeCodeId,
      holdReasonId: null,
      closedAt: new Date(),
      currentStepInstanceId: null,
    });

    // Mark any non-terminal step instances as CANCELLED.
    await tx.stepInstance.updateMany({
      where: {
        requestId,
        status: { in: ["PENDING", "ACTIVE"] },
      },
      data: { status: "CANCELLED", completedAt: new Date() },
    });

    await this.audit.append(tx, {
      ctx,
      requestId,
      action: "request.cancel",
      payload: { outcome, note },
    });
    await this.notifyWatchers(tx, requestId, {
      subject: "Request cancelled",
      body: note ?? `Outcome: ${outcome}`,
      templateKey: "request.cancel",
      payload: { outcome },
    });
    await this.dispatchEventNotifications(
      tx,
      ctx,
      "request.cancelled",
      requestId,
    );
  }

  // --------------------------------------------------------------------------
  // reject (admin-style, via stepInstanceId)
  // --------------------------------------------------------------------------
  @LogExecution("workflow.reject")
  async reject(
    stepInstanceId: string,
    reason: string,
    ctx: ActorContext,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const step = await this.steps.findById(tx, stepInstanceId);
      if (!step) throw new NotFoundError("StepInstance", stepInstanceId);
      await this.completeStep(tx, stepInstanceId, "FAILED");
      await this.closeRequest(tx, ctx, step.requestId, "UNSUCCESSFUL");
      await this.audit.append(tx, {
        ctx,
        requestId: step.requestId,
        stepInstanceId,
        action: "step.reject",
        payload: { reason },
      });
    });
  }

  // --------------------------------------------------------------------------
  // reassign / forceAdvance / overrideOutcome
  // --------------------------------------------------------------------------
  @LogExecution("workflow.reassign")
  async reassign(
    stepInstanceId: string,
    toUserId: string,
    ctx: ActorContext,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const step = await this.steps.findById(tx, stepInstanceId);
      if (!step) throw new NotFoundError("StepInstance", stepInstanceId);
      await this.audit.append(tx, {
        ctx,
        requestId: step.requestId,
        stepInstanceId,
        action: "step.reassign",
        payload: { toUserId },
      });
      await this.audit.appendAssigneeSnapshot(tx, {
        stepInstanceId,
        userIds: [toUserId],
      });
    });
  }

  @LogExecution("workflow.force-advance")
  async forceAdvance(stepInstanceId: string, ctx: ActorContext): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const step = await this.steps.findById(tx, stepInstanceId);
      if (!step) throw new NotFoundError("StepInstance", stepInstanceId);
      const wfv = await this.workflows.findVersion(tx, step.workflowVersionId);
      if (!wfv)
        throw new NotFoundError("WorkflowVersion", step.workflowVersionId);
      const graph = wfv.graphJson as unknown as WorkflowGraph;
      const def = findStep(graph, step.stepKey);
      await this.completeStep(tx, step.id, "COMPLETED");
      await this.audit.append(tx, {
        ctx,
        requestId: step.requestId,
        stepInstanceId: step.id,
        action: "step.force_advance",
        payload: {},
      });
      await this.advanceFromStep(
        tx,
        ctx,
        step.requestId,
        graph,
        def,
        null,
        undefined,
      );
    });
  }

  @LogExecution("workflow.override-outcome")
  async overrideOutcome(
    requestId: string,
    outcome: TerminalOutcome,
    ctx: ActorContext,
    notes?: string,
    outcomeCodeId?: string | null,
  ): Promise<void> {
    if (outcome !== "SUCCESSFUL" && (!notes || notes.trim().length === 0)) {
      throw new InvalidStateError(
        `overrideOutcome with ${outcome} requires non-empty notes (PRD §10.2)`,
      );
    }
    const isCancellation =
      outcome === "WITHDRAWN" ||
      outcome === "REJECTED" ||
      outcome === "SUPERSEDED" ||
      outcome === "ABANDONED" ||
      outcome === "EXPIRED";
    await this.prisma.$transaction(async (tx) => {
      const req = await this.requests.findById(tx, requestId);
      if (!req) throw new NotFoundError("Request", requestId);
      await this.requests.update(tx, requestId, {
        status: isCancellation ? "CANCELLED" : "CLOSED",
        outcome,
        outcomeNotes: notes ?? null,
        outcomeCodeId: outcomeCodeId ?? null,
        holdReasonId: null,
        closedAt: new Date(),
        currentStepInstanceId: null,
      });
      await this.audit.append(tx, {
        ctx,
        requestId,
        action: "request.override_outcome",
        payload: { outcome, outcomeCodeId, notes },
      });
    });
  }

  // --------------------------------------------------------------------------
  // Internal helpers
  // --------------------------------------------------------------------------

  /**
   * Iterate the configured assignee specs through their resolvers and return
   * the union of user ids. Mirrors the flowbit `AssigneeResolverRegistry.resolve`
   * (which TechHub's registry intentionally does NOT expose — registries here
   * only do lookup-by-kind, so the engine owns the iteration).
   */
  private async resolveAssignees(
    specs: AssigneeSpec[],
    exec: ExecCtx & { requesterId: string },
  ): Promise<string[]> {
    const ids = new Set<string>();
    for (const spec of specs) {
      const resolver = this.resolvers.get(spec.kind);
      const userIds = await resolver.resolve(spec, exec);
      for (const id of userIds) ids.add(id);
    }
    return [...ids];
  }

  private async activateStep(
    tx: Tx,
    ctx: ActorContext,
    requestId: string,
    graph: WorkflowGraph,
    stepKey: string,
  ): Promise<void> {
    const def = findStep(graph, stepKey);
    const req = await this.requests.findById(tx, requestId);
    if (!req) throw new NotFoundError("Request", requestId);

    const stepInstance = await this.steps.create(tx, {
      requestId,
      workflowVersionId: req.workflowVersionId,
      stepKey: def.key,
      status: "PENDING",
    });

    await this.requests.update(tx, requestId, {
      currentStepInstanceId: stepInstance.id,
      status: "IN_REVIEW",
    });

    // Resolve assignees from step config (if it has any) and snapshot.
    const assignees =
      "assignees" in def.config ? (def.config.assignees as AssigneeSpec[]) : [];
    const fieldValues = await this.requests.getFieldValues(tx, requestId);
    const exec: ExecCtx = {
      tx,
      ctx,
      requestId,
      stepInstanceId: stepInstance.id,
      fieldValues,
    };
    const rawUserIds = await this.resolveAssignees(assignees, {
      ...exec,
      requesterId: req.requesterId,
    });
    // Apply OOO / delegation chain (max depth 3, cycle-safe).
    const { resolved: userIds, chains } =
      await this.delegations.applyDelegations(tx, rawUserIds);
    if (userIds.length > 0) {
      await this.audit.appendAssigneeSnapshot(tx, {
        stepInstanceId: stepInstance.id,
        userIds,
        delegationChainsByUser: chains,
      });

      // Notify each new assignee that they have an action waiting.
      const formData = await tx.request.findUnique({
        where: { id: requestId },
        select: { formId: true, referenceNumber: true },
      });
      if (formData) {
        const actionLinks =
          def.config.type === "APPROVAL"
            ? (["APPROVE", "REJECT"] as const)
            : def.config.type === "EXECUTION"
              ? (["COMPLETE"] as const)
              : def.config.type === "INFO_ACK"
                ? (["ACKNOWLEDGE"] as const)
                : undefined;

        await this.notifications.sendToUsers(tx, {
          userIds,
          formId: formData.formId,
          requestId,
          stepInstanceId: stepInstance.id,
          subject: `Action needed on ${formData.referenceNumber}`,
          body: `Step "${def.key}" is waiting for your action.`,
          payload: { stepKey: def.key, stepType: def.config.type },
          actionLinks: actionLinks ? [...actionLinks] : undefined,
        });
      }
    }

    // SLA START event (if step has SLA config).
    const slaConfig = "sla" in def.config ? def.config.sla : undefined;
    if (slaConfig) {
      await this.slaEvents.append(tx, {
        stepInstanceId: stepInstance.id,
        eventType: "START",
      });
    }

    await this.audit.append(tx, {
      ctx,
      requestId,
      stepInstanceId: stepInstance.id,
      action: "step.activate",
      payload: { stepKey: def.key, stepType: def.config.type },
    });

    const executor = this.executors.get(def.config.type);
    const activation: ActivationResult = await executor.activate(
      def.config,
      exec,
    );

    if (activation.kind === "ACTIVE") {
      await this.steps.update(tx, stepInstance.id, {
        status: "ACTIVE",
        activatedAt: new Date(),
      });
      await this.dispatchEventNotifications(
        tx,
        ctx,
        "step.activated",
        requestId,
        stepInstance.id,
      );
      return;
    }

    // Apply any field updates from automation activation.
    const stashed = await tx.stepInstance.findUnique({
      where: { id: stepInstance.id },
      select: { outcomeJson: true },
    });
    const fieldUpdates =
      (
        stashed?.outcomeJson as {
          fieldUpdates?: Record<string, unknown>;
        } | null
      )?.fieldUpdates ?? {};
    if (Object.keys(fieldUpdates).length > 0) {
      await this.requests.setFieldValues(
        tx,
        requestId,
        req.formVersionId,
        fieldUpdates,
      );
    }

    if (activation.kind === "AUTO_FAIL") {
      await this.completeStep(tx, stepInstance.id, "FAILED");
      await this.closeRequest(tx, ctx, requestId, "UNSUCCESSFUL");
      return;
    }

    // AUTO_COMPLETE
    await this.completeStep(tx, stepInstance.id, "COMPLETED");
    await this.advanceFromStep(
      tx,
      ctx,
      requestId,
      graph,
      def,
      null,
      activation.nextStepKey,
    );
  }

  private async completeStep(
    tx: Tx,
    stepInstanceId: string,
    status: "COMPLETED" | "FAILED" | "CANCELLED" | "SKIPPED",
  ): Promise<void> {
    await this.steps.update(tx, stepInstanceId, {
      status,
      completedAt: new Date(),
    });
  }

  private async advanceFromStep(
    tx: Tx,
    ctx: ActorContext,
    requestId: string,
    graph: WorkflowGraph,
    def: StepDefinition,
    actionTaken: TakeActionInput["action"] | null,
    explicitNext: string | undefined,
  ): Promise<void> {
    let nextKey: string | null = explicitNext ?? null;
    if (!nextKey && def.next) {
      if ("default" in def.next) nextKey = def.next.default;
      else if (actionTaken && def.next.onAction[actionTaken]) {
        nextKey = def.next.onAction[actionTaken];
      } else if (def.next.onAction["__default__"]) {
        nextKey = def.next.onAction["__default__"];
      }
    }

    if (!nextKey) {
      // No next step → close successfully.
      await this.closeRequest(tx, ctx, requestId, "SUCCESSFUL");
      return;
    }

    await this.activateStep(tx, ctx, requestId, graph, nextKey);
  }

  private async closeRequest(
    tx: Tx,
    ctx: ActorContext,
    requestId: string,
    outcome: TerminalOutcome,
    options?: { notes?: string; outcomeCodeId?: string | null },
  ): Promise<void> {
    // PRD §10.2: outcome notes are required for any non-SUCCESSFUL outcome.
    // For internal close paths the engine supplies a default note when the
    // workflow completes UNSUCCESSFUL (e.g., REJECT step result, AUTO_FAIL).
    const notes =
      outcome === "SUCCESSFUL"
        ? (options?.notes ?? null)
        : options?.notes?.trim()
          ? options.notes
          : `Auto-closed with outcome ${outcome}`;
    await this.requests.update(tx, requestId, {
      status: "CLOSED",
      outcome,
      outcomeNotes: notes,
      outcomeCodeId: options?.outcomeCodeId ?? null,
      closedAt: new Date(),
      currentStepInstanceId: null,
    });
    await this.audit.append(tx, {
      ctx,
      requestId,
      action: "request.close",
      payload: { outcome, notes },
    });

    // Notify watchers that the request closed.
    await this.notifyWatchers(tx, requestId, {
      subject: "Request closed",
      body: `Outcome: ${outcome}`,
      payload: { outcome },
      templateKey: "request.closed",
    });
    await this.dispatchEventNotifications(tx, ctx, "request.closed", requestId);

    // Advance any parent SUB_WORKFLOW step waiting on this request.
    await this.advanceParentSubWorkflowSteps(tx, ctx, requestId, outcome);
  }

  private async advanceParentSubWorkflowSteps(
    tx: Tx,
    ctx: ActorContext,
    childRequestId: string,
    childOutcome: string,
  ): Promise<void> {
    const links = await tx.requestLink.findMany({
      where: {
        sourceRequestId: childRequestId,
        linkType: "sub-workflow",
      },
      select: { targetRequestId: true },
    });
    for (const link of links) {
      const parentSteps = await tx.stepInstance.findMany({
        where: { requestId: link.targetRequestId, status: "ACTIVE" },
      });
      for (const ps of parentSteps) {
        const outcomeJson = ps.outcomeJson as {
          childRequestId?: string;
          waitForOutcome?: boolean;
          fieldUpdates?: Record<string, unknown>;
        } | null;
        if (
          outcomeJson?.childRequestId !== childRequestId ||
          outcomeJson.waitForOutcome === false
        ) {
          continue;
        }

        // Apply any stashed field updates (e.g., child request id mapping).
        const parent = await this.requests.findById(tx, link.targetRequestId);
        if (
          parent &&
          outcomeJson.fieldUpdates &&
          Object.keys(outcomeJson.fieldUpdates).length > 0
        ) {
          await this.requests.setFieldValues(
            tx,
            parent.id,
            parent.formVersionId,
            outcomeJson.fieldUpdates,
          );
        }

        await this.completeStep(tx, ps.id, "COMPLETED");
        await this.audit.append(tx, {
          ctx,
          requestId: link.targetRequestId,
          stepInstanceId: ps.id,
          action: "step.sub_workflow_resumed",
          payload: { childRequestId, childOutcome },
        });

        // Look up the parent's workflow graph + step def to advance.
        const wfv = parent
          ? await this.workflows.findVersion(tx, parent.workflowVersionId)
          : null;
        if (parent && wfv) {
          const graph = wfv.graphJson as unknown as WorkflowGraph;
          const def = graph.steps.find((s) => s.key === ps.stepKey);
          if (def) {
            await this.advanceFromStep(
              tx,
              ctx,
              parent.id,
              graph,
              def,
              null,
              undefined,
            );
          }
        }
      }
    }
  }

  /**
   * Dispatches per-form notification bindings for an event (PRD §13).
   * Reads `FormNotificationBinding` rows where the form, event and isActive
   * match, resolves the recipient set per binding, and calls the
   * NotificationService — which substitutes the template variables.
   *
   * Events the engine emits today:
   *   request.submitted, request.held, request.resumed, request.closed,
   *   request.cancelled, step.activated, step.approved, step.rejected.
   */
  private async dispatchEventNotifications(
    tx: Tx,
    _ctx: ActorContext,
    event: string,
    requestId: string,
    stepInstanceId?: string | null,
  ): Promise<void> {
    const req = await tx.request.findUnique({
      where: { id: requestId },
      select: { formId: true, requesterId: true },
    });
    if (!req) return;

    const bindings = await tx.formNotificationBinding.findMany({
      where: { formId: req.formId, event, isActive: true },
      select: {
        emailTemplateKey: true,
        recipientKind: true,
        recipientRoleId: true,
      },
    });
    if (bindings.length === 0) return;

    for (const b of bindings) {
      const userIds = new Set<string>();

      switch (b.recipientKind) {
        case "REQUESTER": {
          if (req.requesterId) userIds.add(req.requesterId);
          break;
        }
        case "STEP_ASSIGNEES": {
          // Use the explicit step (if any) else the latest active step.
          const targetStepId =
            stepInstanceId ??
            (
              await tx.stepInstance.findFirst({
                where: { requestId, status: "ACTIVE" },
                orderBy: { activatedAt: "desc" },
                select: { id: true },
              })
            )?.id ??
            null;
          if (targetStepId) {
            const snap = await tx.assigneeSnapshot.findMany({
              where: { stepInstanceId: targetStepId },
              select: { userId: true },
            });
            for (const s of snap) userIds.add(s.userId);
          }
          break;
        }
        case "WATCHERS": {
          const watchers = await tx.watcher.findMany({
            where: { requestId },
            select: { userId: true },
          });
          for (const w of watchers) userIds.add(w.userId);
          break;
        }
        case "ROLE": {
          if (!b.recipientRoleId) break;
          const userRoles = await tx.userRole.findMany({
            where: { roleId: b.recipientRoleId },
            select: { userId: true },
          });
          for (const ur of userRoles) userIds.add(ur.userId);
          break;
        }
      }

      if (userIds.size === 0) continue;

      await this.notifications.sendToUsers(tx, {
        userIds: Array.from(userIds),
        formId: req.formId,
        requestId,
        stepInstanceId: stepInstanceId ?? null,
        subject: `(template) ${b.emailTemplateKey}`,
        body: `Triggered by event ${event}`,
        templateKey: b.emailTemplateKey,
      });
    }
  }

  /** Send notifications to all current watchers of a request. */
  private async notifyWatchers(
    tx: Tx,
    requestId: string,
    body: {
      subject: string;
      body: string;
      payload?: Record<string, unknown>;
      templateKey?: string;
    },
  ): Promise<void> {
    const watchers = await tx.watcher.findMany({
      where: { requestId },
      select: { userId: true },
    });
    if (watchers.length === 0) return;
    const req = await tx.request.findUnique({
      where: { id: requestId },
      select: { formId: true },
    });
    if (!req) return;
    await this.notifications.sendToUsers(tx, {
      userIds: watchers.map((w) => w.userId),
      formId: req.formId,
      requestId,
      subject: body.subject,
      body: body.body,
      payload: body.payload,
      templateKey: body.templateKey,
    });
  }
}

function findStep(graph: WorkflowGraph, key: string): StepDefinition {
  const def = graph.steps.find((s) => s.key === key);
  if (!def)
    throw new ConfigurationError(`Step not found in workflow graph: ${key}`);
  return def;
}
