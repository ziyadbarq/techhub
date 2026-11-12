import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { moveKnowledgeArticleSchema } from "@/lib/knowledge-base/schema";
import { requireKnowledgeFolder } from "@/lib/knowledge-base/folders";
import { KnowledgeError, knowledgeErrorResponse, requireKnowledgeAccess, requireClassification } from "@/lib/knowledge-base/access";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

// Moving an article is organizational metadata. Do not increment its content
// version or invalidate existing published revisions and acknowledgements.
export async function PATCH(request: NextRequest, context: Context) {
  try {
    const userId = await requireKnowledgeAccess(PERMISSIONS.KNOWLEDGE_BASE_UPDATE);
    if (Number(request.headers.get("content-length") ?? 0) > 4096) {
      throw new KnowledgeError(413, "MOVE_REQUEST_TOO_LARGE");
    }
    const { id } = await context.params;
    const { folderId, expectedVersion } = moveKnowledgeArticleSchema.parse(await request.json());
    const existing = await prisma.knowledgeArticle.findUnique({ where: { id } });
    if (!existing || existing.isArchived) throw new KnowledgeError(404, "ARTICLE_NOT_FOUND");
    await requireClassification(existing.classification);
    await requireKnowledgeFolder(folderId);
    await prisma.$transaction(async (tx) => {
      const result = await tx.knowledgeArticle.updateMany({
        where: { id, isArchived: false, version: expectedVersion, folderId: existing.folderId },
        data: { folderId },
      });
      if (result.count !== 1) throw new KnowledgeError(409, "ARTICLE_MOVE_CONFLICT");
      await tx.auditLog.create({
        data: { userId, action: "knowledge:move", entityType: "knowledge_article", entityId: id, changes: { fromFolderId: existing.folderId, toFolderId: folderId } },
      });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return knowledgeErrorResponse(error);
  }
}
