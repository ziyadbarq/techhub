import { describe, expect, it, vi } from "vitest";
import { seedRBAC } from "../seed-rbac";
import { SYSTEM_ROLES } from "../seed-rbac-roles";
import type { PrismaClient } from "@/generated/prisma/server";

describe("RBAC seeding of editable roles", () => {
  it("unlocks all preset roles except admin and preserves existing custom permissions", async () => {
    const prisma = {
      permission: {
        upsert: vi.fn(async ({ where }: { where: { name: string } }) => ({
          id: where.name,
          name: where.name,
        })),
      },
      role: {
        findUnique: vi.fn(async ({ where }: { where: { name: string } }) => ({
          id: where.name,
        })),
        upsert: vi.fn(async ({ where }: { where: { name: string } }) => ({
          id: where.name,
          name: where.name,
          displayName: where.name,
        })),
      },
      rolePermission: {
        deleteMany: vi.fn(async () => ({ count: 1 })),
        createMany: vi.fn(async () => ({ count: 1 })),
      },
    };

    await seedRBAC(prisma as unknown as PrismaClient);
    expect(prisma.role.upsert).toHaveBeenCalledTimes(Object.keys(SYSTEM_ROLES).length);

    for (const call of prisma.role.upsert.mock.calls) {
      const args = call[0] as unknown as {
        where: { name: string };
        update: { isSystem: boolean };
        create: { isSystem: boolean };
      };
      const isAdmin = args.where.name === "system-administrator";
      expect(args.update.isSystem).toBe(isAdmin);
      expect(args.create.isSystem).toBe(isAdmin);
    }
    expect(prisma.rolePermission.deleteMany).toHaveBeenCalledTimes(1);
    expect(prisma.rolePermission.deleteMany).toHaveBeenCalledWith({
      where: { roleId: "system-administrator" },
    });
    expect(prisma.rolePermission.createMany).toHaveBeenCalledTimes(1);
  });

  it("initializes permissions once when a regular role does not yet exist", async () => {
    const prisma = {
      permission: {
        upsert: vi.fn(async ({ where }: { where: { name: string } }) => ({
          id: where.name, name: where.name,
        })),
      },
      role: {
        findUnique: vi.fn(async ({ where }: { where: { name: string } }) =>
          where.name === "viewer" ? null : { id: where.name },
        ),
        upsert: vi.fn(async ({ where }: { where: { name: string } }) => ({
          id: where.name, name: where.name, displayName: where.name,
        })),
      },
      rolePermission: {
        deleteMany: vi.fn(async () => ({ count: 1 })),
        createMany: vi.fn(async () => ({ count: 1 })),
      },
    };

    await seedRBAC(prisma as unknown as PrismaClient);
    expect(prisma.rolePermission.deleteMany).toHaveBeenCalledTimes(1);
    expect(prisma.rolePermission.createMany).toHaveBeenCalledTimes(2);
  });
});
