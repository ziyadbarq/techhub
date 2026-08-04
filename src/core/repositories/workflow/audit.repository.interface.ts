import type { ActorContext } from "@/core/domain/workflow";
import type { Tx } from "./types";

export interface AuditAppendInput {
  ctx: ActorContext;
  requestId?: string | null;
  stepInstanceId?: string | null;
  action: string;
  payload: Record<string, unknown>;
  referencesAuditEntryId?: string | null;
}

export interface IWorkflowAuditRepository {
  append(tx: Tx, input: AuditAppendInput): Promise<{ id: string }>;
  appendFieldHistory(
    tx: Tx,
    input: {
      requestId: string;
      formVersionId: string;
      values: Record<string, unknown>;
      computedValues?: Record<string, unknown>;
      auditEntryId: string;
    },
  ): Promise<void>;
  appendAssigneeSnapshot(
    tx: Tx,
    input: {
      stepInstanceId: string;
      userIds: string[];
      delegationChainsByUser?: Record<string, string[]>;
    },
  ): Promise<void>;
}
