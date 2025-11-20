/**
 * GetPermissionUseCase - Unit Tests
 *
 * Tests for the GetPermissionUseCase including:
 * - Successful permission retrieval
 * - Not found handling
 * - Repository integration
 */

import { describe, it, expect, beforeEach } from "vitest";
import { GetPermissionUseCase } from "../get-permission.use-case";
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

  // Helper methods for testing
  addPermission(permission: Permission): void {
    this.permissions.set(permission.id, permission);
  }

  clear(): void {
    this.permissions.clear();
  }
}

describe("GetPermissionUseCase", () => {
  let useCase: GetPermissionUseCase;
  let mockRepository: MockPermissionRepository;

  beforeEach(() => {
    mockRepository = new MockPermissionRepository();
    useCase = new GetPermissionUseCase(
      mockRepository as unknown as IPermissionRepository,
    );
  });

  describe("execute - successful retrieval", () => {
    it("should retrieve an existing permission", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "create",
        displayName: "Create Task",
        description: "Allows creating tasks",
      });
      mockRepository.addPermission(permission);

      // Act
      const result = await useCase.execute(permission.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.id).toBe(permission.id);
      expect(result!.name).toBe("task:create");
      expect(result!.displayName).toBe("Create Task");
      expect(result!.description).toBe("Allows creating tasks");
    });

    it("should retrieve a system permission", async () => {
      // Arrange
      const systemPermission = PermissionEntity.create({
        resource: "admin",
        action: "access",
        displayName: "Admin Access",
        isSystem: true,
      });
      mockRepository.addPermission(systemPermission);

      // Act
      const result = await useCase.execute(systemPermission.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.isSystem).toBe(true);
    });

    it("should retrieve an inactive permission", async () => {
      // Arrange
      const inactivePermission = PermissionEntity.create({
        resource: "task",
        action: "archive",
        displayName: "Archive Task",
        isActive: false,
      });
      mockRepository.addPermission(inactivePermission);

      // Act
      const result = await useCase.execute(inactivePermission.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.isActive).toBe(false);
    });

    it("should retrieve permission with all properties intact", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "update",
        displayName: "Update Task",
        description: "Allows updating tasks",
        isSystem: false,
        isActive: true,
      });
      mockRepository.addPermission(permission);

      // Act
      const result = await useCase.execute(permission.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.id).toBe(permission.id);
      expect(result!.name).toBe(permission.name);
      expect(result!.resource).toBe(permission.resource);
      expect(result!.action).toBe(permission.action);
      expect(result!.displayName).toBe(permission.displayName);
      expect(result!.description).toBe(permission.description);
      expect(result!.isSystem).toBe(permission.isSystem);
      expect(result!.isActive).toBe(permission.isActive);
      expect(result!.createdAt).toBeDefined();
      expect(result!.updatedAt).toBeDefined();
    });
  });

  describe("execute - not found handling", () => {
    it("should return null when permission does not exist", async () => {
      // Arrange
      const nonExistentId = "non-existent-id";

      // Act
      const result = await useCase.execute(nonExistentId);

      // Assert
      expect(result).toBeNull();
    });

    it("should return null for empty ID", async () => {
      // Arrange
      const emptyId = "";

      // Act
      const result = await useCase.execute(emptyId);

      // Assert
      expect(result).toBeNull();
    });

    it("should return null for UUID-like non-existent ID", async () => {
      // Arrange
      const uuidLikeId = "00000000-0000-0000-0000-000000000000";

      // Act
      const result = await useCase.execute(uuidLikeId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("execute - repository integration", () => {
    it("should call repository findById method", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "read",
        displayName: "Read Task",
      });
      mockRepository.addPermission(permission);

      let findByIdWasCalled = false;
      let calledWithId = "";
      const originalFindById = mockRepository.findById.bind(mockRepository);
      mockRepository.findById = async (id: string) => {
        findByIdWasCalled = true;
        calledWithId = id;
        return originalFindById(id);
      };

      // Act
      await useCase.execute(permission.id);

      // Assert
      expect(findByIdWasCalled).toBe(true);
      expect(calledWithId).toBe(permission.id);
    });

    it("should pass through repository response unchanged", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "delete",
        displayName: "Delete Task",
      });
      mockRepository.addPermission(permission);

      // Act
      const result = await useCase.execute(permission.id);

      // Assert - Should be exact same object reference
      const repositoryResult = await mockRepository.findById(permission.id);
      expect(result).toBe(repositoryResult);
    });
  });

  describe("edge cases", () => {
    it("should handle very long ID", async () => {
      // Arrange
      const longId = "a".repeat(1000);

      // Act
      const result = await useCase.execute(longId);

      // Assert
      expect(result).toBeNull();
    });

    it("should handle special characters in ID", async () => {
      // Arrange
      const specialId = "!@#$%^&*()";

      // Act
      const result = await useCase.execute(specialId);

      // Assert
      expect(result).toBeNull();
    });

    it("should handle numeric string ID", async () => {
      // Arrange
      const numericId = "12345";

      // Act
      const result = await useCase.execute(numericId);

      // Assert
      expect(result).toBeNull();
    });

    it("should retrieve multiple different permissions correctly", async () => {
      // Arrange
      const permission1 = PermissionEntity.create({
        resource: "task",
        action: "create",
        displayName: "Create Task",
      });
      const permission2 = PermissionEntity.create({
        resource: "task",
        action: "read",
        displayName: "Read Task",
      });
      const permission3 = PermissionEntity.create({
        resource: "task",
        action: "update",
        displayName: "Update Task",
      });

      mockRepository.addPermission(permission1);
      mockRepository.addPermission(permission2);
      mockRepository.addPermission(permission3);

      // Act
      const result1 = await useCase.execute(permission1.id);
      const result2 = await useCase.execute(permission2.id);
      const result3 = await useCase.execute(permission3.id);

      // Assert
      expect(result1!.id).toBe(permission1.id);
      expect(result2!.id).toBe(permission2.id);
      expect(result3!.id).toBe(permission3.id);
      expect(result1!.action).toBe("create");
      expect(result2!.action).toBe("read");
      expect(result3!.action).toBe("update");
    });

    it("should handle concurrent retrieval requests", async () => {
      // Arrange
      const permission = PermissionEntity.create({
        resource: "task",
        action: "create",
        displayName: "Create Task",
      });
      mockRepository.addPermission(permission);

      // Act - Execute multiple requests concurrently
      const results = await Promise.all([
        useCase.execute(permission.id),
        useCase.execute(permission.id),
        useCase.execute(permission.id),
      ]);

      // Assert - All should return the same permission
      expect(results[0]).not.toBeNull();
      expect(results[1]).not.toBeNull();
      expect(results[2]).not.toBeNull();
      expect(results[0]!.id).toBe(permission.id);
      expect(results[1]!.id).toBe(permission.id);
      expect(results[2]!.id).toBe(permission.id);
    });

    it("should handle retrieval after permission was added", async () => {
      // Arrange - Start with no permissions
      const permission = PermissionEntity.create({
        resource: "task",
        action: "create",
        displayName: "Create Task",
      });

      // Act - Try to retrieve (should be null)
      const resultBefore = await useCase.execute(permission.id);

      // Add permission
      mockRepository.addPermission(permission);

      // Try to retrieve again (should exist now)
      const resultAfter = await useCase.execute(permission.id);

      // Assert
      expect(resultBefore).toBeNull();
      expect(resultAfter).not.toBeNull();
      expect(resultAfter!.id).toBe(permission.id);
    });
  });
});
