import "server-only";

import { prisma } from "@/infrastructure/database/prisma/client";
import { KnowledgeError } from "./access";

export async function requireKnowledgeFolder(folderId: string | null | undefined): Promise<void> {
  if (folderId == null) return;
  const folder = await prisma.knowledgeFolder.findUnique({
    where: { id: folderId },
    select: { id: true },
  });
  if (!folder) throw new KnowledgeError(404, "FOLDER_NOT_FOUND");
}
