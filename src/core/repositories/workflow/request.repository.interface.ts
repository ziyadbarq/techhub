import type { Prisma, Request } from "@/generated/prisma";
import type { Tx } from "./types";

export interface IWorkflowRequestRepository {
  create(tx: Tx, data: Prisma.RequestUncheckedCreateInput): Promise<Request>;
  findById(tx: Tx, id: string): Promise<Request | null>;
  update(
    tx: Tx,
    id: string,
    data: Prisma.RequestUncheckedUpdateInput,
  ): Promise<Request>;
  setFieldValues(
    tx: Tx,
    requestId: string,
    formVersionId: string,
    values: Record<string, unknown>,
  ): Promise<void>;
  getFieldValues(tx: Tx, requestId: string): Promise<Record<string, unknown>>;
  findInboundLinks(
    tx: Tx,
    targetRequestId: string,
  ): Promise<Array<{ sourceRequestId: string }>>;
}
