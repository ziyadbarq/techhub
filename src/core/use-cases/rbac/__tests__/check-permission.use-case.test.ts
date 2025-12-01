/**
 * CheckPermissionUseCase - Unit Tests
 *
 * Tests for the CheckPermissionUseCase including:
 * - Basic permission checking
 * - Cache behavior (hits and misses)
 * - Ownership-based permissions
 * - Cache invalidation
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { CheckPermissionUseCase } from "../check-permission.use-case";
import type { IUserRoleRepository } from "@/core/repositories/user-role-repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";
import type { IPermissionCacheService } from "@/core/services/permission-cache.service.interface";
import { permissionCache } from "@/lib/permissions/cache";

/**
 * Mock UserRoleRepository
 */
class MockUserRoleRepository implements Partial<IUserRoleRepository> {
  private userPermissions = new Map<string, PermissionKey[]>();

  async getUserPermissions(userId: string): Promise<PermissionKey[]> {
    return this.userPermissions.get(userId) || [];
  }

  // Test helper
  setUserPermissions(userId: string, permissions: PermissionKey[]): void {
    this.userPermissions.set(userId, permissions);
  }

  clear(): void {
    this.userPermissions.clear();
  }
}

/**
 * Mock Logger Service
 */
class MockLoggerService implements Partial<ILoggerService> {
  debug = vi.fn();
  info = vi.fn();
  warn = vi.fn();
  error = vi.fn();
  startTimer = vi.fn(
    (operation: string, context?: Record<string, unknown>) => ({
      startTime: Date.now(),
      operation,
      context,
    }),
  );
  endTimer = vi.fn();
}

describe("CheckPermissionUseCase", () => {
  let checkPermissionUseCase: CheckPermissionUseCase;
  let mockUserRoleRepository: MockUserRoleRepository;
  let mockLogger: MockLoggerService;
  let mockPermissionCacheService: IPermissionCacheService;

  beforeEach(() => {
    // Create fresh instances
    mockUserRoleRepository = new MockUserRoleRepository();
    mockLogger = new MockLoggerService();
    mockPermissionCacheService = {
      get: vi.fn(),
      set: vi.fn(),
      invalidate: vi.fn(),
    };

    // Clear permission cache
    permissionCache.invalidateAll();

    // Create use case
    checkPermissionUseCase = new CheckPermissionUseCase(
      mockUserRoleRepository as unknown as IUserRoleRepository,
      mockLogger as unknown as ILoggerService,
      mockPermissionCacheService,
    );
  });

  describe("execute - basic permission checking", () => {
    it("should return true when user has exact permission", async () => {
      // Arrange
      const userId = "user-1";
      mockUserRoleRepository.setUserPermissions(userId, [
        "tasks:view",
        "tasks:create",
      ]);

      // Act
      const result = await checkPermissionUseCase.execute({
        userId,
        permission: "tasks:view",
      });

      // Assert
      expect(result).toBe(true);
    });

    it("should return false when user lacks permission", async () => {
      // Arrange
      const userId = "user-1";
      mockUserRoleRepository.setUserPermissions(userId, ["tasks:view"]);

      // Act
      const result = await checkPermissionUseCase.execute({
        userId,
        permission: "tasks:delete",
      });

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when user has no permissions", async () => {
      // Arrange
      const userId = "user-1";
      mockUserRoleRepository.setUserPermissions(userId, []);

      // Act
      const result = await checkPermissionUseCase.execute({
        userId,
        permission: "tasks:view",
      });

      // Assert
      expect(result).toBe(false);
    });

    it("should be case-sensitive for permission matching", async () => {
      // Arrange
      const userId = "user-1";
      mockUserRoleRepository.setUserPermissions(userId, ["tasks:view"]);

      // Act
      const result = await checkPermissionUseCase.execute({
        userId,
        permission: "tasks:Read" as PermissionKey,
      });

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("execute - cache behavior", () => {
    it("should fetch from database on cache miss", async () => {
      // Arrange
      const userId = "user-1";
      const getUserPermissionsSpy = vi.spyOn(
        mockUserRoleRepository,
        "getUserPermissions",
      );
      mockUserRoleRepository.setUserPermissions(userId, ["tasks:view"]);

      // Act
      const result = await checkPermissionUseCase.execute({
        userId,
        permission: "tasks:view",
      });

      // Assert
      expect(result).toBe(true);
      expect(getUserPermissionsSpy).toHaveBeenCalledWith(userId);
      expect(getUserPermissionsSpy).toHaveBeenCalledTimes(1);
    });

    it("should use cache on second call (cache hit)", async () => {
      // Arrange
      const userId = "user-1";
      const getUserPermissionsSpy = vi.spyOn(
        mockUserRoleRepository,
        "getUserPermissions",
      );
      mockUserRoleRepository.setUserPermissions(userId, ["tasks:view"]);

      // Act - First call (cache miss)
      await checkPermissionUseCase.execute({
        userId,
        permission: "tasks:view",
      });

      // Act - Second call (cache hit)
      const result = await checkPermissionUseCase.execute({
        userId,
        permission: "tasks:view",
      });

      // Assert
      expect(result).toBe(true);
      expect(getUserPermissionsSpy).toHaveBeenCalledTimes(1); // Only called once
    });

    it("should log cache hit/miss information", async () => {
      // Arrange
      const userId = "user-1";
      mockUserRoleRepository.setUserPermissions(userId, ["tasks:view"]);

      // Act - First call (cache miss)
      await checkPermissionUseCase.execute({
        userId,
        permission: "tasks:view",
      });

      // Act - Second call (cache hit)
      await checkPermissionUseCase.execute({
        userId,
        permission: "tasks:view",
      });

      // Assert - Check debug logs were called
      expect(mockLogger.debug).toHaveBeenCalled();
      const debugCalls = mockLogger.debug.mock.calls;
      expect(debugCalls.some((call) => call[1]?.cacheHit === false)).toBe(true); // Cache miss
      expect(debugCalls.some((call) => call[1]?.cacheHit === true)).toBe(true); // Cache hit
    });

    it("should cache permissions for multiple users independently", async () => {
      // Arrange
      mockUserRoleRepository.setUserPermissions("user-1", ["tasks:view"]);
      mockUserRoleRepository.setUserPermissions("user-2", ["tasks:create"]);

      // Act
      const result1 = await checkPermissionUseCase.execute({
        userId: "user-1",
        permission: "tasks:view",
      });
      const result2 = await checkPermissionUseCase.execute({
        userId: "user-2",
        permission: "tasks:create",
      });

      // Assert
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });
  });

  describe("execute - ownership-based permissions", () => {
    it("should grant permission when user is resource owner", async () => {
      // Arrange
      const userId = "user-1";
      mockUserRoleRepository.setUserPermissions(userId, ["tasks:update"]);

      // Act
      const result = await checkPermissionUseCase.execute({
        userId,
        permission: "tasks:update:own",
        context: {
          resourceOwnerId: "user-1",
        },
      });

      // Assert
      expect(result).toBe(true);
    });

    it("should deny permission when user is not resource owner", async () => {
      // Arrange
      const userId = "user-1";
      mockUserRoleRepository.setUserPermissions(userId, ["tasks:update"]);

      // Act
      const result = await checkPermissionUseCase.execute({
        userId,
        permission: "tasks:update:own",
        context: {
          resourceOwnerId: "user-2", // Different user
        },
      });

      // Assert
      expect(result).toBe(false);
    });

    it("should grant permission if user has exact :own permission as owner", async () => {
      // Arrange
      const userId = "user-1";
      mockUserRoleRepository.setUserPermissions(userId, ["tasks:update:own"]);

      // Act
      const result = await checkPermissionUseCase.execute({
        userId,
        permission: "tasks:update:own",
        context: {
          resourceOwnerId: "user-1",
        },
      });

      // Assert
      expect(result).toBe(true);
    });

    it("should deny permission if user has :own permission but is not owner", async () => {
      // Arrange
      const userId = "user-1";
      mockUserRoleRepository.setUserPermissions(userId, ["tasks:update:own"]);

      // Act
      const result = await checkPermissionUseCase.execute({
        userId,
        permission: "tasks:update:own",
        context: {
          resourceOwnerId: "user-2",
        },
      });

      // Assert
      expect(result).toBe(false);
    });

    it("should deny permission if :own permission lacks resourceOwnerId context", async () => {
      // Arrange
      const userId = "user-1";
      mockUserRoleRepository.setUserPermissions(userId, ["tasks:update"]);

      // Act
      const result = await checkPermissionUseCase.execute({
        userId,
        permission: "tasks:update:own",
        context: {},
      });

      // Assert
      expect(result).toBe(false);
    });

    it("should deny permission if :own permission has no context", async () => {
      // Arrange
      const userId = "user-1";
      mockUserRoleRepository.setUserPermissions(userId, ["tasks:update"]);

      // Act
      const result = await checkPermissionUseCase.execute({
        userId,
        permission: "tasks:update:own",
      });

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("executeOrThrow", () => {
    it("should not throw when user has permission", async () => {
      // Arrange
      const userId = "user-1";
      mockUserRoleRepository.setUserPermissions(userId, ["tasks:view"]);

      // Act & Assert
      await expect(
        checkPermissionUseCase.executeOrThrow({
          userId,
          permission: "tasks:view",
        }),
      ).resolves.toBeUndefined();
    });

    it("should throw InsufficientPermissionsError when user lacks permission", async () => {
      // Arrange
      const userId = "user-1";
      mockUserRoleRepository.setUserPermissions(userId, ["tasks:view"]);

      // Act & Assert
      await expect(
        checkPermissionUseCase.executeOrThrow({
          userId,
          permission: "tasks:delete",
        }),
      ).rejects.toThrow("Insufficient permissions: tasks:delete required");
    });
  });

  describe("error handling", () => {
    it("should propagate repository errors", async () => {
      // Arrange
      const error = new Error("Database connection failed");
      vi.spyOn(mockUserRoleRepository, "getUserPermissions").mockRejectedValue(
        error,
      );

      // Act & Assert
      await expect(
        checkPermissionUseCase.execute({
          userId: "user-1",
          permission: "tasks:view",
        }),
      ).rejects.toThrow("Database connection failed");
    });

    it("should log database fetch timing on error", async () => {
      // Arrange
      const error = new Error("Database connection failed");
      vi.spyOn(mockUserRoleRepository, "getUserPermissions").mockRejectedValue(
        error,
      );

      // Act
      try {
        await checkPermissionUseCase.execute({
          userId: "user-1",
          permission: "tasks:view",
        });
      } catch {
        // Expected
      }

      // Assert - Timer should have been started
      expect(mockLogger.startTimer).toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle user with many permissions", async () => {
      // Arrange
      const userId = "user-1";
      const manyPermissions: PermissionKey[] = Array.from(
        { length: 100 },
        (_, i) => `permission:${i}` as PermissionKey,
      );
      mockUserRoleRepository.setUserPermissions(userId, manyPermissions);

      // Act
      const result = await checkPermissionUseCase.execute({
        userId,
        permission: "permission:50" as PermissionKey,
      });

      // Assert
      expect(result).toBe(true);
    });

    it("should handle special characters in permission names", async () => {
      // Arrange
      const userId = "user-1";
      mockUserRoleRepository.setUserPermissions(userId, [
        "custom-resource:special_action" as PermissionKey,
      ]);

      // Act
      const result = await checkPermissionUseCase.execute({
        userId,
        permission: "custom-resource:special_action" as PermissionKey,
      });

      // Assert
      expect(result).toBe(true);
    });

    it("should handle context with additional properties", async () => {
      // Arrange
      const userId = "user-1";
      mockUserRoleRepository.setUserPermissions(userId, ["tasks:update"]);

      // Act
      const result = await checkPermissionUseCase.execute({
        userId,
        permission: "tasks:update:own",
        context: {
          resourceOwnerId: "user-1",
          taskId: "task-123",
          additionalData: { foo: "bar" },
        },
      });

      // Assert
      expect(result).toBe(true);
    });
  });
});
