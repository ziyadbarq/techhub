/**
 * Prisma Workflow Form Repository
 *
 * Stateless repository for Form / FormVersion lookups used by the
 * workflow engine. All operations run against the caller-supplied `Tx`
 * (Prisma transaction client), so the engine controls transaction
 * boundaries and atomicity guarantees.
 */

import { injectable } from "inversify";

import type { Form, FormVersion } from "@/generated/prisma";
import type { IWorkflowFormRepository, Tx } from "@/core/repositories/workflow";

@injectable()
export class PrismaWorkflowFormRepository implements IWorkflowFormRepository {
  async findById(tx: Tx, id: string): Promise<Form | null> {
    return tx.form.findUnique({ where: { id } });
  }

  async findPublishedVersion(
    tx: Tx,
    formId: string,
  ): Promise<FormVersion | null> {
    const form = await tx.form.findUnique({
      where: { id: formId },
      select: { publishedVersionId: true },
    });
    if (!form?.publishedVersionId) return null;
    return tx.formVersion.findUnique({
      where: { id: form.publishedVersionId },
    });
  }
}
