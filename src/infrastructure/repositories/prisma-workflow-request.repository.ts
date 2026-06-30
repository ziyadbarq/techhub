/**
 * Prisma Workflow Request Repository
 *
 * Stateless repository for Request rows and their associated
 * RequestFieldValue / RequestLink join tables. Operates entirely through
 * the caller-supplied `Tx` so the engine controls transaction boundaries.
 */

import { injectable } from "inversify";

import type { Prisma, Request } from "@/generated/prisma";
import type {
  IWorkflowRequestRepository,
  Tx,
} from "@/core/repositories/workflow";

@injectable()
export class PrismaWorkflowRequestRepository implements IWorkflowRequestRepository {
  async create(
    tx: Tx,
    data: Prisma.RequestUncheckedCreateInput,
  ): Promise<Request> {
    return tx.request.create({ data });
  }

  async findById(tx: Tx, id: string): Promise<Request | null> {
    return tx.request.findUnique({ where: { id } });
  }

  async update(
    tx: Tx,
    id: string,
    data: Prisma.RequestUncheckedUpdateInput,
  ): Promise<Request> {
    return tx.request.update({ where: { id }, data });
  }

  async setFieldValues(
    tx: Tx,
    requestId: string,
    formVersionId: string,
    values: Record<string, unknown>,
  ): Promise<void> {
    for (const [fieldKey, value] of Object.entries(values)) {
      await tx.requestFieldValue.upsert({
        where: { requestId_fieldKey: { requestId, fieldKey } },
        update: { valueJson: { value } as object, formVersionId },
        create: {
          requestId,
          formVersionId,
          fieldKey,
          valueJson: { value } as object,
        },
      });
    }
  }

  async getFieldValues(
    tx: Tx,
    requestId: string,
  ): Promise<Record<string, unknown>> {
    const rows = await tx.requestFieldValue.findMany({
      where: { requestId },
      select: { fieldKey: true, valueJson: true },
    });
    const out: Record<string, unknown> = {};
    for (const row of rows) {
      const v = row.valueJson as { value?: unknown } | null;
      out[row.fieldKey] =
        v && typeof v === "object" && "value" in v ? v.value : v;
    }
    return out;
  }

  async findInboundLinks(
    tx: Tx,
    targetRequestId: string,
  ): Promise<Array<{ sourceRequestId: string }>> {
    const rows = await tx.requestLink.findMany({
      where: { targetRequestId },
      select: { sourceRequestId: true },
    });
    return rows;
  }
}
