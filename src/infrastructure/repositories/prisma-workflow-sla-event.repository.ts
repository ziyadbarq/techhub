/**
 * Prisma Workflow SLA Event Repository
 *
 * Stateless repository for SLAEvent append/list. The workflow engine
 * writes START / PAUSE / RESUME / BREACH events as a step's timer state
 * changes, in the same transaction as the StepInstance update.
 */

import { injectable } from "inversify";

import { Prisma } from "@/generated/prisma/server";
import type {
  IWorkflowSLAEventRepository,
  SLAEventTypeName,
  Tx,
} from "@/core/repositories/workflow";

@injectable()
export class PrismaWorkflowSLAEventRepository implements IWorkflowSLAEventRepository {
  async append(
    tx: Tx,
    input: {
      stepInstanceId: string;
      eventType: SLAEventTypeName;
      payload?: Record<string, unknown>;
      occurredAt?: Date;
    },
  ): Promise<void> {
    await tx.sLAEvent.create({
      data: {
        stepInstanceId: input.stepInstanceId,
        eventType: input.eventType,
        payloadJson: input.payload
          ? (input.payload as Prisma.InputJsonValue)
          : Prisma.DbNull,
        occurredAt: input.occurredAt ?? new Date(),
      },
    });
  }

  async list(
    tx: Tx,
    stepInstanceId: string,
  ): Promise<Array<{ eventType: SLAEventTypeName; occurredAt: Date }>> {
    const rows = await tx.sLAEvent.findMany({
      where: { stepInstanceId },
      orderBy: { occurredAt: "asc" },
      select: { eventType: true, occurredAt: true },
    });
    return rows.map((r) => ({
      eventType: r.eventType,
      occurredAt: r.occurredAt,
    }));
  }
}
