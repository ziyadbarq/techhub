/**
 * PrismaPermissionRepository - Unit Tests
 *
 * Tests for the PrismaPermissionRepository including:
 * - Find by ID
 * - Find by name
 * - Find all (with/without inactive)
 * - Find by IDs
 * - Find by resource
 * - Find by names
 * - Create permission
 * - Update permission
 * - Delete permission
 * - Exists by name
 * - Data transformation (toDomain)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { PrismaClient } from "@/generated/prisma/server";
import type { Permission as PrismaPermission } from "@/generated/prisma";
import { PrismaPermissionRepository } from "../prisma-permission.repository";
import { Permission } from "@/core/domain/entities/permission.entity";

/**
 * Mock PrismaClient
 */
function createMockPrismaClient(): PrismaClient {
  return {
    permission: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
      findFirst: vi.fn(),
      deleteMany: vi.fn(),
    },
  } as unknown as PrismaClient;
}

describe("PrismaPermissionRepository", () => {
  let repository: PrismaPermissionRepository;
  let mockPrisma: PrismaClient;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    repository = new PrismaPermissionRepository(mockPrisma);
  });

  describe("findById", () => {
    it("should find permission by ID", async () => {
      // Arrange
      const mockPermission: PrismaPermission = {
        id: "perm-1",
        name: "task:create",
        displayName: "Create Task",
        description: "Allow creating tasks",
        resource: "task",
        action: "create",
        isSystem: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockPrisma.permission.findUnique).mockResolvedValue(
        mockPermission,
      );

      // Act
      const result = await repository.findById("perm-1");

      // Assert
      expect(mockPrisma.permission.findUnique).toHaveBeenCalledWith({
        where: { id: "perm-1" },
      });

      expect(result).not.toBeNull();
      expect(result?.id).toBe("perm-1");
      expect(result?.name).toBe("task:create");
    });

    it("should return null when permission not found", async () => {
      // Arrange
      vi.mocked(mockPrisma.permission.findUnique).mockResolvedValue(null);

      // Act
      const result = await repository.findById("non-existent");

      // Assert
      expect(result).toBeNull();
    });

    it("should handle database errors", async () => {
      // Arrange
      const error = new Error("Database error");
      vi.mocked(mockPrisma.permission.findUnique).mockRejectedValue(error);

      // Act & Assert
      await expect(repository.findById("perm-1")).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("findByName", () => {
    it("should find permission by name", async () => {
      // Arrange
      const mockPermission: PrismaPermission = {
        id: "perm-1",
        name: "task:create",
        displayName: "Create Task",
        description: null,
        resource: "task",
        action: "create",
        isSystem: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockPrisma.permission.findUnique).mockResolvedValue(
        mockPermission,
      );

      // Act
      const result = await repository.findByName("task:create");

      // Assert
      expect(mockPrisma.permission.findUnique).toHaveBeenCalledWith({
        where: { name: "task:create" },
      });

      expect(result).not.toBeNull();
      expect(result?.name).toBe("task:create");
    });

    it("should return null when permission name not found", async () => {
      // Arrange
      vi.mocked(mockPrisma.permission.findUnique).mockResolvedValue(null);

      // Act
      const result = await repository.findByName("non:existent");

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("findAll", () => {
    it("should find all active permissions by default", async () => {
      // Arrange
      const mockPermissions: PrismaPermission[] = [
        {
          id: "perm-1",
          name: "task:create",
          displayName: "Create Task",
          description: null,
          resource: "task",
          action: "create",
          isSystem: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "perm-2",
          name: "task:read",
          displayName: "Read Task",
          description: null,
          resource: "task",
          action: "read",
          isSystem: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(mockPrisma.permission.findMany).mockResolvedValue(
        mockPermissions,
      );

      // Act
      const result = await repository.findAll();

      // Assert
      expect(mockPrisma.permission.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: [{ resource: "asc" }, { action: "asc" }],
      });

      expect(result).toHaveLength(2);
    });

    it("should find all permissions including inactive when specified", async () => {
      // Arrange
      const mockPermissions: PrismaPermission[] = [
        {
          id: "perm-1",
          name: "task:create",
          displayName: "Create Task",
          description: null,
          resource: "task",
          action: "create",
          isSystem: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "perm-2",
          name: "task:delete",
          displayName: "Delete Task",
          description: null,
          resource: "task",
          action: "delete",
          isSystem: false,
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(mockPrisma.permission.findMany).mockResolvedValue(
        mockPermissions,
      );

      // Act
      const result = await repository.findAll({ includeInactive: true });

      // Assert
      expect(mockPrisma.permission.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: [{ resource: "asc" }, { action: "asc" }],
      });

      expect(result).toHaveLength(2);
    });

    it("should return empty array when no permissions found", async () => {
      // Arrange
      vi.mocked(mockPrisma.permission.findMany).mockResolvedValue([]);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("findByIds", () => {
    it("should find permissions by IDs", async () => {
      // Arrange
      const ids = ["perm-1", "perm-2"];
      const mockPermissions: PrismaPermission[] = [
        {
          id: "perm-1",
          name: "task:create",
          displayName: "Create Task",
          description: null,
          resource: "task",
          action: "create",
          isSystem: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "perm-2",
          name: "task:read",
          displayName: "Read Task",
          description: null,
          resource: "task",
          action: "read",
          isSystem: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(mockPrisma.permission.findMany).mockResolvedValue(
        mockPermissions,
      );

      // Act
      const result = await repository.findByIds(ids);

      // Assert
      expect(mockPrisma.permission.findMany).toHaveBeenCalledWith({
        where: { id: { in: ids } },
        orderBy: [{ resource: "asc" }, { action: "asc" }],
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("perm-1");
      expect(result[1].id).toBe("perm-2");
    });

    it("should return empty array when no IDs match", async () => {
      // Arrange
      vi.mocked(mockPrisma.permission.findMany).mockResolvedValue([]);

      // Act
      const result = await repository.findByIds(["non-existent"]);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("findByResource", () => {
    it("should find permissions by resource", async () => {
      // Arrange
      const mockPermissions: PrismaPermission[] = [
        {
          id: "perm-1",
          name: "task:create",
          displayName: "Create Task",
          description: null,
          resource: "task",
          action: "create",
          isSystem: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "perm-2",
          name: "task:read",
          displayName: "Read Task",
          description: null,
          resource: "task",
          action: "read",
          isSystem: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(mockPrisma.permission.findMany).mockResolvedValue(
        mockPermissions,
      );

      // Act
      const result = await repository.findByResource("task");

      // Assert
      expect(mockPrisma.permission.findMany).toHaveBeenCalledWith({
        where: { resource: "task", isActive: true },
        orderBy: { action: "asc" },
      });

      expect(result).toHaveLength(2);
      expect(result[0].resource).toBe("task");
      expect(result[1].resource).toBe("task");
    });

    it("should only return active permissions by resource", async () => {
      // Arrange
      vi.mocked(mockPrisma.permission.findMany).mockResolvedValue([]);

      // Act
      await repository.findByResource("task");

      // Assert
      expect(mockPrisma.permission.findMany).toHaveBeenCalledWith({
        where: { resource: "task", isActive: true },
        orderBy: { action: "asc" },
      });
    });
  });

  describe("findByNames", () => {
    it("should find permissions by names", async () => {
      // Arrange
      const names = ["task:create", "task:read"];
      const mockPermissions: PrismaPermission[] = [
        {
          id: "perm-1",
          name: "task:create",
          displayName: "Create Task",
          description: null,
          resource: "task",
          action: "create",
          isSystem: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "perm-2",
          name: "task:read",
          displayName: "Read Task",
          description: null,
          resource: "task",
          action: "read",
          isSystem: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(mockPrisma.permission.findMany).mockResolvedValue(
        mockPermissions,
      );

      // Act
      const result = await repository.findByNames(names);

      // Assert
      expect(mockPrisma.permission.findMany).toHaveBeenCalledWith({
        where: { name: { in: names } },
        orderBy: [{ resource: "asc" }, { action: "asc" }],
      });

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("task:create");
      expect(result[1].name).toBe("task:read");
    });
  });

  describe("create", () => {
    it("should create a new permission", async () => {
      // Arrange
      const permission = Permission.create({
        resource: "task",
        action: "create",
        displayName: "Create Task",
        description: "Allow creating tasks",
      });

      const mockPermission: PrismaPermission = {
        id: permission.id,
        name: permission.name,
        displayName: permission.displayName,
        description: permission.description ?? null,
        resource: permission.resource,
        action: permission.action,
        isSystem: permission.isSystem,
        isActive: permission.isActive,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt,
      };

      vi.mocked(mockPrisma.permission.create).mockResolvedValue(mockPermission);

      // Act
      const result = await repository.create(permission);

      // Assert
      expect(mockPrisma.permission.create).toHaveBeenCalledWith({
        data: {
          id: permission.id,
          name: permission.name,
          displayName: permission.displayName,
          description: permission.description,
          resource: permission.resource,
          action: permission.action,
          isSystem: permission.isSystem,
          isActive: permission.isActive,
          createdAt: permission.createdAt,
          updatedAt: permission.updatedAt,
        },
      });

      expect(result.id).toBe(permission.id);
      expect(result.name).toBe("task:create");
    });

    it("should create permission with system flag", async () => {
      // Arrange
      const permission = Permission.create({
        resource: "rbac",
        action: "manage",
        displayName: "Manage RBAC",
        isSystem: true,
      });

      const mockPermission: PrismaPermission = {
        id: permission.id,
        name: permission.name,
        displayName: permission.displayName,
        description: null,
        resource: permission.resource,
        action: permission.action,
        isSystem: true,
        isActive: permission.isActive,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt,
      };

      vi.mocked(mockPrisma.permission.create).mockResolvedValue(mockPermission);

      // Act
      const result = await repository.create(permission);

      // Assert
      expect(result.isSystem).toBe(true);
    });

    it("should handle duplicate permission errors", async () => {
      // Arrange
      const permission = Permission.create({
        resource: "task",
        action: "create",
        displayName: "Create Task",
      });

      const error = new Error("Unique constraint violation");
      vi.mocked(mockPrisma.permission.create).mockRejectedValue(error);

      // Act & Assert
      await expect(repository.create(permission)).rejects.toThrow(
        "Unique constraint violation",
      );
    });
  });

  describe("update", () => {
    it("should update an existing permission", async () => {
      // Arrange
      const original = Permission.create({
        resource: "task",
        action: "create",
        displayName: "Create Task",
      });

      const updated = original.update({
        displayName: "Create New Task",
        description: "Updated description",
      });

      const mockPermission: PrismaPermission = {
        id: updated.id,
        name: updated.name,
        displayName: updated.displayName,
        description: updated.description ?? null,
        resource: updated.resource,
        action: updated.action,
        isSystem: updated.isSystem,
        isActive: updated.isActive,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };

      vi.mocked(mockPrisma.permission.update).mockResolvedValue(mockPermission);

      // Act
      const result = await repository.update(updated);

      // Assert
      expect(mockPrisma.permission.update).toHaveBeenCalledWith({
        where: { id: updated.id },
        data: {
          displayName: updated.displayName,
          description: updated.description,
          isActive: updated.isActive,
          updatedAt: updated.updatedAt,
        },
      });

      expect(result.displayName).toBe("Create New Task");
      expect(result.description).toBe("Updated description");
    });

    it("should deactivate a permission", async () => {
      // Arrange
      const original = Permission.create({
        resource: "task",
        action: "create",
        displayName: "Create Task",
      });

      const deactivated = original.deactivate();

      const mockPermission: PrismaPermission = {
        id: deactivated.id,
        name: deactivated.name,
        displayName: deactivated.displayName,
        description: null,
        resource: deactivated.resource,
        action: deactivated.action,
        isSystem: deactivated.isSystem,
        isActive: false,
        createdAt: deactivated.createdAt,
        updatedAt: deactivated.updatedAt,
      };

      vi.mocked(mockPrisma.permission.update).mockResolvedValue(mockPermission);

      // Act
      const result = await repository.update(deactivated);

      // Assert
      expect(result.isActive).toBe(false);
    });

    it("should handle update errors", async () => {
      // Arrange
      const permission = Permission.create({
        resource: "task",
        action: "create",
        displayName: "Create Task",
      });

      const error = new Error("Record not found");
      vi.mocked(mockPrisma.permission.update).mockRejectedValue(error);

      // Act & Assert
      await expect(repository.update(permission)).rejects.toThrow(
        "Record not found",
      );
    });
  });

  describe("delete", () => {
    it("should delete a permission", async () => {
      // Arrange
      const id = "perm-1";
      vi.mocked(mockPrisma.permission.delete).mockResolvedValue({
        id,
        name: "task:create",
        displayName: "Create Task",
        description: null,
        resource: "task",
        action: "create",
        isSystem: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      await repository.delete(id);

      // Assert
      expect(mockPrisma.permission.delete).toHaveBeenCalledWith({
        where: { id },
      });
    });

    it("should handle delete errors", async () => {
      // Arrange
      const error = new Error("Foreign key constraint");
      vi.mocked(mockPrisma.permission.delete).mockRejectedValue(error);

      // Act & Assert
      await expect(repository.delete("perm-1")).rejects.toThrow(
        "Foreign key constraint",
      );
    });
  });

  describe("existsByName", () => {
    it("should return true when permission exists", async () => {
      // Arrange
      vi.mocked(mockPrisma.permission.count).mockResolvedValue(1);

      // Act
      const result = await repository.existsByName("task:create");

      // Assert
      expect(mockPrisma.permission.count).toHaveBeenCalledWith({
        where: { name: "task:create" },
      });
      expect(result).toBe(true);
    });

    it("should return false when permission does not exist", async () => {
      // Arrange
      vi.mocked(mockPrisma.permission.count).mockResolvedValue(0);

      // Act
      const result = await repository.existsByName("non:existent");

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("toDomain transformation", () => {
    it("should transform Prisma model with all fields to domain entity", async () => {
      // Arrange
      const mockPermission: PrismaPermission = {
        id: "perm-1",
        name: "task:create",
        displayName: "Create Task",
        description: "Allow creating tasks",
        resource: "task",
        action: "create",
        isSystem: false,
        isActive: true,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-15"),
      };

      vi.mocked(mockPrisma.permission.findUnique).mockResolvedValue(
        mockPermission,
      );

      // Act
      const result = await repository.findById("perm-1");

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(mockPermission.id);
      expect(result?.name).toBe(mockPermission.name);
      expect(result?.displayName).toBe(mockPermission.displayName);
      expect(result?.description).toBe(mockPermission.description);
      expect(result?.resource).toBe(mockPermission.resource);
      expect(result?.action).toBe(mockPermission.action);
      expect(result?.isSystem).toBe(mockPermission.isSystem);
      expect(result?.isActive).toBe(mockPermission.isActive);
      expect(result?.createdAt).toEqual(mockPermission.createdAt);
      expect(result?.updatedAt).toEqual(mockPermission.updatedAt);
    });

    it("should transform Prisma model with null description to undefined", async () => {
      // Arrange
      const mockPermission: PrismaPermission = {
        id: "perm-1",
        name: "task:create",
        displayName: "Create Task",
        description: null,
        resource: "task",
        action: "create",
        isSystem: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockPrisma.permission.findUnique).mockResolvedValue(
        mockPermission,
      );

      // Act
      const result = await repository.findById("perm-1");

      // Assert
      expect(result?.description).toBeUndefined();
    });

    it("should maintain permission entity invariants", async () => {
      // Arrange
      const mockPermission: PrismaPermission = {
        id: "perm-1",
        name: "task:create",
        displayName: "Create Task",
        description: null,
        resource: "task",
        action: "create",
        isSystem: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockPrisma.permission.findUnique).mockResolvedValue(
        mockPermission,
      );

      // Act
      const result = await repository.findById("perm-1");

      // Assert
      expect(result).not.toBeNull();
      // Permission entity should validate resource:action pattern
      expect(result?.name).toBe(`${result?.resource}:${result?.action}`);
      expect(result?.toPermissionKey()).toBe("task:create");
    });
  });

  describe("edge cases", () => {
    it("should handle empty result sets", async () => {
      // Arrange
      vi.mocked(mockPrisma.permission.findMany).mockResolvedValue([]);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toEqual([]);
    });

    it("should handle multiple permissions with same resource", async () => {
      // Arrange
      const mockPermissions: PrismaPermission[] = [
        {
          id: "perm-1",
          name: "task:create",
          displayName: "Create Task",
          description: null,
          resource: "task",
          action: "create",
          isSystem: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "perm-2",
          name: "task:read",
          displayName: "Read Task",
          description: null,
          resource: "task",
          action: "read",
          isSystem: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "perm-3",
          name: "task:update",
          displayName: "Update Task",
          description: null,
          resource: "task",
          action: "update",
          isSystem: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(mockPrisma.permission.findMany).mockResolvedValue(
        mockPermissions,
      );

      // Act
      const result = await repository.findByResource("task");

      // Assert
      expect(result).toHaveLength(3);
      expect(result.every((p) => p.resource === "task")).toBe(true);
    });

    it("should properly order permissions by resource and action", async () => {
      // Arrange
      vi.mocked(mockPrisma.permission.findMany).mockResolvedValue([]);

      // Act
      await repository.findAll();

      // Assert
      expect(mockPrisma.permission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ resource: "asc" }, { action: "asc" }],
        }),
      );
    });
  });
});
