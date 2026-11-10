import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { IFileStorageService } from "@/core/services/file-storage.service.interface";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { prisma } from "@/infrastructure/database/prisma/client";
import { KnowledgeError, requireKnowledgeAccess, requireClassification, knowledgeErrorResponse } from "@/lib/knowledge-base/access";
import { pdfMetadataSchema } from "@/lib/knowledge-base/schema";
import { createArticle, editArticle } from "@/lib/knowledge-base/revisions";

export const dynamic = "force-dynamic";
const MAX_PDF_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  let orphanPath: string | undefined;
  let storage: IFileStorageService | undefined;
  try {
    if (!process.env.GCS_BUCKET_NAME || !process.env.GCS_ATTACHMENTS_PREFIX) {
      // Deliberate fail-closed: local file storage writes to public/uploads.
      // Confidential policies must NEVER be stored on a public path.
      throw new KnowledgeError(503, "PRIVATE_GCS_STORAGE_REQUIRED");
    }
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

    let existing: Awaited<ReturnType<typeof prisma.knowledgeArticle.findUnique>> = null;
    if (id) {
      existing = await prisma.knowledgeArticle.findUnique({ where: { id } });
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

    storage = getContainer().get<IFileStorageService>(DI_TOKENS.IFileStorageService);
    const storedPath = await storage.uploadFile(buffer, file.name, "application/pdf");
    orphanPath = storedPath;
    const data = {
      title: metadata.title,
      summary: metadata.summary,
      category: metadata.category,
      classification: metadata.classification,
      requiresAcknowledgement: metadata.requiresAcknowledgement,
      filePath: storedPath, fileName: file.name, fileSize: file.size,
    };
    const article = existing
      ? await editArticle(id, metadata.expectedVersion!, data, userId)
      : await createArticle({ ...data, sourceType: "PDF" }, userId);
    orphanPath = undefined;
    return NextResponse.json({ id: article.id, version: article.version }, { status: existing ? 200 : 201 });
  } catch (error) {
    if (orphanPath && storage) {
      try { await storage.deleteFile(orphanPath); }
      catch (cleanupError) { console.error("[KnowledgeBase] Orphan PDF cleanup failed", cleanupError); }
    }
    return knowledgeErrorResponse(error);
  }
}
