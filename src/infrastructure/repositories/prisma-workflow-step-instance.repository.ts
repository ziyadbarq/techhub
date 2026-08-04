/**
 * Prisma Workflow StepInstance Repository
 *
 * Stateless repository for StepInstance rows. Operates entirely through
 * the caller-supplied `Tx` so the engine controls transaction boundaries.
 */

import { injectable } from "inversify";

import type { Prisma, StepInstance } from "@/generated/prisma";
import type {
  IWorkflowStepInstanceRepository,
  Tx,
} from "@/core/repositories/workflow";

@injectable()
export class PrismaWorkflowStepInstanceRepository implements IWorkflowStepInstanceRepository {
  async create(
    tx: Tx,
    data: Prisma.StepInstanceUncheckedCreateInput,
  ): Promise<StepInstance> {
    return tx.stepInstance.create({ data });
  }

  async findById(tx: Tx, id: string): Promise<StepInstance | null> {
    return tx.stepInstance.findUnique({ where: { id } });
  }

  async update(
    tx: Tx,
    id: string,
    data: Prisma.StepInstanceUncheckedUpdateInput,
  ): Promise<StepInstance> {
    return tx.stepInstance.update({ where: { id }, data });
  }

  async listForRequest(tx: Tx, requestId: string): Promise<StepInstance[]> {
    return tx.stepInstance.findMany({
      where: { requestId },
      orderBy: { createdAt: "asc" },
    });
  }
}
