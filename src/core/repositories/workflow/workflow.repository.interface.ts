import type { WorkflowDefinition, WorkflowVersion } from "@/generated/prisma";
import type { Tx } from "./types";

export interface IWorkflowDefinitionRepository {
  findById(tx: Tx, id: string): Promise<WorkflowDefinition | null>;
  findPublishedVersion(
    tx: Tx,
    definitionId: string,
  ): Promise<WorkflowVersion | null>;
  findVersion(tx: Tx, versionId: string): Promise<WorkflowVersion | null>;
}
