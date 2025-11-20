/**
 * Audit Log Controller - Unit Tests
 *
 * Tests for audit log server actions including:
 * - List audit logs with filtering and pagination
 * - Get unique action types
 * - Get unique entity types
 * - Export audit logs
 * - Error handling
 * - Permission checks
 * - Response formatting
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  listAuditLogsAction,
  getAuditLogActionsAction,
  getAuditLogEntityTypesAction,
  exportAuditLogsAction,
} from "../audit-log.controller";
import type { AuditLog } from "@/core/domain/entities/audit-log.entity";

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
const mockListAuditLogsUseCase = {
  execute: vi.fn(),
};

const mockCountAuditLogsUseCase = {
  execute: vi.fn(),
};

// Mock requirePermission
const mockRequirePermission = vi.fn();
vi.mock("@/lib/permissions/server", () => ({
  requirePermission: () => mockRequirePermission(),
}));

// Mock the DI container
vi.mock("@/di/container", () => ({
  getContainer: vi.fn(() => ({
    get: vi.fn((token) => {
      const tokenKey = token.toString();
      if (tokenKey === Symbol.for("ListAuditLogsUseCase").toString()) {
        return mockListAuditLogsUseCase;
      }
      if (tokenKey === Symbol.for("CountAuditLogsUseCase").toString()) {
        return mockCountAuditLogsUseCase;
      }
      if (tokenKey === Symbol.for("ILoggerService").toString()) {
        return mockLogger;
      }
      return null;
    }),
  })),
}));

describe("Audit Log Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
  });

  // Sample audit log data
  const createMockAuditLog = (overrides?: Partial<AuditLog>): AuditLog =>
    ({
      id: "audit-1",
      userId: "user-123",
      action: "user:login",
      entityType: "User",
      entityId: "user-123",
      changes: undefined,
      metadata: undefined,
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      ...overrides,
    }) as AuditLog;

  describe("listAuditLogsAction", () => {
    it("should list audit logs with pagination", async () => {
      // Arrange
      const mockLogs = [
        createMockAuditLog(),
        createMockAuditLog({ id: "audit-2" }),
      ];
      mockListAuditLogsUseCase.execute.mockResolvedValue(mockLogs);
      mockCountAuditLogsUseCase.execute.mockResolvedValue(2);

      // Act
      const result = await listAuditLogsAction({
        page: 1,
        pageSize: 10,
      });

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data).toHaveLength(2);
        expect(result.data.total).toBe(2);
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(10);
        expect(result.data.totalPages).toBe(1);
      }
    });

    it("should filter by userId", async () => {
      // Arrange
      const mockLogs = [createMockAuditLog()];
      mockListAuditLogsUseCase.execute.mockResolvedValue(mockLogs);
      mockCountAuditLogsUseCase.execute.mockResolvedValue(1);

      // Act
      const result = await listAuditLogsAction({
        userId: "user-123",
        page: 1,
        pageSize: 10,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(mockListAuditLogsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-123",
        }),
      );
    });

    it("should filter by action", async () => {
      // Arrange
      const mockLogs = [createMockAuditLog()];
      mockListAuditLogsUseCase.execute.mockResolvedValue(mockLogs);
      mockCountAuditLogsUseCase.execute.mockResolvedValue(1);

      // Act
      const result = await listAuditLogsAction({
        action: "user:login",
        page: 1,
        pageSize: 10,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(mockListAuditLogsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "user:login",
        }),
      );
    });

    it("should filter by entityType", async () => {
      // Arrange
      const mockLogs = [createMockAuditLog()];
      mockListAuditLogsUseCase.execute.mockResolvedValue(mockLogs);
      mockCountAuditLogsUseCase.execute.mockResolvedValue(1);

      // Act
      const result = await listAuditLogsAction({
        entityType: "User",
        page: 1,
        pageSize: 10,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(mockListAuditLogsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: "User",
        }),
      );
    });

    it("should filter by date range", async () => {
      // Arrange
      const mockLogs = [createMockAuditLog()];
      mockListAuditLogsUseCase.execute.mockResolvedValue(mockLogs);
      mockCountAuditLogsUseCase.execute.mockResolvedValue(1);

      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      // Act
      const result = await listAuditLogsAction({
        startDate,
        endDate,
        page: 1,
        pageSize: 10,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(mockListAuditLogsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        }),
      );
    });

    it("should calculate pagination correctly", async () => {
      // Arrange
      const mockLogs = Array(5)
        .fill(null)
        .map((_, i) => createMockAuditLog({ id: `audit-${i}` }));
      mockListAuditLogsUseCase.execute.mockResolvedValue(mockLogs);
      mockCountAuditLogsUseCase.execute.mockResolvedValue(25);

      // Act
      const result = await listAuditLogsAction({
        page: 2,
        pageSize: 5,
      });

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalPages).toBe(5);
        expect(mockListAuditLogsUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            limit: 5,
            offset: 5, // page 2, offset = (2-1) * 5
          }),
        );
      }
    });

    it("should use default pagination values", async () => {
      // Arrange
      mockListAuditLogsUseCase.execute.mockResolvedValue([]);
      mockCountAuditLogsUseCase.execute.mockResolvedValue(0);

      // Act
      const result = await listAuditLogsAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(10);
      }
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockListAuditLogsUseCase.execute.mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const result = await listAuditLogsAction();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database error");
      }
    });

    it("should execute list and count in parallel", async () => {
      // Arrange
      mockListAuditLogsUseCase.execute.mockResolvedValue([]);
      mockCountAuditLogsUseCase.execute.mockResolvedValue(0);

      // Act
      await listAuditLogsAction();

      // Assert
      expect(mockListAuditLogsUseCase.execute).toHaveBeenCalled();
      expect(mockCountAuditLogsUseCase.execute).toHaveBeenCalled();
    });
  });

  describe("getAuditLogActionsAction", () => {
    it("should return unique action types", async () => {
      // Arrange
      const mockLogs = [
        createMockAuditLog({ action: "user:login" }),
        createMockAuditLog({ action: "user:logout" }),
        createMockAuditLog({ action: "user:login" }), // Duplicate
        createMockAuditLog({ action: "role:create" }),
      ];
      mockListAuditLogsUseCase.execute.mockResolvedValue(mockLogs);

      // Act
      const result = await getAuditLogActionsAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(3);
        expect(result.data).toContain("user:login");
        expect(result.data).toContain("user:logout");
        expect(result.data).toContain("role:create");
        // Should be sorted
        expect(result.data).toEqual(result.data.slice().sort());
      }
    });

    it("should fetch logs with limit for extraction", async () => {
      // Arrange
      mockListAuditLogsUseCase.execute.mockResolvedValue([]);

      // Act
      await getAuditLogActionsAction();

      // Assert
      expect(mockListAuditLogsUseCase.execute).toHaveBeenCalledWith({
        limit: 1000,
      });
    });

    it("should return empty array when no logs exist", async () => {
      // Arrange
      mockListAuditLogsUseCase.execute.mockResolvedValue([]);

      // Act
      const result = await getAuditLogActionsAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockListAuditLogsUseCase.execute.mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const result = await getAuditLogActionsAction();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database error");
      }
    });
  });

  describe("getAuditLogEntityTypesAction", () => {
    it("should return unique entity types", async () => {
      // Arrange
      const mockLogs = [
        createMockAuditLog({ entityType: "User" }),
        createMockAuditLog({ entityType: "Role" }),
        createMockAuditLog({ entityType: "User" }), // Duplicate
        createMockAuditLog({ entityType: "Permission" }),
      ];
      mockListAuditLogsUseCase.execute.mockResolvedValue(mockLogs);

      // Act
      const result = await getAuditLogEntityTypesAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(3);
        expect(result.data).toContain("User");
        expect(result.data).toContain("Role");
        expect(result.data).toContain("Permission");
        // Should be sorted
        expect(result.data).toEqual(result.data.slice().sort());
      }
    });

    it("should fetch logs with limit for extraction", async () => {
      // Arrange
      mockListAuditLogsUseCase.execute.mockResolvedValue([]);

      // Act
      await getAuditLogEntityTypesAction();

      // Assert
      expect(mockListAuditLogsUseCase.execute).toHaveBeenCalledWith({
        limit: 1000,
      });
    });

    it("should return empty array when no logs exist", async () => {
      // Arrange
      mockListAuditLogsUseCase.execute.mockResolvedValue([]);

      // Act
      const result = await getAuditLogEntityTypesAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockListAuditLogsUseCase.execute.mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const result = await getAuditLogEntityTypesAction();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database error");
      }
    });
  });

  describe("exportAuditLogsAction", () => {
    it("should export audit logs without pagination", async () => {
      // Arrange
      const mockLogs = [
        createMockAuditLog(),
        createMockAuditLog({ id: "audit-2" }),
      ];
      mockListAuditLogsUseCase.execute.mockResolvedValue(mockLogs);

      // Act
      const result = await exportAuditLogsAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
      // Should not have limit/offset for export
      expect(mockListAuditLogsUseCase.execute).toHaveBeenCalledWith(
        expect.not.objectContaining({
          limit: expect.anything(),
          offset: expect.anything(),
        }),
      );
    });

    it("should export with filters applied", async () => {
      // Arrange
      const mockLogs = [createMockAuditLog()];
      mockListAuditLogsUseCase.execute.mockResolvedValue(mockLogs);

      // Act
      const result = await exportAuditLogsAction({
        userId: "user-123",
        action: "user:login",
        entityType: "User",
        page: 1,
        pageSize: 10,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(mockListAuditLogsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-123",
          action: "user:login",
          entityType: "User",
        }),
      );
    });

    it("should export with date range filter", async () => {
      // Arrange
      const mockLogs = [createMockAuditLog()];
      mockListAuditLogsUseCase.execute.mockResolvedValue(mockLogs);

      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      // Act
      const result = await exportAuditLogsAction({
        startDate,
        endDate,
        page: 1,
        pageSize: 10,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(mockListAuditLogsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        }),
      );
    });

    it("should return all matching records for export", async () => {
      // Arrange
      const mockLogs = Array(100)
        .fill(null)
        .map((_, i) => createMockAuditLog({ id: `audit-${i}` }));
      mockListAuditLogsUseCase.execute.mockResolvedValue(mockLogs);

      // Act
      const result = await exportAuditLogsAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(100);
      }
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockListAuditLogsUseCase.execute.mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const result = await exportAuditLogsAction();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database error");
      }
    });
  });

  describe("error handling", () => {
    it("should handle validation errors", async () => {
      // Act
      const result = await listAuditLogsAction({
        page: -1, // Invalid page number
        pageSize: 10,
      });

      // Assert
      expect(result.success).toBe(false);
    });

    it("should handle use case errors", async () => {
      // Arrange
      mockListAuditLogsUseCase.execute.mockRejectedValue(
        new Error("Use case error"),
      );

      // Act
      const result = await listAuditLogsAction();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Use case error");
      }
    });
  });

  describe("response format", () => {
    it("should return discriminated union with success=true", async () => {
      // Arrange
      mockListAuditLogsUseCase.execute.mockResolvedValue([]);
      mockCountAuditLogsUseCase.execute.mockResolvedValue(0);

      // Act
      const result = await listAuditLogsAction();

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
      mockListAuditLogsUseCase.execute.mockRejectedValue(
        new Error("Test error"),
      );

      // Act
      const result = await listAuditLogsAction();

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
