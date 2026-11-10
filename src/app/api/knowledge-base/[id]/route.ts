import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/infrastructure/database/prisma/client";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requireKnowledgeAccess, requireClassification, requireKnowledgeArticle, knowledgeErrorResponse, KnowledgeError } from "@/lib/knowledge-base/access";
import { knowledgeActionSchema, editKnowledgeSchema, blocksToText, parseBlocks } from "@/lib/knowledge-base/schema";
import { editArticle, changeArticleStatus } from "@/lib/knowledge-base/revisions";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const draft = request.nextUrl.searchParams.get("draft") === "1";
    const { article, revision, userId, mayDraft } = await requireKnowledgeArticle(id, { draft });
    const [ack, history] = await Promise.all([
      article.publishedVersion ? prisma.knowledgeAcknowledgement.findUnique({
        where: {
          articleId_version_userId: {
            articleId: article.id, version: article.publishedVersion, userId,
          },
        },
        select: { acknowledgedAt: true },
      }) : Promise.resolve(null),
      mayDraft ? prisma.knowledgeRevision.findMany({
        where: { articleId: id },
        orderBy: { version: "desc" },
        select: { version: true, createdAt: true, editedById: true },
        take: 30,
      }) : Promise.resolve([]),
    ]);
    return NextResponse.json({
      id: article.id, title: revision.title, summary: revision.summary,
      category: revision.category, classification: revision.classification,
      sourceType: revision.sourceType, blocks: revision.sourceType === "EDITOR" ? revision.blocks : null,
      fileName: revision.sourceType === "PDF" ? revision.fileName : null,
      fileSize: revision.sourceType === "PDF" ? revision.fileSize : null,
      version: revision.version, latestVersion: article.version,
      publishedVersion: article.publishedVersion, updatedAt: article.updatedAt,
      requiresAcknowledgement: revision.requiresAcknowledgement,
      acknowledgedAt: ack?.acknowledgedAt ?? null, canEdit: mayDraft,
      revisions: history,
    });
  } catch (error) {
    return knowledgeErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const userId = await requireKnowledgeAccess(PERMISSIONS.KNOWLEDGE_BASE_UPDATE);
    const { id } = await context.params;
    const existing = await prisma.knowledgeArticle.findUnique({ where: { id } });
    if (!existing || existing.isArchived) throw new KnowledgeError(404, "ARTICLE_NOT_FOUND");
    const data = editKnowledgeSchema.parse(await request.json());
    await requireClassification(existing.classification);
    await requireClassification(data.classification);
    if (existing.sourceType === "EDITOR" && !data.blocks) {
      throw new KnowledgeError(400, "EDITOR_BLOCKS_REQUIRED");
    }
    if (existing.sourceType === "PDF" && data.blocks) {
      throw new KnowledgeError(400, "USE_PDF_UPLOAD_FOR_PDF_DOCUMENTS");
    }
    const blocks = data.blocks ? parseBlocks(data.blocks) : undefined;
    const article = await editArticle(id, data.expectedVersion, {
      title: data.title, summary: data.summary, category: data.category,
      classification: data.classification,
      requiresAcknowledgement: data.requiresAcknowledgement,
      ...(blocks ? {
        blocks: blocks as Prisma.InputJsonValue,
        plainText: blocksToText(blocks),
      } : {}),
    }, userId);
    return NextResponse.json({ id: article.id, version: article.version });
  } catch (error) {
    return knowledgeErrorResponse(error);
  }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const data = knowledgeActionSchema.parse(await request.json());
    const required = data.action === "publish"
      ? PERMISSIONS.KNOWLEDGE_BASE_PUBLISH
      : PERMISSIONS.KNOWLEDGE_BASE_ARCHIVE;
    const userId = await requireKnowledgeAccess(required);
    const article = await prisma.knowledgeArticle.findUnique({ where: { id } });
    if (!article) throw new KnowledgeError(404, "ARTICLE_NOT_FOUND");
    await requireClassification(article.classification);
    await changeArticleStatus(id, data.expectedVersion, data.action, userId);
    return NextResponse.json({ ok: true, action: data.action });
  } catch (error) {
    return knowledgeErrorResponse(error);
  }
}
