import type {
  ActorContext,
  SubmitInput,
  TakeActionInput,
} from "@/core/domain/workflow";

/** Cancellable outcomes (set when status → CANCELLED). */
export type CancelOutcome =
  | "WITHDRAWN"
  | "REJECTED"
  | "SUPERSEDED"
  | "ABANDONED"
  | "EXPIRED";

/** Closable outcomes (set when status → CLOSED). */
export type CloseOutcome =
  | "SUCCESSFUL"
  | "SUCCESSFUL_WITH_ISSUES"
  | "UNSUCCESSFUL";

/** Any terminal outcome — the union of CancelOutcome and CloseOutcome. */
export type TerminalOutcome = CancelOutcome | CloseOutcome;

export interface IWorkflowEngine {
  submit(
    input: SubmitInput,
    ctx: ActorContext,
  ): Promise<{ requestId: string; referenceNumber: string }>;
  resubmit(
    requestId: string,
    fieldUpdates: Record<string, unknown>,
    ctx: ActorContext,
  ): Promise<void>;
  takeAction(input: TakeActionInput, ctx: ActorContext): Promise<void>;
  placeOnHold(
    requestId: string,
    holdReasonId: string,
    ctx: ActorContext,
  ): Promise<void>;
  resume(requestId: string, ctx: ActorContext): Promise<void>;
  cancel(
    requestId: string,
    outcome: CancelOutcome,
    note: string | undefined,
    ctx: ActorContext,
    outcomeCodeId?: string | null,
  ): Promise<void>;
  reject(
    stepInstanceId: string,
    reason: string,
    ctx: ActorContext,
  ): Promise<void>;
  reassign(
    stepInstanceId: string,
    toUserId: string,
    ctx: ActorContext,
  ): Promise<void>;
  forceAdvance(stepInstanceId: string, ctx: ActorContext): Promise<void>;
  overrideOutcome(
    requestId: string,
    outcome: TerminalOutcome,
    ctx: ActorContext,
    notes?: string,
    outcomeCodeId?: string | null,
  ): Promise<void>;
}
