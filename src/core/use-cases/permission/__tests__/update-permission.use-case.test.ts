/**
 * UpdatePermissionUseCase - Unit Tests
 *
 * Tests for the UpdatePermissionUseCase including:
 * - Successful permission updates
 * - Not found handling
 * - Partial updates
 * - Validation
 * - Repository integration
 */

import { describe, it, expect, beforeEach } from "vitest";
import { UpdatePermissionUseCase } from "../update-permission.use-case";
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

  async update(permission: Permission): Promise<Permission> {
    this.permissions.set(permission.id, permission);
    return permission;
  }

  // Helper methods for testing
  addPermission(permission: Permission): void {
    this.permissions.set(permission.id, permission);
  }

  clear(): void {
    this.permissions.clear();
  }
}

describe("UpdatePermissionUseCase", () => {
  let useCase: UpdatePermissionUseCase;
  let mockRepository: MockPermissionRepository;

  beforeEach(() => {
    mockRepository = new MockPermissionRepository();
    useCase = new UpdatePermissionUseCase(
      mockRepository as unknown as IPermissionRepository,
    );
  });

  describe("execute - successful updates", () => {
    it("should update all modifiable fields", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "create",
        displayName: "Create Task",
        description: "Old description",
        isActive: true,
      });
      mockRepository.addPermission(permission);

      const params = {
        id: permission.id,
        displayName: "New Create Task",
        description: "New description",
        isActive: false,
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.displayName).toBe("New Create Task");
      expect(result.description).toBe("New description");
      expect(result.isActive).toBe(false);
      expect(result.id).toBe(permission.id);
      expect(result.name).toBe(permission.name); // Name should not change
      expect(result.resource).toBe(permission.resource); // Resource should not change
      expect(result.action).toBe(permission.action); // Action should not change
    });

    it("should update only display name", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "read",
        displayName: "Read Task",
        description: "Original description",
        isActive: true,
      });
      mockRepository.addPermission(permission);

      const params = {
        id: permission.id,
        displayName: "View Task",
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.displayName).toBe("View Task");
      expect(result.description).toBe("Original description"); // Unchanged
      expect(result.isActive).toBe(true); // Unchanged
    });

    it("should update only description", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "update",
        displayName: "Update Task",
        description: "Old description",
        isActive: true,
      });
      mockRepository.addPermission(permission);

      const params = {
        id: permission.id,
        description: "New description text",
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.description).toBe("New description text");
      expect(result.displayName).toBe("Update Task"); // Unchanged
      expect(result.isActive).toBe(true); // Unchanged
    });

    it("should update only isActive status", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "delete",
        displayName: "Delete Task",
        description: "Description",
        isActive: true,
      });
      mockRepository.addPermission(permission);

      const params = {
        id: permission.id,
        isActive: false,
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.isActive).toBe(false);
      expect(result.displayName).toBe("Delete Task"); // Unchanged
      expect(result.description).toBe("Description"); // Unchanged
    });

    it("should activate an inactive permission", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "archive",
        displayName: "Archive Task",
        isActive: false,
      });
      mockRepository.addPermission(permission);

      const params = {
        id: permission.id,
        isActive: true,
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.isActive).toBe(true);
    });

    it("should update system permission (display name and description only)", async () => {
      // Arrange
      const systemPermission = PermissionEntity.create({
        resource: "admin",
        action: "access",
        displayName: "Admin Access",
        description: "Old description",
        isSystem: true,
      });
      mockRepository.addPermission(systemPermission);

      const params = {
        id: systemPermission.id,
        displayName: "Administrator Access",
        description: "New description",
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.displayName).toBe("Administrator Access");
      expect(result.description).toBe("New description");
      expect(result.isSystem).toBe(true); // Should remain system
    });

    it("should persist updated permission to repository", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "create",
        displayName: "Create Task",
      });
      mockRepository.addPermission(permission);

      const params = {
        id: permission.id,
        displayName: "New Create Task",
      };

      // Act
      await useCase.execute(params);

      // Assert - Verify changes are in repository
      const found = await mockRepository.findById(permission.id);
      expect(found!.displayName).toBe("New Create Task");
    });

    it("should update updatedAt timestamp", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "create",
        displayName: "Create Task",
      });
      mockRepository.addPermission(permission);

      const originalUpdatedAt = permission.updatedAt;

      // Wait a bit to ensure timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 10));

      const params = {
        id: permission.id,
        displayName: "Updated Task",
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
      expect(result.createdAt).toEqual(permission.createdAt); // Should not change
    });
  });

  describe("execute - not found handling", () => {
    it("should throw error when permission does not exist", async () => {
      // Arrange
      const params = {
        id: "non-existent-id",
        displayName: "New Name",
      };

      // Act & Assert
      await expect(useCase.execute(params)).rejects.toThrow(
        "Permission not found",
      );
    });

    it("should throw error for empty ID", async () => {
      // Arrange
      const params = {
        id: "",
        displayName: "New Name",
      };

      // Act & Assert
      await expect(useCase.execute(params)).rejects.toThrow(
        "Permission not found",
      );
    });
  });

  describe("execute - validation", () => {
    it("should throw error when updating display name to empty string", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "create",
        displayName: "Create Task",
      });
      mockRepository.addPermission(permission);

      const params = {
        id: permission.id,
        displayName: "",
      };

      // Act & Assert
      await expect(useCase.execute(params)).rejects.toThrow(
        "Permission display name is required",
      );
    });

    it("should throw error when updating display name to whitespace-only", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "create",
        displayName: "Create Task",
      });
      mockRepository.addPermission(permission);

      const params = {
        id: permission.id,
        displayName: "   ",
      };

      // Act & Assert
      await expect(useCase.execute(params)).rejects.toThrow(
        "Permission display name is required",
      );
    });

    it("should trim whitespace from display name", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "create",
        displayName: "Create Task",
      });
      mockRepository.addPermission(permission);

      const params = {
        id: permission.id,
        displayName: "  New Create Task  ",
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.displayName).toBe("New Create Task");
    });

    it("should trim whitespace from description", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "create",
        displayName: "Create Task",
      });
      mockRepository.addPermission(permission);

      const params = {
        id: permission.id,
        description: "  New description  ",
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.description).toBe("New description");
    });
  });

  describe("execute - partial updates", () => {
    it("should not change fields when not provided in params", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "create",
        displayName: "Create Task",
        description: "Original description",
        isActive: true,
      });
      mockRepository.addPermission(permission);

      const params = {
        id: permission.id,
        // Only ID provided, no updates
      };

      // Act
      const result = await useCase.execute(params);

      // Assert - All fields should remain the same
      expect(result.displayName).toBe("Create Task");
      expect(result.description).toBe("Original description");
      expect(result.isActive).toBe(true);
    });

    it("should handle undefined values by not updating those fields", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "create",
        displayName: "Create Task",
        description: "Original description",
        isActive: true,
      });
      mockRepository.addPermission(permission);

      const params = {
        id: permission.id,
        displayName: undefined,
        description: undefined,
        isActive: undefined,
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.displayName).toBe("Create Task");
      expect(result.description).toBe("Original description");
      expect(result.isActive).toBe(true);
    });
  });

  describe("execute - immutable fields", () => {
    it("should not change permission ID", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "create",
        displayName: "Create Task",
      });
      mockRepository.addPermission(permission);

      const originalId = permission.id;

      const params = {
        id: permission.id,
        displayName: "New Name",
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.id).toBe(originalId);
    });

    it("should not change permission name (resource:action)", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "create",
        displayName: "Create Task",
      });
      mockRepository.addPermission(permission);

      const originalName = permission.name;

      const params = {
        id: permission.id,
        displayName: "New Name",
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.name).toBe(originalName);
      expect(result.name).toBe("task:create");
    });

    it("should not change resource", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "create",
        displayName: "Create Task",
      });
      mockRepository.addPermission(permission);

      const params = {
        id: permission.id,
        displayName: "New Name",
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.resource).toBe("task");
    });

    it("should not change action", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "create",
        displayName: "Create Task",
      });
      mockRepository.addPermission(permission);

      const params = {
        id: permission.id,
        displayName: "New Name",
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.action).toBe("create");
    });

    it("should not change isSystem flag", async () => {
      // Arrange
      const systemPermission = PermissionEntity.create({
        resource: "admin",
        action: "access",
        displayName: "Admin Access",
        isSystem: true,
      });
      mockRepository.addPermission(systemPermission);

      const params = {
        id: systemPermission.id,
        displayName: "New Name",
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.isSystem).toBe(true);
    });

    it("should not change createdAt timestamp", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "create",
        displayName: "Create Task",
      });
      mockRepository.addPermission(permission);

      const originalCreatedAt = permission.createdAt;

      const params = {
        id: permission.id,
        displayName: "New Name",
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.createdAt).toEqual(originalCreatedAt);
    });
  });

  describe("edge cases", () => {
    it("should handle long display name", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "create",
        displayName: "Create Task",
      });
      mockRepository.addPermission(permission);

      const params = {
        id: permission.id,
        displayName: "A".repeat(200),
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.displayName.length).toBe(200);
    });

    it("should handle long description", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "create",
        displayName: "Create Task",
      });
      mockRepository.addPermission(permission);

      const params = {
        id: permission.id,
        description: "A".repeat(1000),
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.description?.length).toBe(1000);
    });

    it("should handle special characters in display name", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "create",
        displayName: "Create Task",
      });
      mockRepository.addPermission(permission);

      const params = {
        id: permission.id,
        displayName: "Create Task 🚀 @#$%",
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.displayName).toBe("Create Task 🚀 @#$%");
    });

    it("should handle multiple sequential updates", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "create",
        displayName: "Create Task",
      });
      mockRepository.addPermission(permission);

      // Act - Multiple updates
      const result1 = await useCase.execute({
        id: permission.id,
        displayName: "Update 1",
      });
      const result2 = await useCase.execute({
        id: permission.id,
        displayName: "Update 2",
      });
      const result3 = await useCase.execute({
        id: permission.id,
        displayName: "Update 3",
      });

      // Assert
      expect(result1.displayName).toBe("Update 1");
      expect(result2.displayName).toBe("Update 2");
      expect(result3.displayName).toBe("Update 3");

      // Verify final state in repository
      const final = await mockRepository.findById(permission.id);
      expect(final!.displayName).toBe("Update 3");
    });

    it("should handle clearing description", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "create",
        displayName: "Create Task",
        description: "Original description",
      });
      mockRepository.addPermission(permission);

      const params = {
        id: permission.id,
        description: "",
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.description).toBe("");
    });
  });
});
