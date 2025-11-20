/**
 * Setup Controller - Unit Tests
 *
 * Tests for setup server actions including:
 * - Check first admin status
 * - Assign first admin role
 * - Error handling
 * - Authentication checks
 * - Response formatting
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  checkFirstAdminAction,
  assignFirstAdminAction,
} from "../setup.controller";

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
const mockCheckFirstAdminUseCase = {
  execute: vi.fn(),
};

const mockAssignFirstAdminUseCase = {
  execute: vi.fn(),
};

// Mock getCurrentUserId
const mockGetCurrentUserId = vi.fn();
vi.mock("@/lib/auth/session", () => ({
  getCurrentUserId: () => mockGetCurrentUserId(),
}));

// Mock revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock the DI container
vi.mock("@/di/container", () => ({
  getContainer: vi.fn(() => ({
    get: vi.fn((token) => {
      const tokenKey = token.toString();
      if (tokenKey === Symbol.for("CheckFirstAdminUseCase").toString()) {
        return mockCheckFirstAdminUseCase;
      }
      if (tokenKey === Symbol.for("AssignFirstAdminUseCase").toString()) {
        return mockAssignFirstAdminUseCase;
      }
      if (tokenKey === Symbol.for("ILoggerService").toString()) {
        return mockLogger;
      }
      return null;
    }),
  })),
}));

describe("Setup Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkFirstAdminAction", () => {
    it("should return hasAdmin=false when no admin exists", async () => {
      // Arrange
      mockCheckFirstAdminUseCase.execute.mockResolvedValue({
        hasAdmin: false,
        adminRoleId: null,
      });

      // Act
      const result = await checkFirstAdminAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hasAdmin).toBe(false);
        expect(result.data.adminRoleId).toBe(null);
      }
    });

    it("should return hasAdmin=true when admin exists", async () => {
      // Arrange
      mockCheckFirstAdminUseCase.execute.mockResolvedValue({
        hasAdmin: true,
        adminRoleId: "admin-role-id",
      });

      // Act
      const result = await checkFirstAdminAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hasAdmin).toBe(true);
        expect(result.data.adminRoleId).toBe("admin-role-id");
      }
    });

    it("should call use case without parameters", async () => {
      // Arrange
      mockCheckFirstAdminUseCase.execute.mockResolvedValue({
        hasAdmin: true,
        adminRoleId: "admin-role-id",
      });

      // Act
      await checkFirstAdminAction();

      // Assert
      expect(mockCheckFirstAdminUseCase.execute).toHaveBeenCalledWith();
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockCheckFirstAdminUseCase.execute.mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const result = await checkFirstAdminAction();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database error");
      }
    });

    it("should handle unexpected errors gracefully", async () => {
      // Arrange
      mockCheckFirstAdminUseCase.execute.mockRejectedValue(
        new Error("Unexpected error"),
      );

      // Act
      const result = await checkFirstAdminAction();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe("assignFirstAdminAction", () => {
    it("should assign admin role successfully", async () => {
      // Arrange
      mockGetCurrentUserId.mockResolvedValue("user-123");
      mockAssignFirstAdminUseCase.execute.mockResolvedValue({
        success: true,
        message: "Admin role assigned successfully",
      });

      // Act
      const result = await assignFirstAdminAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.success).toBe(true);
        expect(result.data.message).toBe("Admin role assigned successfully");
      }
    });

    it("should call use case with current user id", async () => {
      // Arrange
      mockGetCurrentUserId.mockResolvedValue("user-123");
      mockAssignFirstAdminUseCase.execute.mockResolvedValue({
        success: true,
        message: "Admin role assigned",
      });

      // Act
      await assignFirstAdminAction();

      // Assert
      expect(mockAssignFirstAdminUseCase.execute).toHaveBeenCalledWith({
        userId: "user-123",
        metadata: {},
      });
    });

    it("should return error when not authenticated", async () => {
      // Arrange
      mockGetCurrentUserId.mockResolvedValue(null);

      // Act
      const result = await assignFirstAdminAction();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Not authenticated");
      }
    });

    it("should return error when use case returns failure", async () => {
      // Arrange
      mockGetCurrentUserId.mockResolvedValue("user-123");
      mockAssignFirstAdminUseCase.execute.mockResolvedValue({
        success: false,
        message: "Admin already exists",
      });

      // Act
      const result = await assignFirstAdminAction();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Admin already exists");
      }
    });

    it("should handle success result correctly", async () => {
      // Arrange
      mockGetCurrentUserId.mockResolvedValue("user-123");
      mockAssignFirstAdminUseCase.execute.mockResolvedValue({
        success: true,
        message: "Success",
      });

      // Act
      const result = await assignFirstAdminAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty("success", true);
        expect(result.data).toHaveProperty("message", "Success");
      }
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockGetCurrentUserId.mockResolvedValue("user-123");
      mockAssignFirstAdminUseCase.execute.mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const result = await assignFirstAdminAction();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database error");
      }
    });

    it("should handle role assignment failure", async () => {
      // Arrange
      mockGetCurrentUserId.mockResolvedValue("user-123");
      mockAssignFirstAdminUseCase.execute.mockResolvedValue({
        success: false,
        message: "Setup already completed",
      });

      // Act
      const result = await assignFirstAdminAction();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Setup already completed");
      }
    });

    it("should pass metadata object to use case", async () => {
      // Arrange
      mockGetCurrentUserId.mockResolvedValue("user-123");
      mockAssignFirstAdminUseCase.execute.mockResolvedValue({
        success: true,
        message: "Success",
      });

      // Act
      await assignFirstAdminAction();

      // Assert
      expect(mockAssignFirstAdminUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.any(Object),
        }),
      );
    });
  });

  describe("error handling", () => {
    it("should handle authentication errors", async () => {
      // Arrange
      mockGetCurrentUserId.mockResolvedValue(null);

      // Act
      const result = await assignFirstAdminAction();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Not authenticated");
      }
    });

    it("should handle use case errors", async () => {
      // Arrange
      mockGetCurrentUserId.mockResolvedValue("user-123");
      mockAssignFirstAdminUseCase.execute.mockRejectedValue(
        new Error("Role not found"),
      );

      // Act
      const result = await assignFirstAdminAction();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Role not found");
      }
    });

    it("should handle database connection errors", async () => {
      // Arrange
      mockCheckFirstAdminUseCase.execute.mockRejectedValue(
        new Error("Connection timeout"),
      );

      // Act
      const result = await checkFirstAdminAction();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Connection timeout");
      }
    });
  });

  describe("response format", () => {
    it("should return discriminated union with success=true for check", async () => {
      // Arrange
      mockCheckFirstAdminUseCase.execute.mockResolvedValue({
        hasAdmin: true,
        adminRoleId: "admin-role-id",
      });

      // Act
      const result = await checkFirstAdminAction();

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
      mockCheckFirstAdminUseCase.execute.mockRejectedValue(
        new Error("Test error"),
      );

      // Act
      const result = await checkFirstAdminAction();

      // Assert
      expect(result).toHaveProperty("success");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result).toHaveProperty("error");
        expect(result).not.toHaveProperty("data");
      }
    });

    it("should return discriminated union with success=true for assign", async () => {
      // Arrange
      mockGetCurrentUserId.mockResolvedValue("user-123");
      mockAssignFirstAdminUseCase.execute.mockResolvedValue({
        success: true,
        message: "Success",
      });

      // Act
      const result = await assignFirstAdminAction();

      // Assert
      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result).toHaveProperty("data");
        expect(result).not.toHaveProperty("error");
      }
    });

    it("should return discriminated union with success=false when assignment fails", async () => {
      // Arrange
      mockGetCurrentUserId.mockResolvedValue("user-123");
      mockAssignFirstAdminUseCase.execute.mockResolvedValue({
        success: false,
        message: "Failed",
      });

      // Act
      const result = await assignFirstAdminAction();

      // Assert
      expect(result).toHaveProperty("success");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result).toHaveProperty("error");
        expect(result).not.toHaveProperty("data");
      }
    });
  });

  describe("integration scenarios", () => {
    it("should handle first user setup flow", async () => {
      // Arrange - Check shows setup needed
      mockCheckFirstAdminUseCase.execute.mockResolvedValue({
        hasAdmin: false,
        adminRoleId: null,
      });

      // Act - Check status
      const checkResult = await checkFirstAdminAction();

      // Assert - Setup needed
      expect(checkResult.success).toBe(true);
      if (checkResult.success) {
        expect(checkResult.data.hasAdmin).toBe(false);
      }

      // Arrange - Assign admin role
      mockGetCurrentUserId.mockResolvedValue("user-123");
      mockAssignFirstAdminUseCase.execute.mockResolvedValue({
        success: true,
        message: "Admin role assigned",
      });

      // Act - Assign first admin
      const assignResult = await assignFirstAdminAction();

      // Assert - Admin assigned successfully
      expect(assignResult.success).toBe(true);
    });

    it("should prevent duplicate admin assignment", async () => {
      // Arrange
      mockGetCurrentUserId.mockResolvedValue("user-123");
      mockAssignFirstAdminUseCase.execute.mockResolvedValue({
        success: false,
        message: "Admin role already assigned",
      });

      // Act
      const result = await assignFirstAdminAction();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Admin role already assigned");
      }
    });
  });
});
