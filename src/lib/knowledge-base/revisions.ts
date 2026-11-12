import "server-only";
import { Prisma, type KnowledgeArticle } from "@/generated/prisma/client";
import { prisma } from "@/infrastructure/database/prisma/client";
import { KnowledgeError } from "./access";
import { requireKnowledgeFolder } from "./folders";

function revisionSnapshot(article: KnowledgeArticle, editedById: string) {
  return {
    articleId: article.id,
    version: article.version,
    title: article.title,
    summary: article.summary,
    category: article.category,
    classification: article.classification,
    sourceType: article.sourceType,
    blocks: article.blocks == null ? Prisma.DbNull : article.blocks as Prisma.InputJsonValue,
    plainText: article.plainText,
    filePath: article.filePath,
    fileName: article.fileName,
    fileSize: article.fileSize,
    requiresAcknowledgement: article.requiresAcknowledgement,
    editedById,
  };
}

export async function createArticle(
  data: {
    title: string; summary: string; category: string; classification: string;
    requiresAcknowledgement: boolean; sourceType: "EDITOR" | "PDF";
    blocks?: Prisma.InputJsonValue; plainText?: string;
    filePath?: string; fileName?: string; fileSize?: number;
    folderId?: string | null;
  },
  userId: string,
) {
  await requireKnowledgeFolder(data.folderId);
  return prisma.$transaction(async (tx) => {
    const article = await tx.knowledgeArticle.create({
      data: {
        ...data,
        blocks: data.blocks ?? Prisma.DbNull,
        createdById: userId,
        updatedById: userId,
        version: 1,
      },
    });
    await tx.knowledgeRevision.create({ data: revisionSnapshot(article, userId) });
    await tx.auditLog.create({
      data: {
        userId, action: "knowledge:create", entityType: "knowledge_article",
        entityId: article.id, changes: { version: 1, sourceType: article.sourceType },
      },
    });
    return article;
  });
}

export async function editArticle(
  id: string,
  expectedVersion: number,
  data: {
    title: string; summary: string; category: string; classification: string;
    requiresAcknowledgement: boolean; blocks?: Prisma.InputJsonValue; plainText?: string;
    filePath?: string; fileName?: string; fileSize?: number;
    folderId?: string | null;
  },
  userId: string,
) {
  await requireKnowledgeFolder(data.folderId);
  return prisma.$transaction(async (tx) => {
    // Optimistic locking: two people cannot silently overwrite one another.
    const changed = await tx.knowledgeArticle.updateMany({
      where: { id, version: expectedVersion, isArchived: false },
      data: {
        ...data,
        version: { increment: 1 },
        updatedById: userId,
      },
    });
    if (changed.count !== 1) throw new KnowledgeError(409, "VERSION_CONFLICT");
    const article = await tx.knowledgeArticle.findUniqueOrThrow({ where: { id } });
    await tx.knowledgeRevision.create({ data: revisionSnapshot(article, userId) });
    await tx.auditLog.create({
      data: {
        userId, action: "knowledge:edit", entityType: "knowledge_article",
        entityId: id, changes: { fromVersion: expectedVersion, toVersion: article.version },
      },
    });
    return article;
  });
}

export async function changeArticleStatus(
  id: string, expectedVersion: number, action: "publish" | "archive", userId: string,
) {
  return prisma.$transaction(async (tx) => {
    const article = await tx.knowledgeArticle.findUnique({ where: { id } });
    if (!article || article.isArchived || article.version !== expectedVersion) {
      throw new KnowledgeError(409, "VERSION_CONFLICT_OR_ARCHIVED");
    }
    if (action === "publish" && article.publishedVersion === article.version) {
      throw new KnowledgeError(409, "REVISION_ALREADY_PUBLISHED");
    }
    if (action === "publish" && article.sourceType === "EDITOR") {
      const blocks = article.blocks as unknown;
      if (!Array.isArray(blocks) || !blocks.some((b) => Boolean(b && typeof b === "object" && "text" in b && b.text))) {
        throw new KnowledgeError(400, "ARTICLE_CONTENT_REQUIRED");
      }
    }
    if (action === "publish" && article.sourceType === "PDF" && !article.filePath) {
      throw new KnowledgeError(400, "PDF_REQUIRED");
    }
    const changed = await tx.knowledgeArticle.updateMany({
      where: { id, version: expectedVersion, isArchived: false },
      data: action === "publish"
        ? { publishedVersion: article.version, publishedAt: new Date(), updatedById: userId }
        : { isArchived: true, publishedVersion: null, updatedById: userId },
    });
    if (changed.count !== 1) throw new KnowledgeError(409, "VERSION_CONFLICT");
    await tx.auditLog.create({
      data: {
        userId, action: action === "publish" ? "knowledge:publish" : "knowledge:archive",
        entityType: "knowledge_article", entityId: id,
        changes: { version: expectedVersion, publishedVersion: article.publishedVersion },
      },
    });
    return article;
  });
}
