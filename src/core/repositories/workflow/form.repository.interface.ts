import type { Form, FormVersion } from "@/generated/prisma";
import type { Tx } from "./types";

export interface IWorkflowFormRepository {
  findById(tx: Tx, id: string): Promise<Form | null>;
  findPublishedVersion(tx: Tx, formId: string): Promise<FormVersion | null>;
}
