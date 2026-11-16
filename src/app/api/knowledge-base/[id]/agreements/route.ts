import { NextResponse, type NextRequest } from "next/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { hasAny } from "@/lib/permissions/server";
import { requireKnowledgeArticle, KnowledgeError, knowledgeErrorResponse } from "@/lib/knowledge-base/access";
import { getAgreementReport } from "@/lib/knowledge-base/agreements";
import { agreementReportToCsv } from "@/lib/knowledge-base/agreement-report";

export const dynamic = "force-dynamic";

/**
 * GET /api/knowledge-base/:id/agreements[?format=csv]
 *
 * Who has agreed to the current published version of a policy. For document
 * owners only (Knowledge Base update or publish); the caller must also be
 * able to open the document itself, so a RESTRICTED report needs restricted
 * access.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { article, revision } = await requireKnowledgeArticle(id);
    if (!(await hasAny([PERMISSIONS.KNOWLEDGE_BASE_UPDATE, PERMISSIONS.KNOWLEDGE_BASE_PUBLISH]))) {
      throw new KnowledgeError(403, "FORBIDDEN");
    }
    if (!article.publishedVersion || revision.version !== article.publishedVersion) {
      throw new KnowledgeError(404, "PUBLISHED_REVISION_NOT_FOUND");
    }
    if (!revision.requiresAcknowledgement) {
      throw new KnowledgeError(400, "ACKNOWLEDGEMENT_NOT_REQUIRED");
    }

    const report = await getAgreementReport(id, revision.version, revision.classification);

    if (request.nextUrl.searchParams.get("format") === "csv") {
      const slug = revision.title.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "policy";
      return new Response(agreementReportToCsv(report), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${slug}-v${revision.version}-agreements.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }
    return NextResponse.json(report, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return knowledgeErrorResponse(error);
  }
}
