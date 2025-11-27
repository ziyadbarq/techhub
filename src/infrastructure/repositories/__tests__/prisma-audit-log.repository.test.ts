/**
 * PrismaAuditLogRepository - Unit Tests
 *
 * Tests for the PrismaAuditLogRepository including:
 * - Create audit log entries
 * - Find with flexible filters (user, action, entity, date range)
 * - Find by user ID
 * - Find by entity
 * - Find by action
 * - Count operations
 * - Delete old logs
 * - Data transformation (toDomain)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { PrismaClient } from "@/generated/prisma/server";
import type { AuditLog as PrismaAuditLog } from "@/generated/prisma";
import { PrismaAuditLogRepository } from "../prisma-audit-log.repository";
import type {
  CreateAuditLogParams,
  FindAuditLogsParams,
} from "@/core/repositories/audit-log-repository.interface";

/**
 * Mock PrismaClient
 */
function createMockPrismaClient(): PrismaClient {
  return {
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
      findFirst: vi.fn(),
    },
  } as unknown as PrismaClient;
}

describe("PrismaAuditLogRepository", () => {
  let repository: PrismaAuditLogRepository;
  let mockPrisma: PrismaClient;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    repository = new PrismaAuditLogRepository(mockPrisma);
  });

  describe("create", () => {
    it("should create a new audit log entry with all fields", async () => {
      // Arrange
      const params: CreateAuditLogParams = {
        userId: "user-1",
        action: "task:create",
        entityType: "task",
        entityId: "task-1",
        changes: { title: "New Task" },
        metadata: { source: "api" },
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
      };

      const mockAuditLog: PrismaAuditLog = {
        id: "audit-1",
        userId: params.userId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        changes: (params.changes ?? null) as never,
        metadata: (params.metadata ?? null) as never,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        createdAt: new Date(),
      };

      vi.mocked(mockPrisma.auditLog.create).mockResolvedValue(mockAuditLog);

      // Act
      const result = await repository.create(params);

      // Assert
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: params.userId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        }),
      });

      expect(result).toEqual({
        id: mockAuditLog.id,
        userId: mockAuditLog.userId,
        action: mockAuditLog.action,
        entityType: mockAuditLog.entityType,
        entityId: mockAuditLog.entityId,
        changes: mockAuditLog.changes,
        metadata: mockAuditLog.metadata,
        ipAddress: mockAuditLog.ipAddress,
        userAgent: mockAuditLog.userAgent,
        createdAt: mockAuditLog.createdAt,
      });
    });

    it("should create audit log without optional fields", async () => {
      // Arrange
      const params: CreateAuditLogParams = {
        action: "user:login",
        entityType: "user",
      };

      const mockAuditLog: PrismaAuditLog = {
        id: "audit-1",
        userId: null,
        action: params.action,
        entityType: params.entityType,
        entityId: null,
        changes: null,
        metadata: null,
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
      };

      vi.mocked(mockPrisma.auditLog.create).mockResolvedValue(mockAuditLog);

      // Act
      const result = await repository.create(params);

      // Assert
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: params.action,
          entityType: params.entityType,
        }),
      });

      expect(result.userId).toBeUndefined();
      expect(result.entityId).toBeUndefined();
      expect(result.changes).toBeUndefined();
      expect(result.metadata).toBeUndefined();
      expect(result.ipAddress).toBeUndefined();
      expect(result.userAgent).toBeUndefined();
    });

    it("should handle database errors during create", async () => {
      // Arrange
      const params: CreateAuditLogParams = {
        action: "task:create",
        entityType: "task",
      };

      const error = new Error("Database error");
      vi.mocked(mockPrisma.auditLog.create).mockRejectedValue(error);

      // Act & Assert
      await expect(repository.create(params)).rejects.toThrow("Database error");
    });
  });

  describe("find", () => {
    it("should find audit logs with userId filter", async () => {
      // Arrange
      const params: FindAuditLogsParams = {
        userId: "user-1",
        limit: 10,
        offset: 0,
      };

      const mockLogs: PrismaAuditLog[] = [
        {
          id: "audit-1",
          userId: "user-1",
          action: "task:create",
          entityType: "task",
          entityId: "task-1",
          changes: null,
          metadata: null,
          ipAddress: null,
          userAgent: null,
          createdAt: new Date(),
        },
      ];

      vi.mocked(mockPrisma.auditLog.findMany).mockResolvedValue(mockLogs);

      // Act
      const result = await repository.find(params);

      // Assert
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        orderBy: { createdAt: "desc" },
        take: 10,
        skip: 0,
      });

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe("user-1");
    });

    it("should find audit logs with action filter", async () => {
      // Arrange
      const params: FindAuditLogsParams = {
        action: "task:create",
        limit: 10,
        offset: 0,
      };

      vi.mocked(mockPrisma.auditLog.findMany).mockResolvedValue([]);

      // Act
      await repository.find(params);

      // Assert
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { action: "task:create" },
        orderBy: { createdAt: "desc" },
        take: 10,
        skip: 0,
      });
    });

    it("should find audit logs with entityType and entityId filter", async () => {
      // Arrange
      const params: FindAuditLogsParams = {
        entityType: "task",
        entityId: "task-1",
        limit: 10,
        offset: 0,
      };

      vi.mocked(mockPrisma.auditLog.findMany).mockResolvedValue([]);

      // Act
      await repository.find(params);

      // Assert
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          entityType: "task",
          entityId: "task-1",
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        skip: 0,
      });
    });

    it("should find audit logs with date range filter", async () => {
      // Arrange
      const startDate = new Date("2025-01-01");
      const endDate = new Date("2025-12-31");
      const params: FindAuditLogsParams = {
        startDate,
        endDate,
        limit: 10,
        offset: 0,
      };

      vi.mocked(mockPrisma.auditLog.findMany).mockResolvedValue([]);

      // Act
      await repository.find(params);

      // Assert
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        skip: 0,
      });
    });

    it("should find audit logs with only startDate", async () => {
      // Arrange
      const startDate = new Date("2025-01-01");
      const params: FindAuditLogsParams = {
        startDate,
        limit: 10,
        offset: 0,
      };

      vi.mocked(mockPrisma.auditLog.findMany).mockResolvedValue([]);

      // Act
      await repository.find(params);

      // Assert
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        skip: 0,
      });
    });

    it("should find audit logs with combined filters", async () => {
      // Arrange
      const params: FindAuditLogsParams = {
        userId: "user-1",
        action: "task:update",
        entityType: "task",
        startDate: new Date("2025-01-01"),
        limit: 10,
        offset: 0,
      };

      vi.mocked(mockPrisma.auditLog.findMany).mockResolvedValue([]);

      // Act
      await repository.find(params);

      // Assert
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          userId: "user-1",
          action: "task:update",
          entityType: "task",
          createdAt: {
            gte: params.startDate,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        skip: 0,
      });
    });

    it("should handle empty result set", async () => {
      // Arrange
      const params: FindAuditLogsParams = {
        userId: "non-existent",
        limit: 10,
        offset: 0,
      };

      vi.mocked(mockPrisma.auditLog.findMany).mockResolvedValue([]);

      // Act
      const result = await repository.find(params);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("findByUserId", () => {
    it("should find audit logs by user ID", async () => {
      // Arrange
      const userId = "user-1";
      const mockLogs: PrismaAuditLog[] = [
        {
          id: "audit-1",
          userId,
          action: "task:create",
          entityType: "task",
          entityId: null,
          changes: null,
          metadata: null,
          ipAddress: null,
          userAgent: null,
          createdAt: new Date(),
        },
      ];

      vi.mocked(mockPrisma.auditLog.findMany).mockResolvedValue(mockLogs);

      // Act
      const result = await repository.findByUserId(userId, 10, 0);

      // Assert
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        skip: 0,
      });

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(userId);
    });

    it("should find audit logs without pagination", async () => {
      // Arrange
      const userId = "user-1";
      vi.mocked(mockPrisma.auditLog.findMany).mockResolvedValue([]);

      // Act
      await repository.findByUserId(userId);

      // Assert
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: undefined,
        skip: undefined,
      });
    });
  });

  describe("findByEntity", () => {
    it("should find audit logs by entity type and ID", async () => {
      // Arrange
      const entityType = "task";
      const entityId = "task-1";
      const mockLogs: PrismaAuditLog[] = [
        {
          id: "audit-1",
          userId: null,
          action: "task:create",
          entityType,
          entityId,
          changes: null,
          metadata: null,
          ipAddress: null,
          userAgent: null,
          createdAt: new Date(),
        },
      ];

      vi.mocked(mockPrisma.auditLog.findMany).mockResolvedValue(mockLogs);

      // Act
      const result = await repository.findByEntity(entityType, entityId);

      // Assert
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { entityType, entityId },
        orderBy: { createdAt: "desc" },
      });

      expect(result).toHaveLength(1);
      expect(result[0].entityType).toBe(entityType);
      expect(result[0].entityId).toBe(entityId);
    });
  });

  describe("findByAction", () => {
    it("should find audit logs by action", async () => {
      // Arrange
      const action = "task:create";
      const mockLogs: PrismaAuditLog[] = [
        {
          id: "audit-1",
          userId: null,
          action,
          entityType: "task",
          entityId: null,
          changes: null,
          metadata: null,
          ipAddress: null,
          userAgent: null,
          createdAt: new Date(),
        },
      ];

      vi.mocked(mockPrisma.auditLog.findMany).mockResolvedValue(mockLogs);

      // Act
      const result = await repository.findByAction(action, 10, 0);

      // Assert
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { action },
        orderBy: { createdAt: "desc" },
        take: 10,
        skip: 0,
      });

      expect(result).toHaveLength(1);
      expect(result[0].action).toBe(action);
    });
  });

  describe("count", () => {
    it("should count all audit logs without filters", async () => {
      // Arrange
      vi.mocked(mockPrisma.auditLog.count).mockResolvedValue(42);

      // Act
      const result = await repository.count();

      // Assert
      expect(mockPrisma.auditLog.count).toHaveBeenCalledWith({
        where: undefined,
      });
      expect(result).toBe(42);
    });

    it("should count audit logs with filters", async () => {
      // Arrange
      const params: FindAuditLogsParams = {
        userId: "user-1",
        action: "task:create",
        limit: 10,
        offset: 0,
      };

      vi.mocked(mockPrisma.auditLog.count).mockResolvedValue(5);

      // Act
      const result = await repository.count(params);

      // Assert
      expect(mockPrisma.auditLog.count).toHaveBeenCalledWith({
        where: {
          userId: "user-1",
          action: "task:create",
        },
      });
      expect(result).toBe(5);
    });

    it("should count audit logs with date range", async () => {
      // Arrange
      const params: FindAuditLogsParams = {
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
        limit: 10,
        offset: 0,
      };

      vi.mocked(mockPrisma.auditLog.count).mockResolvedValue(10);

      // Act
      const result = await repository.count(params);

      // Assert
      expect(mockPrisma.auditLog.count).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: params.startDate,
            lte: params.endDate,
          },
        },
      });
      expect(result).toBe(10);
    });
  });

  describe("deleteOlderThan", () => {
    it("should delete audit logs older than specified date", async () => {
      // Arrange
      const date = new Date("2025-01-01");
      vi.mocked(mockPrisma.auditLog.deleteMany).mockResolvedValue({
        count: 15,
      });

      // Act
      const result = await repository.deleteOlderThan(date);

      // Assert
      expect(mockPrisma.auditLog.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            lt: date,
          },
        },
      });
      expect(result).toBe(15);
    });

    it("should return 0 when no logs are deleted", async () => {
      // Arrange
      const date = new Date("2025-01-01");
      vi.mocked(mockPrisma.auditLog.deleteMany).mockResolvedValue({ count: 0 });

      // Act
      const result = await repository.deleteOlderThan(date);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe("toDomain transformation", () => {
    it("should transform Prisma model with all fields to domain entity", async () => {
      // Arrange
      const mockAuditLog: PrismaAuditLog = {
        id: "audit-1",
        userId: "user-1",
        action: "task:create",
        entityType: "task",
        entityId: "task-1",
        changes: { title: "New Task" },
        metadata: { source: "api" },
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
        createdAt: new Date("2025-01-15"),
      };

      vi.mocked(mockPrisma.auditLog.create).mockResolvedValue(mockAuditLog);

      // Act
      const result = await repository.create({
        action: "task:create",
        entityType: "task",
      });

      // Assert
      expect(result).toEqual({
        id: mockAuditLog.id,
        userId: mockAuditLog.userId,
        action: mockAuditLog.action,
        entityType: mockAuditLog.entityType,
        entityId: mockAuditLog.entityId,
        changes: mockAuditLog.changes,
        metadata: mockAuditLog.metadata,
        ipAddress: mockAuditLog.ipAddress,
        userAgent: mockAuditLog.userAgent,
        createdAt: mockAuditLog.createdAt,
      });
    });

    it("should transform Prisma model with null fields to undefined", async () => {
      // Arrange
      const mockAuditLog: PrismaAuditLog = {
        id: "audit-1",
        userId: null,
        action: "user:login",
        entityType: "user",
        entityId: null,
        changes: null,
        metadata: null,
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
      };

      vi.mocked(mockPrisma.auditLog.create).mockResolvedValue(mockAuditLog);

      // Act
      const result = await repository.create({
        action: "user:login",
        entityType: "user",
      });

      // Assert
      expect(result.userId).toBeUndefined();
      expect(result.entityId).toBeUndefined();
      expect(result.changes).toBeUndefined();
      expect(result.metadata).toBeUndefined();
      expect(result.ipAddress).toBeUndefined();
      expect(result.userAgent).toBeUndefined();
    });

    it("should preserve complex JSON data in changes field", async () => {
      // Arrange
      const complexChanges = {
        before: { status: "pending", priority: 1 },
        after: { status: "completed", priority: 5 },
        fields: ["status", "priority"],
      };

      const mockAuditLog: PrismaAuditLog = {
        id: "audit-1",
        userId: "user-1",
        action: "task:update",
        entityType: "task",
        entityId: "task-1",
        changes: complexChanges,
        metadata: null,
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
      };

      vi.mocked(mockPrisma.auditLog.create).mockResolvedValue(mockAuditLog);

      // Act
      const result = await repository.create({
        action: "task:update",
        entityType: "task",
      });

      // Assert
      expect(result.changes).toEqual(complexChanges);
    });
  });

  describe("error handling", () => {
    it("should propagate errors from create operation", async () => {
      // Arrange
      const error = new Error("Connection timeout");
      vi.mocked(mockPrisma.auditLog.create).mockRejectedValue(error);

      // Act & Assert
      await expect(
        repository.create({
          action: "task:create",
          entityType: "task",
        }),
      ).rejects.toThrow("Connection timeout");
    });

    it("should propagate errors from find operation", async () => {
      // Arrange
      const error = new Error("Database unavailable");
      vi.mocked(mockPrisma.auditLog.findMany).mockRejectedValue(error);

      // Act & Assert
      await expect(
        repository.find({ userId: "user-1", limit: 10, offset: 0 }),
      ).rejects.toThrow("Database unavailable");
    });

    it("should propagate errors from count operation", async () => {
      // Arrange
      const error = new Error("Query timeout");
      vi.mocked(mockPrisma.auditLog.count).mockRejectedValue(error);

      // Act & Assert
      await expect(repository.count()).rejects.toThrow("Query timeout");
    });

    it("should propagate errors from deleteOlderThan operation", async () => {
      // Arrange
      const error = new Error("Permission denied");
      vi.mocked(mockPrisma.auditLog.deleteMany).mockRejectedValue(error);

      // Act & Assert
      await expect(repository.deleteOlderThan(new Date())).rejects.toThrow(
        "Permission denied",
      );
    });
  });
});
