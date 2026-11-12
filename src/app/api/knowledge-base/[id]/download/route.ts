import { NextResponse, type NextRequest } from "next/server";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { IFileStorageService } from "@/core/services/file-storage.service.interface";
import { requireKnowledgeArticle, knowledgeErrorResponse, KnowledgeError } from "@/lib/knowledge-base/access";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const draft = request.nextUrl.searchParams.get("draft") === "1";
    const versionParam = request.nextUrl.searchParams.get("version");
    const version = versionParam ? Number(versionParam) : undefined;
    const { revision } = await requireKnowledgeArticle(id, { draft, version });
    if (revision.sourceType !== "PDF" || !revision.filePath) {
      throw new KnowledgeError(404, "PDF_NOT_FOUND");
    }
    if (!process.env.GCS_BUCKET_NAME || !process.env.GCS_ATTACHMENTS_PREFIX) {
      throw new KnowledgeError(503, "PRIVATE_GCS_STORAGE_REQUIRED");
    }
    const storage = getContainer().get<IFileStorageService>(DI_TOKENS.IFileStorageService);
    const buffer = await storage.readFile(revision.filePath, "binary");
    const displayName = (revision.fileName || "knowledge-policy.pdf")
      .replace(/[^\x20-\x7e]/g, "_")
      .replace(/[\\"]/g, "_");
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${displayName}"; filename*=UTF-8''${encodeURIComponent(revision.fileName || "knowledge-policy.pdf")}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch (error) {
    return knowledgeErrorResponse(error);
  }
}
