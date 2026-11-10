import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ getCurrentUserId: vi.fn() }));
vi.mock("@/lib/permissions/server", () => ({ hasPermission: vi.fn() }));
vi.mock("@/lib/features/server", () => ({ isFeatureEnabled: vi.fn() }));
vi.mock("@/infrastructure/database/prisma/client", () => ({
  prisma: {
    knowledgeArticle: { findUnique: vi.fn() },
    knowledgeRevision: { findUnique: vi.fn() },
  },
}));

import { getCurrentUserId } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions/server";
import { isFeatureEnabled } from "@/lib/features/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requireKnowledgeAccess, requireKnowledgeArticle } from "../access";

const user = vi.mocked(getCurrentUserId);
const permission = vi.mocked(hasPermission);
const enabled = vi.mocked(isFeatureEnabled);
const article = vi.mocked(prisma.knowledgeArticle.findUnique);
const revision = vi.mocked(prisma.knowledgeRevision.findUnique);

beforeEach(() => {
  vi.resetAllMocks();
  user.mockResolvedValue("u1");
  enabled.mockResolvedValue(true);
  permission.mockImplementation(async (name) => name === PERMISSIONS.KNOWLEDGE_BASE_VIEW);
});

describe("Knowledge Base authorization", () => {
  it("is disabled unless the feature flag is explicitly enabled", async () => {
    enabled.mockResolvedValue(false);
    await expect(requireKnowledgeAccess(PERMISSIONS.KNOWLEDGE_BASE_VIEW))
      .rejects.toMatchObject({ status: 404 });
  });

  it("rejects anonymous requests", async () => {
    user.mockResolvedValue(null);
    await expect(requireKnowledgeAccess(PERMISSIONS.KNOWLEDGE_BASE_VIEW))
      .rejects.toMatchObject({ status: 401 });
  });

  it("does not reveal unpublished documents to other viewers", async () => {
    article.mockResolvedValue({
      id: "doc", createdById: "other", classification: "INTERNAL",
      publishedVersion: null, version: 1, isArchived: false,
    } as never);
    await expect(requireKnowledgeArticle("doc")).rejects.toMatchObject({ status: 404 });
    expect(revision).not.toHaveBeenCalled();
  });

  it("enforces restricted access against the actual published revision", async () => {
    article.mockResolvedValue({
      id: "doc", createdById: "other", classification: "INTERNAL",
      publishedVersion: 1, version: 2, isArchived: false,
    } as never);
    revision.mockResolvedValue({
      articleId: "doc", version: 1, classification: "RESTRICTED",
    } as never);
    await expect(requireKnowledgeArticle("doc")).rejects.toMatchObject({ status: 403 });
  });

  it("never serves arbitrary historical versions to a normal viewer", async () => {
    article.mockResolvedValue({
      id: "doc", createdById: "other", classification: "INTERNAL",
      publishedVersion: 2, version: 3, isArchived: false,
    } as never);
    await expect(requireKnowledgeArticle("doc", { version: 1 }))
      .rejects.toMatchObject({ status: 403 });
    expect(revision).not.toHaveBeenCalled();
  });

  it("allows a properly authorized published revision", async () => {
    article.mockResolvedValue({
      id: "doc", createdById: "other", classification: "INTERNAL",
      publishedVersion: 2, version: 3, isArchived: false,
    } as never);
    revision.mockResolvedValue({
      articleId: "doc", version: 2, classification: "INTERNAL",
    } as never);
    const result = await requireKnowledgeArticle("doc");
    expect(result.revision.version).toBe(2);
  });
});
