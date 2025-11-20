/**
 * RBAC Controller - Integration Tests
 *
 * Tests for RBAC server actions including:
 * - Permission checking
 * - User permissions retrieval
 * - Error handling
 * - Response formatting
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  checkPermissionAction,
  getMyPermissionsAction,
  getUserPermissionsAction,
} from "../rbac.controller";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";

// Mock logger service
const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  startTimer: vi.fn(() => ({ startTime: Date.now() })),
  endTimer: vi.fn(),
};

// Mock use cases
const mockCheckPermissionUseCase = {
  execute: vi.fn(),
};

const mockGetUserPermissionsUseCase = {
  execute: vi.fn(),
};

// Mock the DI container
vi.mock("@/di/container", () => ({
  getContainer: vi.fn(() => ({
    get: vi.fn((token) => {
      const tokenKey = token.toString();
      if (tokenKey === Symbol.for("CheckPermissionUseCase").toString()) {
        return mockCheckPermissionUseCase;
      }
      if (tokenKey === Symbol.for("GetUserPermissionsUseCase").toString()) {
        return mockGetUserPermissionsUseCase;
      }
      if (tokenKey === Symbol.for("ILoggerService").toString()) {
        return mockLogger;
      }
      return null;
    }),
  })),
}));

describe("RBAC Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkPermissionAction", () => {
    it("should return success with hasPermission true when user has permission", async () => {
      // Arrange
      mockCheckPermissionUseCase.execute.mockResolvedValue(true);

      // Act
      const result = await checkPermissionAction("tasks:view");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hasPermission).toBe(true);
        expect(result.data.permission).toBe("tasks:view");
      }
    });

    it("should return success with hasPermission false when user lacks permission", async () => {
      // Arrange
      mockCheckPermissionUseCase.execute.mockResolvedValue(false);

      // Act
      const result = await checkPermissionAction("tasks:delete");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hasPermission).toBe(false);
      }
    });

    it("should call CheckPermissionUseCase with correct parameters", async () => {
      // Arrange
      mockCheckPermissionUseCase.execute.mockResolvedValue(true);

      // Act
      await checkPermissionAction("tasks:view");

      // Assert
      expect(mockCheckPermissionUseCase.execute).toHaveBeenCalledWith({
        userId: "system", // Mock user ID from requireAuth
        permission: "tasks:view",
      });
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockCheckPermissionUseCase.execute.mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const result = await checkPermissionAction("tasks:view");

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database error");
      }
    });
  });

  describe("getMyPermissionsAction", () => {
    it("should return user permissions successfully", async () => {
      // Arrange
      const mockPermissions: PermissionKey[] = [
        "tasks:view",
        "tasks:create",
        "tasks:update",
      ];

      mockGetUserPermissionsUseCase.execute.mockResolvedValue({
        userId: "system",
        permissions: mockPermissions,
        activeRoleCount: 2,
      });

      // Act
      const result = await getMyPermissionsAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.permissions).toEqual(mockPermissions);
        expect(result.data.activeRoleCount).toBe(2);
        expect(result.data.userId).toBe("system");
      }
    });

    it("should return empty permissions when user has no roles", async () => {
      // Arrange
      mockGetUserPermissionsUseCase.execute.mockResolvedValue({
        userId: "system",
        permissions: [],
        activeRoleCount: 0,
      });

      // Act
      const result = await getMyPermissionsAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.permissions).toEqual([]);
        expect(result.data.activeRoleCount).toBe(0);
      }
    });

    it("should call GetUserPermissionsUseCase with current user ID", async () => {
      // Arrange
      mockGetUserPermissionsUseCase.execute.mockResolvedValue({
        userId: "system",
        permissions: [],
        activeRoleCount: 0,
      });

      // Act
      await getMyPermissionsAction();

      // Assert
      expect(mockGetUserPermissionsUseCase.execute).toHaveBeenCalledWith({
        userId: "system",
      });
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockGetUserPermissionsUseCase.execute.mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const result = await getMyPermissionsAction();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database error");
      }
    });
  });

  describe("getUserPermissionsAction", () => {
    it("should return permissions for specified user", async () => {
      // Arrange
      const targetUserId = "user-123";
      const mockPermissions: PermissionKey[] = ["tasks:view", "tasks:create"];

      mockGetUserPermissionsUseCase.execute.mockResolvedValue({
        userId: targetUserId,
        permissions: mockPermissions,
        activeRoleCount: 1,
      });

      // Act
      const result = await getUserPermissionsAction(targetUserId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe(targetUserId);
        expect(result.data.permissions).toEqual(mockPermissions);
        expect(result.data.activeRoleCount).toBe(1);
      }
    });

    it("should call GetUserPermissionsUseCase with specified user ID", async () => {
      // Arrange
      const targetUserId = "user-123";
      mockGetUserPermissionsUseCase.execute.mockResolvedValue({
        userId: targetUserId,
        permissions: [],
        activeRoleCount: 0,
      });

      // Act
      await getUserPermissionsAction(targetUserId);

      // Assert
      expect(mockGetUserPermissionsUseCase.execute).toHaveBeenCalledWith({
        userId: targetUserId,
      });
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockGetUserPermissionsUseCase.execute.mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const result = await getUserPermissionsAction("user-123");

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database error");
      }
    });

    it("should handle different users independently", async () => {
      // Arrange
      mockGetUserPermissionsUseCase.execute
        .mockResolvedValueOnce({
          userId: "user-1",
          permissions: ["tasks:view"],
          activeRoleCount: 1,
        })
        .mockResolvedValueOnce({
          userId: "user-2",
          permissions: ["tasks:create", "tasks:update"],
          activeRoleCount: 2,
        });

      // Act
      const result1 = await getUserPermissionsAction("user-1");
      const result2 = await getUserPermissionsAction("user-2");

      // Assert
      expect(result1.success && result1.data.permissions).toHaveLength(1);
      expect(result2.success && result2.data.permissions).toHaveLength(2);
    });
  });

  describe("error handling", () => {
    it("should handle validation errors gracefully", async () => {
      // Arrange
      const validationError = new Error("Invalid permission format");
      validationError.name = "ValidationError";
      mockCheckPermissionUseCase.execute.mockRejectedValue(validationError);

      // Act
      const result = await checkPermissionAction(
        "invalid-permission" as PermissionKey,
      );

      // Assert
      expect(result.success).toBe(false);
    });

    it("should handle network/database errors", async () => {
      // Arrange
      mockGetUserPermissionsUseCase.execute.mockRejectedValue(
        new Error("Connection timeout"),
      );

      // Act
      const result = await getMyPermissionsAction();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it("should handle unexpected errors", async () => {
      // Arrange
      mockCheckPermissionUseCase.execute.mockRejectedValue(
        new Error("Unexpected error"),
      );

      // Act
      const result = await checkPermissionAction("tasks:view");

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe("response format", () => {
    it("should return discriminated union with success=true for successful operations", async () => {
      // Arrange
      mockCheckPermissionUseCase.execute.mockResolvedValue(true);

      // Act
      const result = await checkPermissionAction("tasks:view");

      // Assert
      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result).toHaveProperty("data");
        expect(result).not.toHaveProperty("error");
      }
    });

    it("should return discriminated union with success=false for errors", async () => {
      // Arrange
      mockCheckPermissionUseCase.execute.mockRejectedValue(
        new Error("Test error"),
      );

      // Act
      const result = await checkPermissionAction("tasks:view");

      // Assert
      expect(result).toHaveProperty("success");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result).toHaveProperty("error");
        expect(result).not.toHaveProperty("data");
      }
    });
  });
});
