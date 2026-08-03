import type { Prisma, StepInstance } from "@/generated/prisma";
import type { Tx } from "./types";

export interface IWorkflowStepInstanceRepository {
  create(
    tx: Tx,
    data: Prisma.StepInstanceUncheckedCreateInput,
  ): Promise<StepInstance>;
  findById(tx: Tx, id: string): Promise<StepInstance | null>;
  update(
    tx: Tx,
    id: string,
    data: Prisma.StepInstanceUncheckedUpdateInput,
  ): Promise<StepInstance>;
  listForRequest(tx: Tx, requestId: string): Promise<StepInstance[]>;
}
