/**
 * Prisma Workflow Definition Repository
 *
 * Stateless repository for WorkflowDefinition / WorkflowVersion lookups
 * used by the workflow engine. All operations run against the caller-
 * supplied `Tx` (Prisma transaction client).
 */

import { injectable } from "inversify";

import type { WorkflowDefinition, WorkflowVersion } from "@/generated/prisma";
import type {
  IWorkflowDefinitionRepository,
  Tx,
} from "@/core/repositories/workflow";

@injectable()
export class PrismaWorkflowDefinitionRepository implements IWorkflowDefinitionRepository {
  async findById(tx: Tx, id: string): Promise<WorkflowDefinition | null> {
    return tx.workflowDefinition.findUnique({ where: { id } });
  }

  async findPublishedVersion(
    tx: Tx,
    definitionId: string,
  ): Promise<WorkflowVersion | null> {
    const def = await tx.workflowDefinition.findUnique({
      where: { id: definitionId },
      select: { publishedVersionId: true },
    });
    if (!def?.publishedVersionId) return null;
    return tx.workflowVersion.findUnique({
      where: { id: def.publishedVersionId },
    });
  }

  async findVersion(
    tx: Tx,
    versionId: string,
  ): Promise<WorkflowVersion | null> {
    return tx.workflowVersion.findUnique({ where: { id: versionId } });
  }
}
