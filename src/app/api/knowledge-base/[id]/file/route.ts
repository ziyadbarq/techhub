import { NextResponse, type NextRequest } from "next/server";
import { knowledgeErrorResponse, KnowledgeError } from "@/lib/knowledge-base/access";
import { KNOWLEDGE_VIEWER_HEADER, loadKnowledgePdf } from "@/lib/knowledge-base/pdf-file";

export const dynamic = "force-dynamic";

/**
 * PDF bytes for the in-page, view-only reader. There is deliberately no
 * download route: the file is only ever shown inside the Knowledge Base.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (request.headers.get(KNOWLEDGE_VIEWER_HEADER) !== "1") {
      throw new KnowledgeError(403, "VIEW_IN_KNOWLEDGE_BASE_ONLY");
    }
    const { id } = await context.params;
    const { buffer } = await loadKnowledgePdf(request, id);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        // Not application/pdf: nothing should hand this to a PDF viewer.
        "Content-Type": "application/octet-stream",
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch (error) {
    return knowledgeErrorResponse(error);
  }
}
