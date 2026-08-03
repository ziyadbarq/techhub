/**
 * Prisma Workflow Audit Repository
 *
 * Stateless repository for AuditEntry, FieldHistoryEntry, and
 * AssigneeSnapshot writes. The workflow engine calls these from inside
 * the same transaction that mutates Request / StepInstance state, so
 * audit trails are atomic with state transitions.
 *
 * Single-tenant: no organizationId is persisted. Actor identity comes
 * from `ctx.userId` (human) or `ctx.system` (engine-triggered).
 */

import { injectable } from "inversify";

import { Prisma } from "@/generated/prisma/server";
import type {
  AuditAppendInput,
  IWorkflowAuditRepository,
  Tx,
} from "@/core/repositories/workflow";

@injectable()
export class PrismaWorkflowAuditRepository implements IWorkflowAuditRepository {
  async append(tx: Tx, input: AuditAppendInput): Promise<{ id: string }> {
    const entry = await tx.auditEntry.create({
      data: {
        requestId: input.requestId ?? null,
        stepInstanceId: input.stepInstanceId ?? null,
        actorUserId: input.ctx.userId ?? null,
        actorSystem: input.ctx.userId ? null : (input.ctx.system ?? "system"),
        action: input.action,
        payloadJson: input.payload as Prisma.InputJsonValue,
        referencesAuditEntryId: input.referencesAuditEntryId ?? null,
      },
      select: { id: true },
    });
    return { id: entry.id };
  }

  async appendFieldHistory(
    tx: Tx,
    input: {
      requestId: string;
      formVersionId: string;
      values: Record<string, unknown>;
      computedValues?: Record<string, unknown>;
      auditEntryId: string;
    },
  ): Promise<void> {
    const rows: Prisma.FieldHistoryEntryCreateManyInput[] = Object.entries(
      input.values,
    ).map(([fieldKey, value]) => ({
      requestId: input.requestId,
      formVersionId: input.formVersionId,
      fieldKey,
      valueJson: { value } as Prisma.InputJsonValue,
      computedValueJson:
        input.computedValues && fieldKey in input.computedValues
          ? ({ value: input.computedValues[fieldKey] } as Prisma.InputJsonValue)
          : Prisma.DbNull,
      auditEntryId: input.auditEntryId,
    }));
    if (rows.length === 0) return;
    await tx.fieldHistoryEntry.createMany({ data: rows });
  }

  async appendAssigneeSnapshot(
    tx: Tx,
    input: {
      stepInstanceId: string;
      userIds: string[];
      delegationChainsByUser?: Record<string, string[]>;
    },
  ): Promise<void> {
    if (input.userIds.length === 0) return;
    const rows: Prisma.AssigneeSnapshotCreateManyInput[] = input.userIds.map(
      (userId) => ({
        stepInstanceId: input.stepInstanceId,
        userId,
        viaDelegationChainJson: input.delegationChainsByUser?.[userId]
          ? ({
              chain: input.delegationChainsByUser[userId],
            } as Prisma.InputJsonValue)
          : Prisma.DbNull,
      }),
    );
    await tx.assigneeSnapshot.createMany({ data: rows, skipDuplicates: true });
  }
}
