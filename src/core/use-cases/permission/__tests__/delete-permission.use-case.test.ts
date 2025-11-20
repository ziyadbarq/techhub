/**
 * DeletePermissionUseCase - Unit Tests
 *
 * Tests for the DeletePermissionUseCase including:
 * - Successful permission deletion
 * - System permission protection
 * - Not found handling
 * - Repository integration
 */

import { describe, it, expect, beforeEach } from "vitest";
import { DeletePermissionUseCase } from "../delete-permission.use-case";
import type { IPermissionRepository } from "@/core/repositories/permission-repository.interface";
import type { Permission } from "@/core/domain/entities/permission.entity";
import { Permission as PermissionEntity } from "@/core/domain/entities/permission.entity";

/**
 * Mock Permission Repository
 */
class MockPermissionRepository implements Partial<IPermissionRepository> {
  private permissions = new Map<string, Permission>();

  async findById(id: string): Promise<Permission | null> {
    return this.permissions.get(id) || null;
  }

  async delete(id: string): Promise<void> {
    this.permissions.delete(id);
  }

  // Helper methods for testing
  addPermission(permission: Permission): void {
    this.permissions.set(permission.id, permission);
  }

  hasPermission(id: string): boolean {
    return this.permissions.has(id);
  }

  clear(): void {
    this.permissions.clear();
  }
}

describe("DeletePermissionUseCase", () => {
  let useCase: DeletePermissionUseCase;
  let mockRepository: MockPermissionRepository;

  beforeEach(() => {
    mockRepository = new MockPermissionRepository();
    useCase = new DeletePermissionUseCase(
      mockRepository as unknown as IPermissionRepository,
    );
  });

  describe("execute - successful deletion", () => {
    it("should delete a regular permission", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "create",
        displayName: "Create Task",
        isSystem: false,
      });
      mockRepository.addPermission(permission);

      // Act
      await useCase.execute(permission.id);

      // Assert
      expect(mockRepository.hasPermission(permission.id)).toBe(false);
    });

    it("should not throw error when deleting non-system permission", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "delete",
        displayName: "Delete Task",
        isSystem: false,
      });
      mockRepository.addPermission(permission);

      // Act & Assert
      await expect(useCase.execute(permission.id)).resolves.not.toThrow();
    });

    it("should delete inactive permission", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "archive",
        displayName: "Archive Task",
        isSystem: false,
        isActive: false,
      });
      mockRepository.addPermission(permission);

      // Act
      await useCase.execute(permission.id);

      // Assert
      expect(mockRepository.hasPermission(permission.id)).toBe(false);
    });
  });

  describe("execute - system permission protection", () => {
    it("should throw error when deleting system permission", async () => {
      // Arrange
      const systemPermission = PermissionEntity.create({
        resource: "admin",
        action: "access",
        displayName: "Admin Access",
        isSystem: true,
      });
      mockRepository.addPermission(systemPermission);

      // Act & Assert
      await expect(useCase.execute(systemPermission.id)).rejects.toThrow(
        "Cannot delete system permission",
      );
    });

    it("should not delete system permission from repository on error", async () => {
      // Arrange
      const systemPermission = PermissionEntity.create({
        resource: "admin",
        action: "access",
        displayName: "Admin Access",
        isSystem: true,
      });
      mockRepository.addPermission(systemPermission);

      // Act
      try {
        await useCase.execute(systemPermission.id);
      } catch {
        // Expected error
      }

      // Assert - Permission should still exist
      expect(mockRepository.hasPermission(systemPermission.id)).toBe(true);
    });

    it("should throw error for inactive system permission", async () => {
      // Arrange
      const systemPermission = PermissionEntity.create({
        resource: "admin",
        action: "access",
        displayName: "Admin Access",
        isSystem: true,
        isActive: false,
      });
      mockRepository.addPermission(systemPermission);

      // Act & Assert
      await expect(useCase.execute(systemPermission.id)).rejects.toThrow(
        "Cannot delete system permission",
      );
    });
  });

  describe("execute - not found handling", () => {
    it("should throw error when permission does not exist", async () => {
      // Arrange
      const nonExistentId = "non-existent-id";

      // Act & Assert
      await expect(useCase.execute(nonExistentId)).rejects.toThrow(
        "Permission not found",
      );
    });

    it("should throw error for empty ID", async () => {
      // Arrange
      const emptyId = "";

      // Act & Assert
      await expect(useCase.execute(emptyId)).rejects.toThrow(
        "Permission not found",
      );
    });

    it("should throw error for null-like ID", async () => {
      // Arrange
      const nullLikeId = "00000000-0000-0000-0000-000000000000";

      // Act & Assert
      await expect(useCase.execute(nullLikeId)).rejects.toThrow(
        "Permission not found",
      );
    });
  });

  describe("execute - repository integration", () => {
    it("should call repository delete method", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "update",
        displayName: "Update Task",
        isSystem: false,
      });
      mockRepository.addPermission(permission);

      let deleteWasCalled = false;
      const originalDelete = mockRepository.delete.bind(mockRepository);
      mockRepository.delete = async (id: string) => {
        deleteWasCalled = true;
        return originalDelete(id);
      };

      // Act
      await useCase.execute(permission.id);

      // Assert
      expect(deleteWasCalled).toBe(true);
    });

    it("should only delete after validation passes", async () => {
      // Arrange
      const systemPermission = PermissionEntity.create({
        resource: "admin",
        action: "access",
        displayName: "Admin Access",
        isSystem: true,
      });
      mockRepository.addPermission(systemPermission);

      let deleteWasCalled = false;
      const originalDelete = mockRepository.delete.bind(mockRepository);
      mockRepository.delete = async (id: string) => {
        deleteWasCalled = true;
        return originalDelete(id);
      };

      // Act
      try {
        await useCase.execute(systemPermission.id);
      } catch {
        // Expected error
      }

      // Assert - Delete should not have been called
      expect(deleteWasCalled).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle very long ID", async () => {
      // Arrange
      const longId = "a".repeat(1000);

      // Act & Assert
      await expect(useCase.execute(longId)).rejects.toThrow(
        "Permission not found",
      );
    });

    it("should handle special characters in ID", async () => {
      // Arrange
      const specialId = "!@#$%^&*()";

      // Act & Assert
      await expect(useCase.execute(specialId)).rejects.toThrow(
        "Permission not found",
      );
    });

    it("should handle multiple deletions in sequence", async () => {
      // Arrange
      const permission1 = PermissionEntity.create({
        resource: "task",
        action: "create",
        displayName: "Create Task",
        isSystem: false,
      });
      const permission2 = PermissionEntity.create({
        resource: "task",
        action: "read",
        displayName: "Read Task",
        isSystem: false,
      });
      const permission3 = PermissionEntity.create({
        resource: "task",
        action: "update",
        displayName: "Update Task",
        isSystem: false,
      });

      mockRepository.addPermission(permission1);
      mockRepository.addPermission(permission2);
      mockRepository.addPermission(permission3);

      // Act
      await useCase.execute(permission1.id);
      await useCase.execute(permission2.id);
      await useCase.execute(permission3.id);

      // Assert
      expect(mockRepository.hasPermission(permission1.id)).toBe(false);
      expect(mockRepository.hasPermission(permission2.id)).toBe(false);
      expect(mockRepository.hasPermission(permission3.id)).toBe(false);
    });

    it("should fail when trying to delete same permission twice", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "delete",
        displayName: "Delete Task",
        isSystem: false,
      });
      mockRepository.addPermission(permission);

      // Act
      await useCase.execute(permission.id);

      // Assert - Second deletion should fail
      await expect(useCase.execute(permission.id)).rejects.toThrow(
        "Permission not found",
      );
    });
  });
});
