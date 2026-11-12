import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { editKnowledgeFolderSchema } from "@/lib/knowledge-base/schema";
import { wouldCreateFolderCycle } from "@/lib/knowledge-base/folders-tree";
import { KnowledgeError, knowledgeErrorResponse, requireKnowledgeAccess } from "@/lib/knowledge-base/access";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const userId = await requireKnowledgeAccess(PERMISSIONS.KNOWLEDGE_BASE_UPDATE);
    if (Number(request.headers.get("content-length") ?? 0) > 4096) {
      throw new KnowledgeError(413, "FOLDER_REQUEST_TOO_LARGE");
    }
    const { id } = await context.params;
    const data = editKnowledgeFolderSchema.parse(await request.json());
    const folder = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(88776111)`;
      const current = await tx.knowledgeFolder.findUnique({ where: { id } });
      if (!current) throw new KnowledgeError(404, "FOLDER_NOT_FOUND");
      if (data.parentId !== undefined) {
        const tree = await tx.knowledgeFolder.findMany({ select: { id: true, parentId: true } });
        if (data.parentId !== null && !tree.some((node) => node.id === data.parentId)) {
          throw new KnowledgeError(404, "PARENT_FOLDER_NOT_FOUND");
        }
        if (wouldCreateFolderCycle(tree, id, data.parentId)) {
          throw new KnowledgeError(409, "FOLDER_CYCLE_NOT_ALLOWED");
        }
      }
      const newParentId = data.parentId === undefined ? current.parentId : data.parentId;
      const newName = data.name ?? current.name;
      const duplicate = await tx.knowledgeFolder.findFirst({
        where: { parentId: newParentId, name: newName, id: { not: id } }, select: { id: true },
      });
      if (duplicate) throw new KnowledgeError(409, "FOLDER_NAME_EXISTS");
      const updated = await tx.knowledgeFolder.update({
        where: { id }, data: { name: newName, parentId: newParentId, updatedById: userId },
      });
      await tx.auditLog.create({
        data: { userId, action: "knowledge:folder:update", entityType: "knowledge_folder", entityId: id, changes: { name: newName, parentId: newParentId } },
      });
      return updated;
    });
    return NextResponse.json({ folder });
  } catch (error) {
    return knowledgeErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const userId = await requireKnowledgeAccess(PERMISSIONS.KNOWLEDGE_BASE_UPDATE);
    const { id } = await context.params;
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(88776111)`;
      const current = await tx.knowledgeFolder.findUnique({ where: { id } });
      if (!current) throw new KnowledgeError(404, "FOLDER_NOT_FOUND");
      const [children, articles] = await Promise.all([
        tx.knowledgeFolder.count({ where: { parentId: id } }),
        tx.knowledgeArticle.count({ where: { folderId: id } }),
      ]);
      if (children || articles) throw new KnowledgeError(409, "FOLDER_NOT_EMPTY");
      await tx.knowledgeFolder.delete({ where: { id } });
      await tx.auditLog.create({
        data: { userId, action: "knowledge:folder:delete", entityType: "knowledge_folder", entityId: id, changes: { name: current.name, parentId: current.parentId } },
      });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return knowledgeErrorResponse(error);
  }
}
