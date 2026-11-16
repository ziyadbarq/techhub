import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { requireKnowledgeArticle, KnowledgeError, knowledgeErrorResponse } from "@/lib/knowledge-base/access";

export const dynamic = "force-dynamic";

// Acknowledgements always target the current published revision, not a draft.
// The body must carry `{ "agree": true }`: the reader ticks "I have read and
// agree to this policy" before the button sends it, and an empty or
// accidental POST must never record consent.
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { article, revision, userId } = await requireKnowledgeArticle(id);
    if (!article.publishedVersion || revision.version !== article.publishedVersion) {
      throw new KnowledgeError(404, "PUBLISHED_REVISION_NOT_FOUND");
    }
    if (!revision.requiresAcknowledgement) {
      throw new KnowledgeError(400, "ACKNOWLEDGEMENT_NOT_REQUIRED");
    }
    const body = (await request.json().catch(() => null)) as { agree?: unknown } | null;
    if (body?.agree !== true) throw new KnowledgeError(400, "AGREEMENT_CONFIRMATION_REQUIRED");
    const ack = await prisma.knowledgeAcknowledgement.upsert({
      where: {
        articleId_version_userId: { articleId: id, version: revision.version, userId },
      },
      create: { articleId: id, version: revision.version, userId },
      update: {},
      select: { acknowledgedAt: true },
    });
    return NextResponse.json({ ok: true, version: revision.version, acknowledgedAt: ack.acknowledgedAt });
  } catch (error) {
    return knowledgeErrorResponse(error);
  }
}
