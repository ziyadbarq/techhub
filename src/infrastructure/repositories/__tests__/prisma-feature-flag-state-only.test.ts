import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@/generated/prisma/server";
import { PrismaFeatureFlagRepository } from "../prisma-feature-flag.repository";

const now = new Date("2026-11-12T00:00:00.000Z");
const existing = {
  id: "feature-1",
  name: "ASSETS",
  displayName: "Asset Management",
  description: "Manage asset features",
  category: "LAYER_2" as const,
  isEnabled: false,
  isSystem: false,
  dependsOn: [] as string[],
  createdAt: now,
  updatedAt: now,
};

describe("Feature flag state-only changes", () => {
  it("updates isEnabled without writing name or any other metadata", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const findUnique = vi.fn().mockResolvedValue({ ...existing, isEnabled: true });
    const prisma = { featureFlag: { updateMany, findUnique } } as unknown as PrismaClient;
    const repository = new PrismaFeatureFlagRepository(prisma);

    const flag = await repository.setEnabled("feature-1", true);

    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "feature-1", isEnabled: false },
      data: { isEnabled: true },
    });
    expect(flag.isEnabled).toBe(true);
    expect(flag.name).toBe("ASSETS");
  });

  it("rejects stale concurrent toggles rather than silently overwriting", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });
    const findUnique = vi.fn().mockResolvedValue(existing);
    const prisma = { featureFlag: { updateMany, findUnique } } as unknown as PrismaClient;
    const repository = new PrismaFeatureFlagRepository(prisma);

    await expect(repository.setEnabled("feature-1", true)).rejects.toThrow(
      "Feature flag changed in another request",
    );
  });
});
