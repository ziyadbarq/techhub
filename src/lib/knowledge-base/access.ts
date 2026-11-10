import "server-only";
import { getCurrentUserId } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions/server";
import { isFeatureEnabled } from "@/lib/features/server";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { PERMISSIONS, type PermissionKey } from "@/core/domain/value-objects/permission-key";
import { prisma } from "@/infrastructure/database/prisma/client";

export class KnowledgeError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "KnowledgeError";
  }
}

export async function requireKnowledgeAccess(permission: PermissionKey): Promise<string> {
  if (!(await isFeatureEnabled(FEATURE_FLAGS.KNOWLEDGE_BASE))) {
    throw new KnowledgeError(404, "KNOWLEDGE_BASE_DISABLED");
  }
  const userId = await getCurrentUserId();
  if (!userId) throw new KnowledgeError(401, "NOT_AUTHENTICATED");
  if (!(await hasPermission(permission))) throw new KnowledgeError(403, "FORBIDDEN");
  return userId;
}

export async function canReadRestricted(): Promise<boolean> {
  return hasPermission(PERMISSIONS.KNOWLEDGE_BASE_RESTRICTED_VIEW);
}

export async function requireClassification(classification: string) {
  if (classification === "RESTRICTED" && !(await canReadRestricted())) {
    throw new KnowledgeError(403, "RESTRICTED_DOCUMENT_ACCESS_REQUIRED");
  }
}

type ArticleAccess = {
  id: string;
  createdById: string;
  classification: string;
  publishedVersion: number | null;
  isArchived: boolean;
};

export async function canViewDraft(article: ArticleAccess, userId: string): Promise<boolean> {
  return article.createdById === userId ||
    await hasPermission(PERMISSIONS.KNOWLEDGE_BASE_UPDATE) ||
    await hasPermission(PERMISSIONS.KNOWLEDGE_BASE_PUBLISH);
}

export async function requireKnowledgeArticle(
  id: string,
  options: { draft?: boolean; version?: number } = {},
) {
  const userId = await requireKnowledgeAccess(PERMISSIONS.KNOWLEDGE_BASE_VIEW);
  const article = await prisma.knowledgeArticle.findUnique({ where: { id } });
  if (!article || article.isArchived) throw new KnowledgeError(404, "ARTICLE_NOT_FOUND");
  const mayDraft = await canViewDraft(article, userId);
  if ((options.draft || options.version) && !mayDraft) {
    throw new KnowledgeError(403, "REVISION_ACCESS_DENIED");
  }
  if (!options.draft && !options.version && !article.publishedVersion) {
    if (!mayDraft) throw new KnowledgeError(404, "ARTICLE_NOT_FOUND");
  }

  if (options.version && (!Number.isSafeInteger(options.version) || options.version < 1 || options.version > article.version)) {
    throw new KnowledgeError(400, "INVALID_REVISION");
  }
  const displayVersion = options.version ??
    (!options.draft && article.publishedVersion
      ? article.publishedVersion
      : article.version);

  const revision = await prisma.knowledgeRevision.findUnique({
    where: { articleId_version: { articleId: article.id, version: displayVersion } },
  });
  if (!revision) throw new KnowledgeError(404, "REVISION_NOT_FOUND");

  // Classification can change between a published revision and an unpublished draft.
  await requireClassification(revision.classification);
  return { article, revision, userId, mayDraft };
}

export function knowledgeErrorResponse(error: unknown): Response {
  if (error instanceof KnowledgeError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof SyntaxError || (error && typeof error === "object" && "issues" in error)) {
    return Response.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  console.error("[KnowledgeBase]", error);
  return Response.json({ error: "KNOWLEDGE_REQUEST_FAILED" }, { status: 500 });
}
