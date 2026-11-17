import "server-only";
import type { NextRequest } from "next/server";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { IFileStorageService } from "@/core/services/file-storage.service.interface";
import { KnowledgeError, requireKnowledgeArticle } from "./access";

/**
 * Header the in-page viewer sends. Opening the file URL directly (address
 * bar, link, "save link as") has no way to set it, so the browser's own PDF
 * viewer, with its download and print buttons, never gets the file.
 */
export const KNOWLEDGE_VIEWER_HEADER = "x-knowledge-viewer";

/** Reads the PDF of the revision the request points at, after access checks. */
export async function loadKnowledgePdf(request: NextRequest, id: string) {
  const draft = request.nextUrl.searchParams.get("draft") === "1";
  const versionParam = request.nextUrl.searchParams.get("version");
  const version = versionParam ? Number(versionParam) : undefined;
  const access = await requireKnowledgeArticle(id, { draft, version });
  const { revision } = access;
  if (revision.sourceType !== "PDF" || !revision.filePath) {
    throw new KnowledgeError(404, "PDF_NOT_FOUND");
  }
  if (!process.env.GCS_BUCKET_NAME || !process.env.GCS_ATTACHMENTS_PREFIX) {
    throw new KnowledgeError(503, "PRIVATE_GCS_STORAGE_REQUIRED");
  }
  const storage = getContainer().get<IFileStorageService>(
    DI_TOKENS.IFileStorageService,
  );
  const buffer = await storage.readFile(revision.filePath, "binary");
  return { ...access, buffer };
}
