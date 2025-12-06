/**
 * ListPermissionsUseCase - Unit Tests
 *
 * Tests for the ListPermissionsUseCase including:
 * - Successful permission listing
 * - Filtering by active status
 * - Empty results handling
 * - Repository integration
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ListPermissionsUseCase } from "../list-permissions.use-case";
import type { IPermissionRepository } from "@/core/repositories/permission-repository.interface";
import type { Permission } from "@/core/domain/entities/permission.entity";
import { Permission as PermissionEntity } from "@/core/domain/entities/permission.entity";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

/**
 * Mock Permission Repository
 */
class MockPermissionRepository implements Partial<IPermissionRepository> {
  private permissions = new Map<string, Permission>();

  async findAll(params?: { includeInactive?: boolean }): Promise<Permission[]> {
    const allPermissions = Array.from(this.permissions.values());

    if (params?.includeInactive) {
      return allPermissions;
    }

    // Filter to only active permissions
    return allPermissions.filter((p) => p.isActive);
  }

  // Helper methods for testing
  addPermission(permission: Permission): void {
    this.permissions.set(permission.id, permission);
  }

  clear(): void {
    this.permissions.clear();
  }
}

// Mock ID generator for tests
let idCounter = 0;
const mockIdGenerator: IIdGenerator = {
  generateId: vi.fn(() => `test-cuid-${idCounter++}`),
};

describe("ListPermissionsUseCase", () => {
  let useCase: ListPermissionsUseCase;
  let mockRepository: MockPermissionRepository;

  beforeEach(() => {
    idCounter = 0;
    mockRepository = new MockPermissionRepository();
    useCase = new ListPermissionsUseCase(
      mockRepository as unknown as IPermissionRepository,
    );
  });

  describe("execute - successful listing", () => {
    it("should list all active permissions by default", async () => {
      // Arrange
      const permission1 = PermissionEntity.create(
        {
          resource: "task",
          action: "create",
          displayName: "Create Task",
          isActive: true,
        },
        mockIdGenerator,
      );
      const permission2 = PermissionEntity.create(
        {
          resource: "task",
          action: "read",
          displayName: "Read Task",
          isActive: true,
        },
        mockIdGenerator,
      );
      const permission3 = PermissionEntity.create(
        {
          resource: "task",
          action: "delete",
          displayName: "Delete Task",
          isActive: false,
        },
        mockIdGenerator,
      );

      mockRepository.addPermission(permission1);
      mockRepository.addPermission(permission2);
      mockRepository.addPermission(permission3);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map((p) => p.id)).toContain(permission1.id);
      expect(result.map((p) => p.id)).toContain(permission2.id);
      expect(result.map((p) => p.id)).not.toContain(permission3.id);
    });

    it("should list only active permissions when includeInactive is false", async () => {
      // Arrange
      const activePermission = PermissionEntity.create(
        {
          resource: "task",
          action: "create",
          displayName: "Create Task",
          isActive: true,
        },
        mockIdGenerator,
      );
      const inactivePermission = PermissionEntity.create(
        {
          resource: "task",
          action: "delete",
          displayName: "Delete Task",
          isActive: false,
        },
        mockIdGenerator,
      );

      mockRepository.addPermission(activePermission);
      mockRepository.addPermission(inactivePermission);

      // Act
      const result = await useCase.execute({ includeInactive: false });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(activePermission.id);
    });

    it("should list all permissions when includeInactive is true", async () => {
      // Arrange
      const activePermission = PermissionEntity.create(
        {
          resource: "task",
          action: "create",
          displayName: "Create Task",
          isActive: true,
        },
        mockIdGenerator,
      );
      const inactivePermission = PermissionEntity.create(
        {
          resource: "task",
          action: "delete",
          displayName: "Delete Task",
          isActive: false,
        },
        mockIdGenerator,
      );

      mockRepository.addPermission(activePermission);
      mockRepository.addPermission(inactivePermission);

      // Act
      const result = await useCase.execute({ includeInactive: true });

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map((p) => p.id)).toContain(activePermission.id);
      expect(result.map((p) => p.id)).toContain(inactivePermission.id);
    });

    it("should return all permissions with correct properties", async () => {
      // Arrange
      const permission = PermissionEntity.create(
        {
          resource: "task",
          action: "update",
          displayName: "Update Task",
          description: "Allows updating tasks",
          isSystem: false,
          isActive: true,
        },
        mockIdGenerator,
      );

      mockRepository.addPermission(permission);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(permission.id);
      expect(result[0].name).toBe("task:update");
      expect(result[0].displayName).toBe("Update Task");
      expect(result[0].description).toBe("Allows updating tasks");
      expect(result[0].isSystem).toBe(false);
      expect(result[0].isActive).toBe(true);
    });

    it("should list system and non-system permissions together", async () => {
      // Arrange
      const systemPermission = PermissionEntity.create(
        {
          resource: "admin",
          action: "access",
          displayName: "Admin Access",
          isSystem: true,
        },
        mockIdGenerator,
      );
      const regularPermission = PermissionEntity.create(
        {
          resource: "task",
          action: "create",
          displayName: "Create Task",
          isSystem: false,
        },
        mockIdGenerator,
      );

      mockRepository.addPermission(systemPermission);
      mockRepository.addPermission(regularPermission);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map((p) => p.id)).toContain(systemPermission.id);
      expect(result.map((p) => p.id)).toContain(regularPermission.id);
    });
  });

  describe("execute - empty results", () => {
    it("should return empty array when no permissions exist", async () => {
      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it("should return empty array when all permissions are inactive", async () => {
      // Arrange
      const inactivePermission1 = PermissionEntity.create(
        {
          resource: "task",
          action: "create",
          displayName: "Create Task",
          isActive: false,
        },
        mockIdGenerator,
      );
      const inactivePermission2 = PermissionEntity.create(
        {
          resource: "task",
          action: "read",
          displayName: "Read Task",
          isActive: false,
        },
        mockIdGenerator,
      );

      mockRepository.addPermission(inactivePermission1);
      mockRepository.addPermission(inactivePermission2);

      // Act
      const result = await useCase.execute({ includeInactive: false });

      // Assert
      expect(result).toEqual([]);
    });

    it("should return inactive permissions when includeInactive is true even if all are inactive", async () => {
      // Arrange
      const inactivePermission1 = PermissionEntity.create(
        {
          resource: "task",
          action: "create",
          displayName: "Create Task",
          isActive: false,
        },
        mockIdGenerator,
      );
      const inactivePermission2 = PermissionEntity.create(
        {
          resource: "task",
          action: "read",
          displayName: "Read Task",
          isActive: false,
        },
        mockIdGenerator,
      );

      mockRepository.addPermission(inactivePermission1);
      mockRepository.addPermission(inactivePermission2);

      // Act
      const result = await useCase.execute({ includeInactive: true });

      // Assert
      expect(result).toHaveLength(2);
    });
  });

  describe("execute - repository integration", () => {
    it("should call repository findAll method", async () => {
      // Arrange
      let findAllWasCalled = false;
      const originalFindAll = mockRepository.findAll.bind(mockRepository);
      mockRepository.findAll = async (params) => {
        findAllWasCalled = true;
        return originalFindAll(params);
      };

      // Act
      await useCase.execute();

      // Assert
      expect(findAllWasCalled).toBe(true);
    });

    it("should pass includeInactive parameter to repository", async () => {
      // Arrange
      let receivedParams: { includeInactive?: boolean } | undefined;
      const originalFindAll = mockRepository.findAll.bind(mockRepository);
      mockRepository.findAll = async (params) => {
        receivedParams = params;
        return originalFindAll(params);
      };

      // Act
      await useCase.execute({ includeInactive: true });

      // Assert
      expect(receivedParams).toBeDefined();
      expect(receivedParams!.includeInactive).toBe(true);
    });

    it("should default includeInactive to false when not provided", async () => {
      // Arrange
      let receivedParams: { includeInactive?: boolean } | undefined;
      const originalFindAll = mockRepository.findAll.bind(mockRepository);
      mockRepository.findAll = async (params) => {
        receivedParams = params;
        return originalFindAll(params);
      };

      // Act
      await useCase.execute();

      // Assert
      expect(receivedParams).toBeDefined();
      expect(receivedParams!.includeInactive).toBe(false);
    });

    it("should default includeInactive to false when filter is empty object", async () => {
      // Arrange
      let receivedParams: { includeInactive?: boolean } | undefined;
      const originalFindAll = mockRepository.findAll.bind(mockRepository);
      mockRepository.findAll = async (params) => {
        receivedParams = params;
        return originalFindAll(params);
      };

      // Act
      await useCase.execute({});

      // Assert
      expect(receivedParams).toBeDefined();
      expect(receivedParams!.includeInactive).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle large number of permissions", async () => {
      // Arrange - Create 100 permissions
      for (let i = 0; i < 100; i++) {
        const permission = PermissionEntity.create(
          {
            resource: `resource${i}`,
            action: "action",
            displayName: `Permission ${i}`,
          },
          mockIdGenerator,
        );
        mockRepository.addPermission(permission);
      }

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(100);
    });

    it("should handle mixed active and inactive permissions correctly", async () => {
      // Arrange - Create alternating active/inactive permissions
      const permissions = [];
      for (let i = 0; i < 10; i++) {
        const permission = PermissionEntity.create(
          {
            resource: `resource${i}`,
            action: "action",
            displayName: `Permission ${i}`,
            isActive: i % 2 === 0, // Even indices are active
          },
          mockIdGenerator,
        );
        permissions.push(permission);
        mockRepository.addPermission(permission);
      }

      // Act
      const activeOnly = await useCase.execute({ includeInactive: false });
      const all = await useCase.execute({ includeInactive: true });

      // Assert
      expect(activeOnly).toHaveLength(5); // 5 active (0, 2, 4, 6, 8)
      expect(all).toHaveLength(10); // All 10
    });

    it("should return permissions in consistent order across multiple calls", async () => {
      // Arrange
      const permission1 = PermissionEntity.create(
        {
          resource: "task",
          action: "create",
          displayName: "Create Task",
        },
        mockIdGenerator,
      );
      const permission2 = PermissionEntity.create(
        {
          resource: "task",
          action: "read",
          displayName: "Read Task",
        },
        mockIdGenerator,
      );
      const permission3 = PermissionEntity.create(
        {
          resource: "task",
          action: "update",
          displayName: "Update Task",
        },
        mockIdGenerator,
      );

      mockRepository.addPermission(permission1);
      mockRepository.addPermission(permission2);
      mockRepository.addPermission(permission3);

      // Act
      const result1 = await useCase.execute();
      const result2 = await useCase.execute();
      const result3 = await useCase.execute();

      // Assert
      expect(result1.map((p) => p.id)).toEqual(result2.map((p) => p.id));
      expect(result2.map((p) => p.id)).toEqual(result3.map((p) => p.id));
    });

    it("should handle concurrent list requests", async () => {
      // Arrange
      const permission = PermissionEntity.create(
        {
          resource: "task",
          action: "create",
          displayName: "Create Task",
        },
        mockIdGenerator,
      );
      mockRepository.addPermission(permission);

      // Act - Execute multiple requests concurrently
      const results = await Promise.all([
        useCase.execute(),
        useCase.execute(),
        useCase.execute(),
      ]);

      // Assert - All should return same results
      expect(results[0]).toHaveLength(1);
      expect(results[1]).toHaveLength(1);
      expect(results[2]).toHaveLength(1);
      expect(results[0][0].id).toBe(permission.id);
      expect(results[1][0].id).toBe(permission.id);
      expect(results[2][0].id).toBe(permission.id);
    });

    it("should handle all permissions being system permissions", async () => {
      // Arrange
      const systemPermission1 = PermissionEntity.create(
        {
          resource: "admin",
          action: "access",
          displayName: "Admin Access",
          isSystem: true,
        },
        mockIdGenerator,
      );
      const systemPermission2 = PermissionEntity.create(
        {
          resource: "system",
          action: "configure",
          displayName: "System Configuration",
          isSystem: true,
        },
        mockIdGenerator,
      );

      mockRepository.addPermission(systemPermission1);
      mockRepository.addPermission(systemPermission2);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every((p) => p.isSystem)).toBe(true);
    });

    it("should not modify original permissions", async () => {
      // Arrange
      const permission = PermissionEntity.create(
        {
          resource: "task",
          action: "create",
          displayName: "Create Task",
          description: "Original description",
        },
        mockIdGenerator,
      );
      mockRepository.addPermission(permission);

      // Act
      const result = await useCase.execute();

      // Assert - Permission should remain unchanged
      expect(result[0].description).toBe("Original description");
      expect(permission.description).toBe("Original description");
    });
  });
});
