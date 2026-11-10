import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/infrastructure/database/prisma/client";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { hasPermission } from "@/lib/permissions/server";
import { requireKnowledgeAccess, canReadRestricted, requireClassification, knowledgeErrorResponse } from "@/lib/knowledge-base/access";
import { createKnowledgeSchema, blocksToText } from "@/lib/knowledge-base/schema";
import { createArticle } from "@/lib/knowledge-base/revisions";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireKnowledgeAccess(PERMISSIONS.KNOWLEDGE_BASE_VIEW);
    const mayEdit = await hasPermission(PERMISSIONS.KNOWLEDGE_BASE_UPDATE);
    const restricted = await canReadRestricted();
    const manage = request.nextUrl.searchParams.get("mode") === "manage" && mayEdit;
    const q = (request.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase().slice(0, 100);

    const items = await prisma.knowledgeArticle.findMany({
      where: {
        isArchived: false,
        ...(manage ? {} : { publishedVersion: { not: null } }),
      },
      orderBy: { updatedAt: "desc" },
      take: 250,
      select: {
        id: true, title: true, summary: true, category: true,
        classification: true, sourceType: true, version: true, publishedVersion: true,
        updatedAt: true, requiresAcknowledgement: true,
      },
    });

    const published = items.filter((item) => item.publishedVersion != null);
    const revisions = await prisma.knowledgeRevision.findMany({
      where: { OR: published.map((article) => ({
        articleId: article.id, version: article.publishedVersion!,
      })) },
      select: {
        articleId: true, version: true, title: true, summary: true, plainText: true,
        category: true, classification: true, sourceType: true, requiresAcknowledgement: true,
      },
    });
    const publishedById = new Map(revisions.map((r) => [r.articleId, r]));

    const filtered = items.flatMap((item) => {
      const active = manage ? item : publishedById.get(item.id);
      if (!active) return [];
      if (active.classification === "RESTRICTED" && !restricted) return [];
      const searchText = manage
        ? item.title + " " + (item.summary ?? "")
        : active.title + " " + (active.summary ?? "") + " " + (active.plainText ?? "");
      if (q && !searchText.toLowerCase().includes(q)) return [];
      return [{
        id: item.id,
        title: active.title,
        summary: active.summary,
        category: active.category,
        classification: active.classification,
        sourceType: active.sourceType,
        version: manage ? item.version : item.publishedVersion,
        publishedVersion: item.publishedVersion,
        requiresAcknowledgement: active.requiresAcknowledgement,
        updatedAt: item.updatedAt,
        hasDraft: item.publishedVersion !== item.version,
      }];
    });
    return NextResponse.json({ items: filtered, canEdit: mayEdit });
  } catch (error) {
    return knowledgeErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireKnowledgeAccess(PERMISSIONS.KNOWLEDGE_BASE_CREATE);
    if (Number(request.headers.get("content-length") ?? 0) > 160_000) {
      return NextResponse.json({ error: "DOCUMENT_TOO_LARGE" }, { status: 413 });
    }
    const data = createKnowledgeSchema.parse(await request.json());
    await requireClassification(data.classification);
    const plainText = blocksToText(data.blocks);
    if (!plainText.trim()) {
      return NextResponse.json({ error: "ARTICLE_CONTENT_REQUIRED" }, { status: 400 });
    }
    const article = await createArticle({
      ...data,
      blocks: data.blocks as Prisma.InputJsonValue,
      plainText,
    }, userId);
    return NextResponse.json({ id: article.id, version: article.version }, { status: 201 });
  } catch (error) {
    return knowledgeErrorResponse(error);
  }
}
