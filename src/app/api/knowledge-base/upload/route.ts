import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { prisma } from "@/infrastructure/database/prisma/client";
import { KnowledgeError, requireKnowledgeAccess, requireClassification, knowledgeErrorResponse } from "@/lib/knowledge-base/access";
import { pdfMetadataSchema } from "@/lib/knowledge-base/schema";
import { createArticle, editArticle } from "@/lib/knowledge-base/revisions";
import { getKnowledgePdfStorage, type KnowledgePdfStorage } from "@/lib/knowledge-base/pdf-storage";

export const dynamic = "force-dynamic";
const MAX_PDF_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  let orphanPath: string | undefined;
  let storage: KnowledgePdfStorage | undefined;
  try {
    // Fails closed (503) when there is no private place for the file.
    const pdfStorage = getKnowledgePdfStorage();
    const bodyLength = Number(request.headers.get("content-length") ?? 0);
    if (bodyLength > MAX_PDF_BYTES + 40_000) {
      throw new KnowledgeError(413, "PDF_TOO_LARGE");
    }
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size < 8 || file.size > MAX_PDF_BYTES) {
      throw new KnowledgeError(400, "INVALID_PDF_SIZE");
    }
    if (!/\.pdf$/i.test(file.name) || file.name.length > 200) {
      throw new KnowledgeError(400, "ONLY_PDF_FILES_ALLOWED");
    }
    if (file.type && file.type !== "application/pdf" && file.type !== "application/octet-stream") {
      throw new KnowledgeError(400, "ONLY_PDF_FILES_ALLOWED");
    }
    const metadata = pdfMetadataSchema.parse(JSON.parse(String(form.get("metadata") ?? "{}")));
    const id = String(form.get("articleId") ?? "").trim();
    const permission = id ? PERMISSIONS.KNOWLEDGE_BASE_UPDATE : PERMISSIONS.KNOWLEDGE_BASE_CREATE;
    const userId = await requireKnowledgeAccess(permission);
    await requireClassification(metadata.classification);

    const existing = id
      ? await prisma.knowledgeArticle.findUnique({ where: { id } })
      : null;
    if (id) {
      if (!existing || existing.isArchived || existing.sourceType !== "PDF") {
        throw new KnowledgeError(404, "PDF_ARTICLE_NOT_FOUND");
      }
      await requireClassification(existing.classification);
      if (metadata.expectedVersion !== existing.version) {
        throw new KnowledgeError(409, "VERSION_CONFLICT");
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
      throw new KnowledgeError(400, "INVALID_PDF_SIGNATURE");
    }

    storage = pdfStorage;
    const storedPath = await storage.upload(buffer, file.name);
    orphanPath = storedPath;
    const data = {
      title: metadata.title,
      summary: metadata.summary,
      category: metadata.category,
      classification: metadata.classification,
      requiresAcknowledgement: metadata.requiresAcknowledgement,
      ...(metadata.folderId !== undefined ? { folderId: metadata.folderId } : {}),
      filePath: storedPath, fileName: file.name, fileSize: file.size,
    };
    const article = existing
      ? await editArticle(id, metadata.expectedVersion!, data, userId)
      : await createArticle({ ...data, sourceType: "PDF" }, userId);
    orphanPath = undefined;
    return NextResponse.json({ id: article.id, version: article.version }, { status: existing ? 200 : 201 });
  } catch (error) {
    if (orphanPath && storage) {
      try { await storage.remove(orphanPath); }
      catch (cleanupError) { logger.error({ module: "KnowledgeBase", function: "upload" }, "Orphan PDF cleanup failed", cleanupError); }
    }
    return knowledgeErrorResponse(error);
  }
}
