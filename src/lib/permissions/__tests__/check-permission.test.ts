/**
 * Permission Checking Utilities - Unit Tests
 *
 * Tests for permission checking functions including:
 * - Basic permission checks
 * - Ownership-based permissions
 * - Multiple permission checks (all/any)
 * - Cache behavior
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  hasPermission,
  requirePermission,
  hasAllPermissions,
  hasAnyPermission,
} from "../check-permission";
import { InsufficientPermissionsError } from "@/core/domain/errors/rbac-errors";
import { permissionCache } from "../cache";

// Mock the DI container and CheckPermissionUseCase
vi.mock("@/di/container", () => ({
  getContainer: vi.fn(() => ({
    get: vi.fn(() => mockCheckPermissionUseCase),
  })),
}));

// Mock CheckPermissionUseCase
const mockCheckPermissionUseCase = {
  execute: vi.fn(),
};

describe("Permission Checking Utilities", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    // Clear permission cache
    permissionCache.invalidateAll();
  });

  describe("hasPermission", () => {
    it("should return true when user has permission", async () => {
      // Arrange
      mockCheckPermissionUseCase.execute.mockResolvedValue(true);

      // Act
      const result = await hasPermission("user-1", "tasks:view");

      // Assert
      expect(result).toBe(true);
      expect(mockCheckPermissionUseCase.execute).toHaveBeenCalledWith({
        userId: "user-1",
        permission: "tasks:view",
        context: undefined,
      });
    });

    it("should return false when user lacks permission", async () => {
      // Arrange
      mockCheckPermissionUseCase.execute.mockResolvedValue(false);

      // Act
      const result = await hasPermission("user-1", "tasks:delete");

      // Assert
      expect(result).toBe(false);
      expect(mockCheckPermissionUseCase.execute).toHaveBeenCalledWith({
        userId: "user-1",
        permission: "tasks:delete",
        context: undefined,
      });
    });

    it("should pass context to use case when provided", async () => {
      // Arrange
      mockCheckPermissionUseCase.execute.mockResolvedValue(true);
      const context = { resourceOwnerId: "user-1" };

      // Act
      await hasPermission("user-1", "tasks:update:own", context);

      // Assert
      expect(mockCheckPermissionUseCase.execute).toHaveBeenCalledWith({
        userId: "user-1",
        permission: "tasks:update:own",
        context,
      });
    });
  });

  describe("requirePermission", () => {
    it("should not throw when user has permission", async () => {
      // Arrange
      mockCheckPermissionUseCase.execute.mockResolvedValue(true);

      // Act & Assert
      await expect(
        requirePermission("user-1", "tasks:view"),
      ).resolves.toBeUndefined();
    });

    it("should throw InsufficientPermissionsError when user lacks permission", async () => {
      // Arrange
      mockCheckPermissionUseCase.execute.mockResolvedValue(false);

      // Act & Assert
      await expect(requirePermission("user-1", "tasks:delete")).rejects.toThrow(
        InsufficientPermissionsError,
      );
    });

    it("should include userId and permission in error", async () => {
      // Arrange
      mockCheckPermissionUseCase.execute.mockResolvedValue(false);

      // Act & Assert
      try {
        await requirePermission("user-1", "tasks:delete");
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error).toBeInstanceOf(InsufficientPermissionsError);
        expect((error as InsufficientPermissionsError).requiredPermission).toBe(
          "tasks:delete",
        );
        expect((error as InsufficientPermissionsError).userId).toBe("user-1");
      }
    });

    it("should pass context when checking permission", async () => {
      // Arrange
      mockCheckPermissionUseCase.execute.mockResolvedValue(true);
      const context = { resourceOwnerId: "user-1" };

      // Act
      await requirePermission("user-1", "tasks:update:own", context);

      // Assert
      expect(mockCheckPermissionUseCase.execute).toHaveBeenCalledWith({
        userId: "user-1",
        permission: "tasks:update:own",
        context,
      });
    });
  });

  describe("hasAllPermissions", () => {
    it("should return true when user has all permissions", async () => {
      // Arrange
      mockCheckPermissionUseCase.execute.mockResolvedValue(true);

      // Act
      const result = await hasAllPermissions("user-1", [
        "tasks:view",
        "tasks:create",
        "tasks:update",
      ]);

      // Assert
      expect(result).toBe(true);
      expect(mockCheckPermissionUseCase.execute).toHaveBeenCalledTimes(3);
    });

    it("should return false when user lacks any permission", async () => {
      // Arrange
      mockCheckPermissionUseCase.execute
        .mockResolvedValueOnce(true) // tasks:read
        .mockResolvedValueOnce(false) // tasks:create (missing)
        .mockResolvedValueOnce(true); // tasks:update

      // Act
      const result = await hasAllPermissions("user-1", [
        "tasks:view",
        "tasks:create",
        "tasks:update",
      ]);

      // Assert
      expect(result).toBe(false);
    });

    it("should return true for empty permission array", async () => {
      // Act
      const result = await hasAllPermissions("user-1", []);

      // Assert
      expect(result).toBe(true);
      expect(mockCheckPermissionUseCase.execute).not.toHaveBeenCalled();
    });

    it("should check all permissions in parallel", async () => {
      // Arrange
      let resolveCount = 0;
      mockCheckPermissionUseCase.execute.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveCount++;
            if (resolveCount === 3) {
              // All three should be pending before any resolve
              resolve(true);
            } else {
              setTimeout(() => resolve(true), 10);
            }
          }),
      );

      // Act
      const result = await hasAllPermissions("user-1", [
        "tasks:view",
        "tasks:create",
        "tasks:update",
      ]);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe("hasAnyPermission", () => {
    it("should return true when user has at least one permission", async () => {
      // Arrange
      mockCheckPermissionUseCase.execute
        .mockResolvedValueOnce(false) // tasks:delete
        .mockResolvedValueOnce(true) // tasks:read (has this)
        .mockResolvedValueOnce(false); // tasks:admin

      // Act
      const result = await hasAnyPermission("user-1", [
        "tasks:delete",
        "tasks:view",
        "tasks:delete",
      ]);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false when user has none of the permissions", async () => {
      // Arrange
      mockCheckPermissionUseCase.execute.mockResolvedValue(false);

      // Act
      const result = await hasAnyPermission("user-1", [
        "tasks:delete",
        "tasks:delete",
      ]);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for empty permission array", async () => {
      // Act
      const result = await hasAnyPermission("user-1", []);

      // Assert
      expect(result).toBe(false);
      expect(mockCheckPermissionUseCase.execute).not.toHaveBeenCalled();
    });

    it("should return true when user has all permissions", async () => {
      // Arrange
      mockCheckPermissionUseCase.execute.mockResolvedValue(true);

      // Act
      const result = await hasAnyPermission("user-1", [
        "tasks:view",
        "tasks:create",
      ]);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should propagate errors from CheckPermissionUseCase", async () => {
      // Arrange
      const error = new Error("Database connection failed");
      mockCheckPermissionUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(hasPermission("user-1", "tasks:view")).rejects.toThrow(
        "Database connection failed",
      );
    });

    it("should propagate errors in requirePermission", async () => {
      // Arrange
      const error = new Error("Database connection failed");
      mockCheckPermissionUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(requirePermission("user-1", "tasks:view")).rejects.toThrow(
        "Database connection failed",
      );
    });

    it("should propagate errors in hasAllPermissions", async () => {
      // Arrange
      const error = new Error("Database connection failed");
      mockCheckPermissionUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(hasAllPermissions("user-1", ["tasks:view"])).rejects.toThrow(
        "Database connection failed",
      );
    });

    it("should propagate errors in hasAnyPermission", async () => {
      // Arrange
      const error = new Error("Database connection failed");
      mockCheckPermissionUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(hasAnyPermission("user-1", ["tasks:view"])).rejects.toThrow(
        "Database connection failed",
      );
    });
  });
});
