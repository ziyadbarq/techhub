/**
 * CreatePermissionUseCase - Unit Tests
 *
 * Tests for the CreatePermissionUseCase including:
 * - Successful permission creation
 * - Duplicate permission handling
 * - Validation errors
 * - Repository integration
 */

import { describe, it, expect, beforeEach } from "vitest";
import { CreatePermissionUseCase } from "../create-permission.use-case";
import type { IPermissionRepository } from "@/core/repositories/permission-repository.interface";
import type { Permission } from "@/core/domain/entities/permission.entity";

/**
 * Mock Permission Repository
 */
class MockPermissionRepository implements Partial<IPermissionRepository> {
  private permissions = new Map<string, Permission>();

  async create(permission: Permission): Promise<Permission> {
    this.permissions.set(permission.id, permission);
    return permission;
  }

  async findById(id: string): Promise<Permission | null> {
    return this.permissions.get(id) || null;
  }

  async findByName(name: string): Promise<Permission | null> {
    for (const permission of this.permissions.values()) {
      if (permission.name === name) {
        return permission;
      }
    }
    return null;
  }

  clear(): void {
    this.permissions.clear();
  }
}

describe("CreatePermissionUseCase", () => {
  let useCase: CreatePermissionUseCase;
  let mockRepository: MockPermissionRepository;

  beforeEach(() => {
    mockRepository = new MockPermissionRepository();
    useCase = new CreatePermissionUseCase(
      mockRepository as unknown as IPermissionRepository,
    );
  });

  describe("execute - successful creation", () => {
    it("should create a permission with valid data", async () => {
      // Arrange
      const params = {
        resource: "task",
        action: "create",
        displayName: "Create Task",
        description: "Allows creating tasks",
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe("task:create");
      expect(result.resource).toBe("task");
      expect(result.action).toBe("create");
      expect(result.displayName).toBe("Create Task");
      expect(result.description).toBe("Allows creating tasks");
      expect(result.isSystem).toBe(false);
      expect(result.isActive).toBe(true);
      expect(result.id).toBeDefined();
    });

    it("should create a permission with only required fields", async () => {
      // Arrange
      const params = {
        resource: "task",
        action: "read",
        displayName: "Read Task",
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.name).toBe("task:read");
      expect(result.displayName).toBe("Read Task");
      expect(result.description).toBeUndefined();
      expect(result.isSystem).toBe(false);
      expect(result.isActive).toBe(true);
    });

    it("should create a system permission when isSystem is true", async () => {
      // Arrange
      const params = {
        resource: "admin",
        action: "access",
        displayName: "Admin Access",
        isSystem: true,
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.isSystem).toBe(true);
    });

    it("should create an inactive permission when isActive is false", async () => {
      // Arrange
      const params = {
        resource: "task",
        action: "archive",
        displayName: "Archive Task",
        isActive: false,
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.isActive).toBe(false);
    });

    it("should normalize resource and action to lowercase", async () => {
      // Arrange
      const params = {
        resource: "TASK",
        action: "CREATE",
        displayName: "Create Task",
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.name).toBe("task:create");
      expect(result.resource).toBe("task");
      expect(result.action).toBe("create");
    });

    it("should trim whitespace from resource and action", async () => {
      // Arrange
      const params = {
        resource: "  task  ",
        action: "  create  ",
        displayName: "Create Task",
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.name).toBe("task:create");
      expect(result.resource).toBe("task");
      expect(result.action).toBe("create");
    });

    it("should persist permission to repository", async () => {
      // Arrange
      const params = {
        resource: "task",
        action: "delete",
        displayName: "Delete Task",
      };

      // Act
      const created = await useCase.execute(params);

      // Assert - Verify permission exists in repository
      const found = await mockRepository.findById(created.id);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.name).toBe("task:delete");
    });
  });

  describe("execute - duplicate detection", () => {
    it("should throw error when permission with same name already exists", async () => {
      // Arrange
      const params = {
        resource: "task",
        action: "create",
        displayName: "Create Task",
      };

      // Create first permission
      await useCase.execute(params);

      // Act & Assert - Try to create duplicate
      await expect(useCase.execute(params)).rejects.toThrow(
        "Permission task:create already exists",
      );
    });

    it("should detect duplicate regardless of casing", async () => {
      // Arrange - Create permission
      await useCase.execute({
        resource: "task",
        action: "create",
        displayName: "Create Task",
      });

      // Act & Assert - Try with different casing
      await expect(
        useCase.execute({
          resource: "TASK",
          action: "CREATE",
          displayName: "Create Task (Duplicate)",
        }),
      ).rejects.toThrow("Permission task:create already exists");
    });

    it("should detect duplicate regardless of whitespace", async () => {
      // Arrange - Create permission
      await useCase.execute({
        resource: "task",
        action: "create",
        displayName: "Create Task",
      });

      // Act & Assert - Try with whitespace
      await expect(
        useCase.execute({
          resource: "  task  ",
          action: "  create  ",
          displayName: "Create Task (Duplicate)",
        }),
      ).rejects.toThrow("Permission task:create already exists");
    });
  });

  describe("execute - validation", () => {
    it("should throw error for empty resource", async () => {
      // Arrange
      const params = {
        resource: "",
        action: "create",
        displayName: "Create Task",
      };

      // Act & Assert
      await expect(useCase.execute(params)).rejects.toThrow(
        "Permission resource is required",
      );
    });

    it("should throw error for whitespace-only resource", async () => {
      // Arrange
      const params = {
        resource: "   ",
        action: "create",
        displayName: "Create Task",
      };

      // Act & Assert
      await expect(useCase.execute(params)).rejects.toThrow(
        "Permission resource is required",
      );
    });

    it("should throw error for empty action", async () => {
      // Arrange
      const params = {
        resource: "task",
        action: "",
        displayName: "Create Task",
      };

      // Act & Assert
      await expect(useCase.execute(params)).rejects.toThrow(
        "Permission action is required",
      );
    });

    it("should throw error for whitespace-only action", async () => {
      // Arrange
      const params = {
        resource: "task",
        action: "   ",
        displayName: "Create Task",
      };

      // Act & Assert
      await expect(useCase.execute(params)).rejects.toThrow(
        "Permission action is required",
      );
    });

    it("should throw error for empty display name", async () => {
      // Arrange
      const params = {
        resource: "task",
        action: "create",
        displayName: "",
      };

      // Act & Assert
      await expect(useCase.execute(params)).rejects.toThrow(
        "Permission display name is required",
      );
    });

    it("should throw error for whitespace-only display name", async () => {
      // Arrange
      const params = {
        resource: "task",
        action: "create",
        displayName: "   ",
      };

      // Act & Assert
      await expect(useCase.execute(params)).rejects.toThrow(
        "Permission display name is required",
      );
    });
  });

  describe("edge cases", () => {
    it("should handle special characters in resource and action", async () => {
      // Arrange
      const params = {
        resource: "task-board",
        action: "view-all",
        displayName: "View All Task Boards",
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.name).toBe("task-board:view-all");
    });

    it("should handle numeric resource and action", async () => {
      // Arrange
      const params = {
        resource: "resource123",
        action: "action456",
        displayName: "Numeric Permission",
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.name).toBe("resource123:action456");
    });

    it("should trim whitespace from display name", async () => {
      // Arrange
      const params = {
        resource: "task",
        action: "create",
        displayName: "  Create Task  ",
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.displayName).toBe("Create Task");
    });

    it("should trim whitespace from description", async () => {
      // Arrange
      const params = {
        resource: "task",
        action: "create",
        displayName: "Create Task",
        description: "  Allows creating tasks  ",
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.description).toBe("Allows creating tasks");
    });

    it("should handle long display name", async () => {
      // Arrange
      const params = {
        resource: "task",
        action: "create",
        displayName: "A".repeat(200),
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.displayName.length).toBe(200);
    });

    it("should handle long description", async () => {
      // Arrange
      const params = {
        resource: "task",
        action: "create",
        displayName: "Create Task",
        description: "A".repeat(1000),
      };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.description?.length).toBe(1000);
    });
  });
});
