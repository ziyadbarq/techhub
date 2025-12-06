/**
 * PrismaUserRoleRepository - Unit Tests
 *
 * Tests for the PrismaUserRoleRepository including:
 * - Find by ID
 * - Find by user ID
 * - Find by role ID
 * - Find by user ID and role ID
 * - Get user permissions (aggregated from roles)
 * - Check if user has role
 * - Check if user has permission
 * - Create user role assignment
 * - Delete user role assignment
 * - Delete by user ID and role ID
 * - Delete by user ID
 * - Update expiration
 * - Data transformation (toDomain)
 * - Expiration logic
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { PrismaClient } from "@/generated/prisma/server";
import type {
  UserRole as PrismaUserRole,
  Role as PrismaRole,
  Permission as PrismaPermission,
  RolePermission as PrismaRolePermission,
} from "@/generated/prisma";
import { PrismaUserRoleRepository } from "../prisma-user-role.repository";
import { UserRole } from "@/core/domain/entities/user-role.entity";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

/**
 * Mock PrismaClient
 */
function createMockPrismaClient(): PrismaClient {
  return {
    userRole: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
      findFirst: vi.fn(),
    },
  } as unknown as PrismaClient;
}

// Mock ID generator for tests
const mockIdGenerator: IIdGenerator = {
  generateId: vi.fn(() => "test-cuid-clx7abc123"),
};

describe("PrismaUserRoleRepository", () => {
  let repository: PrismaUserRoleRepository;
  let mockPrisma: PrismaClient;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    repository = new PrismaUserRoleRepository(mockPrisma);
  });

  describe("findById", () => {
    it("should find user role by ID", async () => {
      // Arrange
      const mockUserRole: PrismaUserRole = {
        id: "ur-1",
        userId: "user-1",
        roleId: "role-1",
        expiresAt: null,
        createdAt: new Date(),
        createdBy: "admin-1",
      };

      vi.mocked(mockPrisma.userRole.findUnique).mockResolvedValue(mockUserRole);

      // Act
      const result = await repository.findById("ur-1");

      // Assert
      expect(mockPrisma.userRole.findUnique).toHaveBeenCalledWith({
        where: { id: "ur-1" },
      });

      expect(result).not.toBeNull();
      expect(result?.id).toBe("ur-1");
      expect(result?.userId).toBe("user-1");
      expect(result?.roleId).toBe("role-1");
    });

    it("should return null when user role not found", async () => {
      // Arrange
      vi.mocked(mockPrisma.userRole.findUnique).mockResolvedValue(null);

      // Act
      const result = await repository.findById("non-existent");

      // Assert
      expect(result).toBeNull();
    });

    it("should handle database errors", async () => {
      // Arrange
      const error = new Error("Database error");
      vi.mocked(mockPrisma.userRole.findUnique).mockRejectedValue(error);

      // Act & Assert
      await expect(repository.findById("ur-1")).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("findByUserId", () => {
    it("should find all roles for a user", async () => {
      // Arrange
      const mockUserRoles: PrismaUserRole[] = [
        {
          id: "ur-1",
          userId: "user-1",
          roleId: "role-1",
          expiresAt: null,
          createdAt: new Date("2025-01-01"),
          createdBy: "admin-1",
        },
        {
          id: "ur-2",
          userId: "user-1",
          roleId: "role-2",
          expiresAt: null,
          createdAt: new Date("2025-01-15"),
          createdBy: "admin-1",
        },
      ];

      vi.mocked(mockPrisma.userRole.findMany).mockResolvedValue(mockUserRoles);

      // Act
      const result = await repository.findByUserId("user-1");

      // Assert
      expect(mockPrisma.userRole.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        orderBy: { createdAt: "desc" },
      });

      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe("user-1");
      expect(result[1].userId).toBe("user-1");
    });

    it("should return empty array when user has no roles", async () => {
      // Arrange
      vi.mocked(mockPrisma.userRole.findMany).mockResolvedValue([]);

      // Act
      const result = await repository.findByUserId("user-1");

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("findByRoleId", () => {
    it("should find all users with a role", async () => {
      // Arrange
      const mockUserRoles: PrismaUserRole[] = [
        {
          id: "ur-1",
          userId: "user-1",
          roleId: "role-1",
          expiresAt: null,
          createdAt: new Date(),
          createdBy: null,
        },
        {
          id: "ur-2",
          userId: "user-2",
          roleId: "role-1",
          expiresAt: null,
          createdAt: new Date(),
          createdBy: null,
        },
      ];

      vi.mocked(mockPrisma.userRole.findMany).mockResolvedValue(mockUserRoles);

      // Act
      const result = await repository.findByRoleId("role-1");

      // Assert
      expect(mockPrisma.userRole.findMany).toHaveBeenCalledWith({
        where: { roleId: "role-1" },
        orderBy: { createdAt: "desc" },
      });

      expect(result).toHaveLength(2);
      expect(result[0].roleId).toBe("role-1");
      expect(result[1].roleId).toBe("role-1");
    });
  });

  describe("findByUserIdAndRoleId", () => {
    it("should find specific user-role assignment", async () => {
      // Arrange
      const mockUserRole: PrismaUserRole = {
        id: "ur-1",
        userId: "user-1",
        roleId: "role-1",
        expiresAt: null,
        createdAt: new Date(),
        createdBy: "admin-1",
      };

      vi.mocked(mockPrisma.userRole.findUnique).mockResolvedValue(mockUserRole);

      // Act
      const result = await repository.findByUserIdAndRoleId("user-1", "role-1");

      // Assert
      expect(mockPrisma.userRole.findUnique).toHaveBeenCalledWith({
        where: {
          userId_roleId: { userId: "user-1", roleId: "role-1" },
        },
      });

      expect(result).not.toBeNull();
      expect(result?.userId).toBe("user-1");
      expect(result?.roleId).toBe("role-1");
    });

    it("should return null when assignment not found", async () => {
      // Arrange
      vi.mocked(mockPrisma.userRole.findUnique).mockResolvedValue(null);

      // Act
      const result = await repository.findByUserIdAndRoleId("user-1", "role-1");

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("getUserPermissions", () => {
    it("should get all permissions from active roles", async () => {
      // Arrange
      const now = new Date();
      const mockUserRoles = [
        {
          id: "ur-1",
          userId: "user-1",
          roleId: "role-1",
          expiresAt: null,
          createdAt: now,
          createdBy: null,
          role: {
            id: "role-1",
            name: "editor",
            displayName: "Editor",
            description: null,
            isSystem: false,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            createdBy: null,
            parentId: null,
            permissions: [
              {
                id: "rp-1",
                roleId: "role-1",
                permissionId: "perm-1",
                createdAt: now,
                permission: {
                  id: "perm-1",
                  name: "tasks:create",
                  displayName: "Create Task",
                  description: null,
                  resource: "tasks",
                  action: "create",
                  isSystem: false,
                  isActive: true,
                  createdAt: now,
                  updatedAt: now,
                } as PrismaPermission,
              } as PrismaRolePermission,
              {
                id: "rp-2",
                roleId: "role-1",
                permissionId: "perm-2",
                createdAt: now,
                permission: {
                  id: "perm-2",
                  name: "tasks:update",
                  displayName: "Update Task",
                  description: null,
                  resource: "tasks",
                  action: "update",
                  isSystem: false,
                  isActive: true,
                  createdAt: now,
                  updatedAt: now,
                } as PrismaPermission,
              } as PrismaRolePermission,
            ],
          } as PrismaRole,
        },
      ];

      vi.mocked(mockPrisma.userRole.findMany).mockResolvedValue(
        mockUserRoles as unknown as PrismaUserRole[],
      );

      // Act
      const result = await repository.getUserPermissions("user-1");

      // Assert
      expect(mockPrisma.userRole.findMany).toHaveBeenCalledWith({
        where: {
          userId: "user-1",
          OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
          role: {
            isActive: true,
          },
        },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
                where: {
                  permission: {
                    isActive: true,
                  },
                },
              },
            },
          },
        },
      });

      expect(result).toContain("tasks:create");
      expect(result).toContain("tasks:update");
      expect(result).toHaveLength(2);
    });

    it("should exclude expired roles", async () => {
      // Arrange
      const now = new Date();
      const expiredDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const mockUserRoles = [
        {
          id: "ur-1",
          userId: "user-1",
          roleId: "role-1",
          expiresAt: expiredDate,
          createdAt: now,
          createdBy: null,
          role: {
            id: "role-1",
            name: "editor",
            displayName: "Editor",
            description: null,
            isSystem: false,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            createdBy: null,
            parentId: null,
            permissions: [],
          } as PrismaRole,
        },
      ];

      vi.mocked(mockPrisma.userRole.findMany).mockResolvedValue(
        mockUserRoles as unknown as PrismaUserRole[],
      );

      // Act
      await repository.getUserPermissions("user-1");

      // Assert
      expect(mockPrisma.userRole.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
          }),
        }),
      );
    });

    it("should deduplicate permissions from multiple roles", async () => {
      // Arrange
      const now = new Date();
      const mockUserRoles = [
        {
          id: "ur-1",
          userId: "user-1",
          roleId: "role-1",
          expiresAt: null,
          createdAt: now,
          createdBy: null,
          role: {
            id: "role-1",
            name: "editor",
            displayName: "Editor",
            description: null,
            isSystem: false,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            createdBy: null,
            parentId: null,
            permissions: [
              {
                id: "rp-1",
                roleId: "role-1",
                permissionId: "perm-1",
                createdAt: now,
                permission: {
                  id: "perm-1",
                  name: "tasks:create",
                  displayName: "Create Task",
                  description: null,
                  resource: "tasks",
                  action: "create",
                  isSystem: false,
                  isActive: true,
                  createdAt: now,
                  updatedAt: now,
                } as PrismaPermission,
              } as PrismaRolePermission,
            ],
          } as PrismaRole,
        },
        {
          id: "ur-2",
          userId: "user-1",
          roleId: "role-2",
          expiresAt: null,
          createdAt: now,
          createdBy: null,
          role: {
            id: "role-2",
            name: "admin",
            displayName: "Admin",
            description: null,
            isSystem: false,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            createdBy: null,
            parentId: null,
            permissions: [
              {
                id: "rp-2",
                roleId: "role-2",
                permissionId: "perm-1",
                createdAt: now,
                permission: {
                  id: "perm-1",
                  name: "tasks:create",
                  displayName: "Create Task",
                  description: null,
                  resource: "tasks",
                  action: "create",
                  isSystem: false,
                  isActive: true,
                  createdAt: now,
                  updatedAt: now,
                } as PrismaPermission,
              } as PrismaRolePermission,
            ],
          } as PrismaRole,
        },
      ];

      vi.mocked(mockPrisma.userRole.findMany).mockResolvedValue(
        mockUserRoles as unknown as PrismaUserRole[],
      );

      // Act
      const result = await repository.getUserPermissions("user-1");

      // Assert
      // Should have only one "tasks:create" even though it appears in both roles
      expect(result).toHaveLength(1);
      expect(result[0]).toBe("tasks:create");
    });

    it("should return empty array when user has no permissions", async () => {
      // Arrange
      vi.mocked(mockPrisma.userRole.findMany).mockResolvedValue([]);

      // Act
      const result = await repository.getUserPermissions("user-1");

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("hasRole", () => {
    it("should return true when user has active role", async () => {
      // Arrange
      vi.mocked(mockPrisma.userRole.count).mockResolvedValue(1);

      // Act
      const result = await repository.hasRole("user-1", "role-1");

      // Assert
      expect(mockPrisma.userRole.count).toHaveBeenCalledWith({
        where: {
          userId: "user-1",
          roleId: "role-1",
          OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
          role: {
            isActive: true,
          },
        },
      });

      expect(result).toBe(true);
    });

    it("should return false when user does not have role", async () => {
      // Arrange
      vi.mocked(mockPrisma.userRole.count).mockResolvedValue(0);

      // Act
      const result = await repository.hasRole("user-1", "role-1");

      // Assert
      expect(result).toBe(false);
    });

    it("should check for non-expired roles only", async () => {
      // Arrange
      vi.mocked(mockPrisma.userRole.count).mockResolvedValue(0);

      // Act
      await repository.hasRole("user-1", "role-1");

      // Assert
      expect(mockPrisma.userRole.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
          }),
        }),
      );
    });
  });

  describe("hasPermission", () => {
    it("should return true when user has permission", async () => {
      // Arrange
      vi.mocked(mockPrisma.userRole.count).mockResolvedValue(1);

      // Act
      const result = await repository.hasPermission(
        "user-1",
        "tasks:create" as PermissionKey,
      );

      // Assert
      expect(mockPrisma.userRole.count).toHaveBeenCalledWith({
        where: {
          userId: "user-1",
          OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
          role: {
            isActive: true,
            permissions: {
              some: {
                permission: {
                  name: "tasks:create",
                  isActive: true,
                },
              },
            },
          },
        },
      });

      expect(result).toBe(true);
    });

    it("should return false when user does not have permission", async () => {
      // Arrange
      vi.mocked(mockPrisma.userRole.count).mockResolvedValue(0);

      // Act
      const result = await repository.hasPermission(
        "user-1",
        "tasks:delete" as PermissionKey,
      );

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("create", () => {
    it("should create a new user role assignment", async () => {
      // Arrange
      const userRole = UserRole.create(
        {
          userId: "user-1",
          roleId: "role-1",
          createdBy: "admin-1",
        },
        mockIdGenerator,
      );

      const mockUserRole: PrismaUserRole = {
        id: userRole.id,
        userId: userRole.userId,
        roleId: userRole.roleId,
        expiresAt: null,
        createdAt: userRole.createdAt,
        createdBy: userRole.createdBy ?? null,
      };

      vi.mocked(mockPrisma.userRole.create).mockResolvedValue(mockUserRole);

      // Act
      const result = await repository.create(userRole);

      // Assert
      expect(mockPrisma.userRole.create).toHaveBeenCalledWith({
        data: {
          id: userRole.id,
          userId: userRole.userId,
          roleId: userRole.roleId,
          expiresAt: undefined,
          createdAt: userRole.createdAt,
          createdBy: userRole.createdBy,
        },
      });

      expect(result.userId).toBe("user-1");
      expect(result.roleId).toBe("role-1");
    });

    it("should create user role with expiration", async () => {
      // Arrange
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const userRole = UserRole.create(
        {
          userId: "user-1",
          roleId: "role-1",
          expiresAt,
          createdBy: "admin-1",
        },
        mockIdGenerator,
      );

      const mockUserRole: PrismaUserRole = {
        id: userRole.id,
        userId: userRole.userId,
        roleId: userRole.roleId,
        expiresAt,
        createdAt: userRole.createdAt,
        createdBy: userRole.createdBy ?? null,
      };

      vi.mocked(mockPrisma.userRole.create).mockResolvedValue(mockUserRole);

      // Act
      const result = await repository.create(userRole);

      // Assert
      expect(result.expiresAt).toEqual(expiresAt);
    });

    it("should handle duplicate assignment errors", async () => {
      // Arrange
      const userRole = UserRole.create(
        {
          userId: "user-1",
          roleId: "role-1",
          createdBy: "admin-1",
        },
        mockIdGenerator,
      );

      const error = new Error("Unique constraint violation");
      vi.mocked(mockPrisma.userRole.create).mockRejectedValue(error);

      // Act & Assert
      await expect(repository.create(userRole)).rejects.toThrow(
        "Unique constraint violation",
      );
    });
  });

  describe("delete", () => {
    it("should delete a user role assignment", async () => {
      // Arrange
      const mockUserRole: PrismaUserRole = {
        id: "ur-1",
        userId: "user-1",
        roleId: "role-1",
        expiresAt: null,
        createdAt: new Date(),
        createdBy: null,
      };

      vi.mocked(mockPrisma.userRole.delete).mockResolvedValue(mockUserRole);

      // Act
      await repository.delete("ur-1");

      // Assert
      expect(mockPrisma.userRole.delete).toHaveBeenCalledWith({
        where: { id: "ur-1" },
      });
    });

    it("should handle delete errors", async () => {
      // Arrange
      const error = new Error("Record not found");
      vi.mocked(mockPrisma.userRole.delete).mockRejectedValue(error);

      // Act & Assert
      await expect(repository.delete("ur-1")).rejects.toThrow(
        "Record not found",
      );
    });
  });

  describe("deleteByUserIdAndRoleId", () => {
    it("should delete by user ID and role ID", async () => {
      // Arrange
      const mockUserRole: PrismaUserRole = {
        id: "ur-1",
        userId: "user-1",
        roleId: "role-1",
        expiresAt: null,
        createdAt: new Date(),
        createdBy: null,
      };

      vi.mocked(mockPrisma.userRole.delete).mockResolvedValue(mockUserRole);

      // Act
      await repository.deleteByUserIdAndRoleId("user-1", "role-1");

      // Assert
      expect(mockPrisma.userRole.delete).toHaveBeenCalledWith({
        where: {
          userId_roleId: { userId: "user-1", roleId: "role-1" },
        },
      });
    });
  });

  describe("deleteByUserId", () => {
    it("should delete all roles for a user", async () => {
      // Arrange
      vi.mocked(mockPrisma.userRole.deleteMany).mockResolvedValue({ count: 3 });

      // Act
      await repository.deleteByUserId("user-1");

      // Assert
      expect(mockPrisma.userRole.deleteMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
      });
    });

    it("should succeed even if no roles to delete", async () => {
      // Arrange
      vi.mocked(mockPrisma.userRole.deleteMany).mockResolvedValue({ count: 0 });

      // Act & Assert
      await expect(
        repository.deleteByUserId("user-1"),
      ).resolves.toBeUndefined();
    });
  });

  describe("updateExpiration", () => {
    it("should update expiration date", async () => {
      // Arrange
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const mockUserRole: PrismaUserRole = {
        id: "ur-1",
        userId: "user-1",
        roleId: "role-1",
        expiresAt,
        createdAt: new Date(),
        createdBy: null,
      };

      vi.mocked(mockPrisma.userRole.update).mockResolvedValue(mockUserRole);

      // Act
      const result = await repository.updateExpiration("ur-1", expiresAt);

      // Assert
      expect(mockPrisma.userRole.update).toHaveBeenCalledWith({
        where: { id: "ur-1" },
        data: { expiresAt },
      });

      expect(result.expiresAt).toEqual(expiresAt);
    });

    it("should remove expiration when not provided", async () => {
      // Arrange
      const mockUserRole: PrismaUserRole = {
        id: "ur-1",
        userId: "user-1",
        roleId: "role-1",
        expiresAt: null,
        createdAt: new Date(),
        createdBy: null,
      };

      vi.mocked(mockPrisma.userRole.update).mockResolvedValue(mockUserRole);

      // Act
      const result = await repository.updateExpiration("ur-1", undefined);

      // Assert
      expect(mockPrisma.userRole.update).toHaveBeenCalledWith({
        where: { id: "ur-1" },
        data: { expiresAt: undefined },
      });

      expect(result.expiresAt).toBeUndefined();
    });
  });

  describe("toDomain transformation", () => {
    it("should transform Prisma model with all fields to domain entity", async () => {
      // Arrange
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const mockUserRole: PrismaUserRole = {
        id: "ur-1",
        userId: "user-1",
        roleId: "role-1",
        expiresAt,
        createdAt: new Date("2025-01-01"),
        createdBy: "admin-1",
      };

      vi.mocked(mockPrisma.userRole.findUnique).mockResolvedValue(mockUserRole);

      // Act
      const result = await repository.findById("ur-1");

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(mockUserRole.id);
      expect(result?.userId).toBe(mockUserRole.userId);
      expect(result?.roleId).toBe(mockUserRole.roleId);
      expect(result?.expiresAt).toEqual(mockUserRole.expiresAt);
      expect(result?.createdAt).toEqual(mockUserRole.createdAt);
      expect(result?.createdBy).toBe(mockUserRole.createdBy);
    });

    it("should transform Prisma model with null fields to undefined", async () => {
      // Arrange
      const mockUserRole: PrismaUserRole = {
        id: "ur-1",
        userId: "user-1",
        roleId: "role-1",
        expiresAt: null,
        createdAt: new Date(),
        createdBy: null,
      };

      vi.mocked(mockPrisma.userRole.findUnique).mockResolvedValue(mockUserRole);

      // Act
      const result = await repository.findById("ur-1");

      // Assert
      expect(result?.expiresAt).toBeUndefined();
      expect(result?.createdBy).toBeUndefined();
    });

    it("should maintain entity business logic methods", async () => {
      // Arrange
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const mockUserRole: PrismaUserRole = {
        id: "ur-1",
        userId: "user-1",
        roleId: "role-1",
        expiresAt,
        createdAt: new Date(),
        createdBy: null,
      };

      vi.mocked(mockPrisma.userRole.findUnique).mockResolvedValue(mockUserRole);

      // Act
      const result = await repository.findById("ur-1");

      // Assert
      expect(result).not.toBeNull();
      expect(result?.isActive()).toBe(true);
      expect(result?.isExpired()).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle user with no roles", async () => {
      // Arrange
      vi.mocked(mockPrisma.userRole.findMany).mockResolvedValue([]);

      // Act
      const result = await repository.findByUserId("user-1");

      // Assert
      expect(result).toEqual([]);
    });

    it("should handle role with no users", async () => {
      // Arrange
      vi.mocked(mockPrisma.userRole.findMany).mockResolvedValue([]);

      // Act
      const result = await repository.findByRoleId("role-1");

      // Assert
      expect(result).toEqual([]);
    });

    it("should handle expired role assignment correctly", async () => {
      // Arrange
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const mockUserRole: PrismaUserRole = {
        id: "ur-1",
        userId: "user-1",
        roleId: "role-1",
        expiresAt: expiredDate,
        createdAt: new Date(),
        createdBy: null,
      };

      vi.mocked(mockPrisma.userRole.findUnique).mockResolvedValue(mockUserRole);

      // Act
      const result = await repository.findById("ur-1");

      // Assert
      expect(result).not.toBeNull();
      expect(result?.isExpired()).toBe(true);
      expect(result?.isActive()).toBe(false);
    });

    it("should handle role without expiration", async () => {
      // Arrange
      const mockUserRole: PrismaUserRole = {
        id: "ur-1",
        userId: "user-1",
        roleId: "role-1",
        expiresAt: null,
        createdAt: new Date(),
        createdBy: null,
      };

      vi.mocked(mockPrisma.userRole.findUnique).mockResolvedValue(mockUserRole);

      // Act
      const result = await repository.findById("ur-1");

      // Assert
      expect(result).not.toBeNull();
      expect(result?.expiresAt).toBeUndefined();
      expect(result?.isExpired()).toBe(false);
      expect(result?.isActive()).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should propagate errors from findById", async () => {
      // Arrange
      const error = new Error("Connection timeout");
      vi.mocked(mockPrisma.userRole.findUnique).mockRejectedValue(error);

      // Act & Assert
      await expect(repository.findById("ur-1")).rejects.toThrow(
        "Connection timeout",
      );
    });

    it("should propagate errors from getUserPermissions", async () => {
      // Arrange
      const error = new Error("Database unavailable");
      vi.mocked(mockPrisma.userRole.findMany).mockRejectedValue(error);

      // Act & Assert
      await expect(repository.getUserPermissions("user-1")).rejects.toThrow(
        "Database unavailable",
      );
    });

    it("should propagate errors from hasRole", async () => {
      // Arrange
      const error = new Error("Query timeout");
      vi.mocked(mockPrisma.userRole.count).mockRejectedValue(error);

      // Act & Assert
      await expect(repository.hasRole("user-1", "role-1")).rejects.toThrow(
        "Query timeout",
      );
    });

    it("should propagate errors from create", async () => {
      // Arrange
      const userRole = UserRole.create(
        {
          userId: "user-1",
          roleId: "role-1",
          createdBy: "admin-1",
        },
        mockIdGenerator,
      );

      const error = new Error("Foreign key constraint");
      vi.mocked(mockPrisma.userRole.create).mockRejectedValue(error);

      // Act & Assert
      await expect(repository.create(userRole)).rejects.toThrow(
        "Foreign key constraint",
      );
    });

    it("should propagate errors from updateExpiration", async () => {
      // Arrange
      const error = new Error("Permission denied");
      vi.mocked(mockPrisma.userRole.update).mockRejectedValue(error);

      // Act & Assert
      await expect(
        repository.updateExpiration("ur-1", new Date()),
      ).rejects.toThrow("Permission denied");
    });
  });
});
