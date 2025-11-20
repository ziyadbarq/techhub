/**
 * ListAuditLogsUseCase - Unit Tests
 *
 * Tests for the ListAuditLogsUseCase including:
 * - Listing all audit logs
 * - Filtering by user ID
 * - Filtering by action
 * - Filtering by entity type and ID
 * - Filtering by date range
 * - Pagination with limit and offset
 * - Multiple filter combinations
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ListAuditLogsUseCase } from "../list-audit-logs.use-case";
import type {
  IAuditLogRepository,
  FindAuditLogsParams,
  AuditLogEntry,
} from "@/core/repositories/audit-log-repository.interface";

/**
 * Mock AuditLog Repository
 */
class MockAuditLogRepository implements Partial<IAuditLogRepository> {
  private logs: AuditLogEntry[] = [];

  async find(params: FindAuditLogsParams): Promise<AuditLogEntry[]> {
    let result = [...this.logs];

    // Apply filters
    if (params.userId) {
      result = result.filter((log) => log.userId === params.userId);
    }

    if (params.action) {
      result = result.filter((log) => log.action === params.action);
    }

    if (params.entityType) {
      result = result.filter((log) => log.entityType === params.entityType);
    }

    if (params.entityId) {
      result = result.filter((log) => log.entityId === params.entityId);
    }

    if (params.startDate) {
      result = result.filter((log) => log.createdAt >= params.startDate!);
    }

    if (params.endDate) {
      result = result.filter((log) => log.createdAt <= params.endDate!);
    }

    // Sort by createdAt descending (most recent first)
    result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const offset = params.offset ?? 0;
    const limit = params.limit;

    if (limit !== undefined) {
      result = result.slice(offset, offset + limit);
    } else if (offset > 0) {
      result = result.slice(offset);
    }

    return result;
  }

  addLogs(logs: AuditLogEntry[]): void {
    this.logs.push(...logs);
  }

  clear(): void {
    this.logs = [];
  }
}

describe("ListAuditLogsUseCase", () => {
  let useCase: ListAuditLogsUseCase;
  let mockRepository: MockAuditLogRepository;

  beforeEach(() => {
    mockRepository = new MockAuditLogRepository();
    useCase = new ListAuditLogsUseCase(
      mockRepository as unknown as IAuditLogRepository,
    );
  });

  describe("execute - basic listing", () => {
    it("should return all audit logs when no filter provided", async () => {
      // Arrange
      const now = new Date();
      const logs: AuditLogEntry[] = [
        {
          id: "log-1",
          userId: "user-1",
          action: "CREATE",
          entityType: "Task",
          entityId: "task-1",
          createdAt: new Date(now.getTime() - 3000),
        },
        {
          id: "log-2",
          userId: "user-2",
          action: "UPDATE",
          entityType: "Task",
          entityId: "task-2",
          createdAt: new Date(now.getTime() - 2000),
        },
        {
          id: "log-3",
          userId: "user-1",
          action: "DELETE",
          entityType: "User",
          entityId: "user-3",
          createdAt: new Date(now.getTime() - 1000),
        },
      ];
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(3);
      // Should be sorted by createdAt descending (most recent first)
      expect(result[0].id).toBe("log-3");
      expect(result[1].id).toBe("log-2");
      expect(result[2].id).toBe("log-1");
    });

    it("should return empty array when no audit logs exist", async () => {
      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toEqual([]);
    });

    it("should return logs when called with empty params object", async () => {
      // Arrange
      const logs: AuditLogEntry[] = [
        {
          id: "log-1",
          action: "CREATE",
          entityType: "Task",
          createdAt: new Date(),
        },
      ];
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result).toHaveLength(1);
    });

    it("should return logs sorted by creation time (newest first)", async () => {
      // Arrange
      const baseTime = new Date("2024-01-01T00:00:00Z");
      const logs: AuditLogEntry[] = [
        {
          id: "log-1",
          action: "CREATE",
          entityType: "Task",
          createdAt: new Date(baseTime.getTime()),
        },
        {
          id: "log-2",
          action: "UPDATE",
          entityType: "Task",
          createdAt: new Date(baseTime.getTime() + 1000),
        },
        {
          id: "log-3",
          action: "DELETE",
          entityType: "Task",
          createdAt: new Date(baseTime.getTime() + 2000),
        },
      ];
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe("log-3"); // Newest
      expect(result[1].id).toBe("log-2");
      expect(result[2].id).toBe("log-1"); // Oldest
    });
  });

  describe("execute - filtering by user", () => {
    it("should return logs for specific user", async () => {
      // Arrange
      const logs: AuditLogEntry[] = [
        {
          id: "log-1",
          userId: "user-1",
          action: "CREATE",
          entityType: "Task",
          createdAt: new Date(),
        },
        {
          id: "log-2",
          userId: "user-1",
          action: "UPDATE",
          entityType: "Task",
          createdAt: new Date(),
        },
        {
          id: "log-3",
          userId: "user-2",
          action: "CREATE",
          entityType: "Task",
          createdAt: new Date(),
        },
      ];
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute({ userId: "user-1" });

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every((log) => log.userId === "user-1")).toBe(true);
    });

    it("should return empty array when no logs match user ID", async () => {
      // Arrange
      const logs: AuditLogEntry[] = [
        {
          id: "log-1",
          userId: "user-1",
          action: "CREATE",
          entityType: "Task",
          createdAt: new Date(),
        },
      ];
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute({ userId: "user-999" });

      // Assert
      expect(result).toEqual([]);
    });

    it("should not return logs without userId when filtering by user", async () => {
      // Arrange
      const logs: AuditLogEntry[] = [
        {
          id: "log-1",
          userId: "user-1",
          action: "CREATE",
          entityType: "Task",
          createdAt: new Date(),
        },
        {
          id: "log-2",
          action: "SYSTEM_ACTION",
          entityType: "Task",
          createdAt: new Date(),
        },
      ];
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute({ userId: "user-1" });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("log-1");
    });
  });

  describe("execute - filtering by action", () => {
    it("should return logs for specific action", async () => {
      // Arrange
      const logs: AuditLogEntry[] = [
        {
          id: "log-1",
          action: "CREATE",
          entityType: "Task",
          createdAt: new Date(),
        },
        {
          id: "log-2",
          action: "CREATE",
          entityType: "User",
          createdAt: new Date(),
        },
        {
          id: "log-3",
          action: "UPDATE",
          entityType: "Task",
          createdAt: new Date(),
        },
      ];
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute({ action: "CREATE" });

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every((log) => log.action === "CREATE")).toBe(true);
    });

    it("should handle case-sensitive action filtering", async () => {
      // Arrange
      const logs: AuditLogEntry[] = [
        {
          id: "log-1",
          action: "CREATE",
          entityType: "Task",
          createdAt: new Date(),
        },
        {
          id: "log-2",
          action: "create",
          entityType: "Task",
          createdAt: new Date(),
        },
      ];
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute({ action: "CREATE" });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].action).toBe("CREATE");
    });

    it("should return multiple logs with different entity types but same action", async () => {
      // Arrange
      const logs: AuditLogEntry[] = [
        {
          id: "log-1",
          action: "DELETE",
          entityType: "Task",
          createdAt: new Date(),
        },
        {
          id: "log-2",
          action: "DELETE",
          entityType: "User",
          createdAt: new Date(),
        },
        {
          id: "log-3",
          action: "DELETE",
          entityType: "Role",
          createdAt: new Date(),
        },
      ];
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute({ action: "DELETE" });

      // Assert
      expect(result).toHaveLength(3);
      expect(result.every((log) => log.action === "DELETE")).toBe(true);
    });
  });

  describe("execute - filtering by entity", () => {
    it("should return logs for specific entity type", async () => {
      // Arrange
      const logs: AuditLogEntry[] = [
        {
          id: "log-1",
          action: "CREATE",
          entityType: "Task",
          createdAt: new Date(),
        },
        {
          id: "log-2",
          action: "CREATE",
          entityType: "Task",
          createdAt: new Date(),
        },
        {
          id: "log-3",
          action: "CREATE",
          entityType: "User",
          createdAt: new Date(),
        },
      ];
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute({ entityType: "Task" });

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every((log) => log.entityType === "Task")).toBe(true);
    });

    it("should return logs for specific entity type and ID", async () => {
      // Arrange
      const logs: AuditLogEntry[] = [
        {
          id: "log-1",
          action: "CREATE",
          entityType: "Task",
          entityId: "task-1",
          createdAt: new Date(),
        },
        {
          id: "log-2",
          action: "UPDATE",
          entityType: "Task",
          entityId: "task-1",
          createdAt: new Date(),
        },
        {
          id: "log-3",
          action: "UPDATE",
          entityType: "Task",
          entityId: "task-2",
          createdAt: new Date(),
        },
      ];
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute({
        entityType: "Task",
        entityId: "task-1",
      });

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every((log) => log.entityId === "task-1")).toBe(true);
    });

    it("should filter by entity ID only when entity type also matches", async () => {
      // Arrange
      const logs: AuditLogEntry[] = [
        {
          id: "log-1",
          action: "CREATE",
          entityType: "Task",
          entityId: "entity-1",
          createdAt: new Date(),
        },
        {
          id: "log-2",
          action: "CREATE",
          entityType: "User",
          entityId: "entity-1",
          createdAt: new Date(),
        },
      ];
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute({
        entityType: "Task",
        entityId: "entity-1",
      });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].entityType).toBe("Task");
    });

    it("should track full entity history across different actions", async () => {
      // Arrange
      const baseTime = new Date("2024-01-01T00:00:00Z");
      const logs: AuditLogEntry[] = [
        {
          id: "log-1",
          action: "CREATE",
          entityType: "Task",
          entityId: "task-1",
          changes: { title: "New Task" },
          createdAt: new Date(baseTime.getTime()),
        },
        {
          id: "log-2",
          action: "UPDATE",
          entityType: "Task",
          entityId: "task-1",
          changes: { title: "Updated Task" },
          createdAt: new Date(baseTime.getTime() + 1000),
        },
        {
          id: "log-3",
          action: "DELETE",
          entityType: "Task",
          entityId: "task-1",
          createdAt: new Date(baseTime.getTime() + 2000),
        },
      ];
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute({
        entityType: "Task",
        entityId: "task-1",
      });

      // Assert
      expect(result).toHaveLength(3);
      // Should be in reverse chronological order
      expect(result[0].action).toBe("DELETE");
      expect(result[1].action).toBe("UPDATE");
      expect(result[2].action).toBe("CREATE");
    });
  });

  describe("execute - filtering by date range", () => {
    it("should return logs within date range", async () => {
      // Arrange
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      const logs: AuditLogEntry[] = [
        {
          id: "log-1",
          action: "CREATE",
          entityType: "Task",
          createdAt: twoDaysAgo,
        },
        {
          id: "log-2",
          action: "CREATE",
          entityType: "Task",
          createdAt: yesterday,
        },
        {
          id: "log-3",
          action: "CREATE",
          entityType: "Task",
          createdAt: now,
        },
      ];
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute({
        startDate: yesterday,
        endDate: now,
      });

      // Assert
      expect(result).toHaveLength(2);
      expect(result.some((log) => log.id === "log-2")).toBe(true);
      expect(result.some((log) => log.id === "log-3")).toBe(true);
    });

    it("should return logs from start date only", async () => {
      // Arrange
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      const logs: AuditLogEntry[] = [
        {
          id: "log-1",
          action: "CREATE",
          entityType: "Task",
          createdAt: twoDaysAgo,
        },
        {
          id: "log-2",
          action: "CREATE",
          entityType: "Task",
          createdAt: yesterday,
        },
        {
          id: "log-3",
          action: "CREATE",
          entityType: "Task",
          createdAt: now,
        },
      ];
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute({ startDate: yesterday });

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every((log) => log.createdAt >= yesterday)).toBe(true);
    });

    it("should return logs up to end date only", async () => {
      // Arrange
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      const logs: AuditLogEntry[] = [
        {
          id: "log-1",
          action: "CREATE",
          entityType: "Task",
          createdAt: twoDaysAgo,
        },
        {
          id: "log-2",
          action: "CREATE",
          entityType: "Task",
          createdAt: yesterday,
        },
        {
          id: "log-3",
          action: "CREATE",
          entityType: "Task",
          createdAt: now,
        },
      ];
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute({ endDate: yesterday });

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every((log) => log.createdAt <= yesterday)).toBe(true);
    });

    it("should return empty array when no logs in date range", async () => {
      // Arrange
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const logs: AuditLogEntry[] = [
        {
          id: "log-1",
          action: "CREATE",
          entityType: "Task",
          createdAt: now,
        },
      ];
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute({
        startDate: twoWeeksAgo,
        endDate: oneWeekAgo,
      });

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("execute - pagination", () => {
    it("should limit results when limit is specified", async () => {
      // Arrange
      const logs: AuditLogEntry[] = Array.from({ length: 10 }, (_, i) => ({
        id: `log-${i}`,
        action: "CREATE",
        entityType: "Task",
        createdAt: new Date(),
      }));
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute({ limit: 5 });

      // Assert
      expect(result).toHaveLength(5);
    });

    it("should skip results when offset is specified", async () => {
      // Arrange
      const baseTime = new Date("2024-01-01T00:00:00Z");
      const logs: AuditLogEntry[] = Array.from({ length: 10 }, (_, i) => ({
        id: `log-${i}`,
        action: "CREATE",
        entityType: "Task",
        createdAt: new Date(baseTime.getTime() + i * 1000),
      }));
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute({ offset: 3 });

      // Assert
      expect(result).toHaveLength(7);
      // Should skip the 3 most recent logs
      expect(result[0].id).toBe("log-6");
    });

    it("should apply both limit and offset", async () => {
      // Arrange
      const baseTime = new Date("2024-01-01T00:00:00Z");
      const logs: AuditLogEntry[] = Array.from({ length: 10 }, (_, i) => ({
        id: `log-${i}`,
        action: "CREATE",
        entityType: "Task",
        createdAt: new Date(baseTime.getTime() + i * 1000),
      }));
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute({ limit: 3, offset: 2 });

      // Assert
      expect(result).toHaveLength(3);
      // Should skip 2 most recent, then take next 3
      expect(result[0].id).toBe("log-7");
      expect(result[1].id).toBe("log-6");
      expect(result[2].id).toBe("log-5");
    });

    it("should handle offset beyond total logs", async () => {
      // Arrange
      const logs: AuditLogEntry[] = [
        {
          id: "log-1",
          action: "CREATE",
          entityType: "Task",
          createdAt: new Date(),
        },
      ];
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute({ offset: 10 });

      // Assert
      expect(result).toEqual([]);
    });

    it("should handle limit larger than total logs", async () => {
      // Arrange
      const logs: AuditLogEntry[] = [
        {
          id: "log-1",
          action: "CREATE",
          entityType: "Task",
          createdAt: new Date(),
        },
      ];
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute({ limit: 100 });

      // Assert
      expect(result).toHaveLength(1);
    });

    it("should handle zero offset", async () => {
      // Arrange
      const logs: AuditLogEntry[] = Array.from({ length: 5 }, (_, i) => ({
        id: `log-${i}`,
        action: "CREATE",
        entityType: "Task",
        createdAt: new Date(),
      }));
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute({ offset: 0, limit: 3 });

      // Assert
      expect(result).toHaveLength(3);
    });

    it("should handle pagination with filters", async () => {
      // Arrange
      const logs: AuditLogEntry[] = Array.from({ length: 10 }, (_, i) => ({
        id: `log-${i}`,
        userId: i % 2 === 0 ? "user-1" : "user-2",
        action: "CREATE",
        entityType: "Task",
        createdAt: new Date(),
      }));
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute({
        userId: "user-1",
        limit: 2,
        offset: 1,
      });

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every((log) => log.userId === "user-1")).toBe(true);
    });
  });

  describe("execute - combined filters", () => {
    it("should return logs matching multiple filters", async () => {
      // Arrange
      const now = new Date();
      const logs: AuditLogEntry[] = [
        {
          id: "log-1",
          userId: "user-1",
          action: "CREATE",
          entityType: "Task",
          entityId: "task-1",
          createdAt: now,
        },
        {
          id: "log-2",
          userId: "user-1",
          action: "UPDATE",
          entityType: "Task",
          entityId: "task-1",
          createdAt: now,
        },
        {
          id: "log-3",
          userId: "user-2",
          action: "CREATE",
          entityType: "Task",
          entityId: "task-1",
          createdAt: now,
        },
      ];
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute({
        userId: "user-1",
        entityType: "Task",
        entityId: "task-1",
      });

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every((log) => log.userId === "user-1")).toBe(true);
      expect(result.every((log) => log.entityId === "task-1")).toBe(true);
    });

    it("should return logs matching all filters including date range and pagination", async () => {
      // Arrange
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const logs: AuditLogEntry[] = Array.from({ length: 10 }, (_, i) => ({
        id: `log-${i}`,
        userId: "user-1",
        action: "CREATE",
        entityType: "Task",
        createdAt: new Date(now.getTime() - i * 1000),
      }));
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute({
        userId: "user-1",
        action: "CREATE",
        entityType: "Task",
        startDate: yesterday,
        limit: 5,
      });

      // Assert
      expect(result).toHaveLength(5);
      expect(result.every((log) => log.userId === "user-1")).toBe(true);
      expect(result.every((log) => log.action === "CREATE")).toBe(true);
    });

    it("should return empty array when filters match no logs", async () => {
      // Arrange
      const logs: AuditLogEntry[] = [
        {
          id: "log-1",
          userId: "user-1",
          action: "CREATE",
          entityType: "Task",
          createdAt: new Date(),
        },
      ];
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute({
        userId: "user-1",
        action: "DELETE",
      });

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("edge cases", () => {
    it("should handle large number of logs with pagination", async () => {
      // Arrange
      const logs: AuditLogEntry[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `log-${i}`,
        action: "CREATE",
        entityType: "Task",
        createdAt: new Date(),
      }));
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute({ limit: 50 });

      // Assert
      expect(result).toHaveLength(50);
    });

    it("should handle logs with minimal data", async () => {
      // Arrange
      const logs: AuditLogEntry[] = [
        {
          id: "log-1",
          action: "SYSTEM",
          entityType: "System",
          createdAt: new Date(),
        },
      ];
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBeUndefined();
      expect(result[0].entityId).toBeUndefined();
    });

    it("should handle logs with all optional fields", async () => {
      // Arrange
      const logs: AuditLogEntry[] = [
        {
          id: "log-1",
          userId: "user-1",
          action: "CREATE",
          entityType: "Task",
          entityId: "task-1",
          changes: { title: "New Task", status: "PENDING" },
          metadata: { source: "web", browser: "Chrome" },
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0",
          createdAt: new Date(),
        },
      ];
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute({ userId: "user-1" });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].changes).toBeDefined();
      expect(result[0].metadata).toBeDefined();
      expect(result[0].ipAddress).toBe("192.168.1.1");
      expect(result[0].userAgent).toBe("Mozilla/5.0");
    });

    it("should preserve log data integrity", async () => {
      // Arrange
      const changes = { title: "Test", status: "PENDING" };
      const metadata = { source: "api" };
      const logs: AuditLogEntry[] = [
        {
          id: "log-1",
          userId: "user-1",
          action: "CREATE",
          entityType: "Task",
          entityId: "task-1",
          changes,
          metadata,
          ipAddress: "192.168.1.1",
          userAgent: "Test Agent",
          createdAt: new Date("2024-01-01T00:00:00Z"),
        },
      ];
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result[0]).toEqual(logs[0]);
    });

    it("should handle concurrent logs with same timestamp", async () => {
      // Arrange
      const timestamp = new Date();
      const logs: AuditLogEntry[] = [
        {
          id: "log-1",
          action: "CREATE",
          entityType: "Task",
          createdAt: timestamp,
        },
        {
          id: "log-2",
          action: "UPDATE",
          entityType: "Task",
          createdAt: timestamp,
        },
        {
          id: "log-3",
          action: "DELETE",
          entityType: "Task",
          createdAt: timestamp,
        },
      ];
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(3);
      // All have same timestamp, so order is stable but any order is valid
      expect(
        result.every((log) => log.createdAt.getTime() === timestamp.getTime()),
      ).toBe(true);
    });
  });
});
