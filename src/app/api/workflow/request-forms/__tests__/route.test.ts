import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/features/server", () => ({ requireFeature: vi.fn() }));
vi.mock("@/lib/permissions/server", () => ({ requirePermission: vi.fn() }));
vi.mock("@/infrastructure/database/prisma/client", () => ({
  prisma: { form: { findMany: vi.fn() } },
}));

import { GET } from "../route";
import { prisma } from "@/infrastructure/database/prisma/client";
import { requirePermission } from "@/lib/permissions/server";
import { requireFeature } from "@/lib/features/server";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

const findMany = vi.mocked(prisma.form.findMany);
const permission = vi.mocked(requirePermission);
const feature = vi.mocked(requireFeature);

beforeEach(() => {
  vi.resetAllMocks();
});

describe("published sidebar form catalog", () => {
  it("queries only active published forms with submit permission", async () => {
    findMany.mockResolvedValue([
      { id: "a", name: "Asset Request", description: "Asset" },
      { id: "b", name: "Access Request", description: null },
    ] as never);

    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toEqual({
      forms: [
        { id: "a", name: "Asset Request", description: "Asset" },
        { id: "b", name: "Access Request", description: null },
      ],
    });
    expect(feature).toHaveBeenCalledWith(FEATURE_FLAGS.WORKFLOW_ENGINE);
    expect(permission).toHaveBeenCalledWith(PERMISSIONS.WORKFLOWS_REQUESTS_SUBMIT);
    expect(findMany).toHaveBeenCalledWith({
      where: { isActive: true, publishedVersionId: { not: null } },
      select: { id: true, name: true, description: true },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });
  });

  it("does not read forms when submit permission is denied", async () => {
    permission.mockRejectedValue(new Error("FORBIDDEN"));
    await expect(GET()).rejects.toThrow("FORBIDDEN");
    expect(findMany).not.toHaveBeenCalled();
  });
});
