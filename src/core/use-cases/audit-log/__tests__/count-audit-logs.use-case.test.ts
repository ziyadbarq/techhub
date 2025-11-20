/**
 * CountAuditLogsUseCase - Unit Tests
 *
 * Tests for the CountAuditLogsUseCase including:
 * - Counting all audit logs
 * - Filtering by user ID
 * - Filtering by action
 * - Filtering by entity type and ID
 * - Filtering by date range
 * - Multiple filter combinations
 */

import { describe, it, expect, beforeEach } from "vitest";
import { CountAuditLogsUseCase } from "../count-audit-logs.use-case";
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

  async count(params?: FindAuditLogsParams): Promise<number> {
    let result = [...this.logs];

    if (params?.userId) {
      result = result.filter((log) => log.userId === params.userId);
    }

    if (params?.action) {
      result = result.filter((log) => log.action === params.action);
    }

    if (params?.entityType) {
      result = result.filter((log) => log.entityType === params.entityType);
    }

    if (params?.entityId) {
      result = result.filter((log) => log.entityId === params.entityId);
    }

    if (params?.startDate) {
      result = result.filter((log) => log.createdAt >= params.startDate!);
    }

    if (params?.endDate) {
      result = result.filter((log) => log.createdAt <= params.endDate!);
    }

    return result.length;
  }

  addLogs(logs: AuditLogEntry[]): void {
    this.logs.push(...logs);
  }

  clear(): void {
    this.logs = [];
  }
}

describe("CountAuditLogsUseCase", () => {
  let useCase: CountAuditLogsUseCase;
  let mockRepository: MockAuditLogRepository;

  beforeEach(() => {
    mockRepository = new MockAuditLogRepository();
    useCase = new CountAuditLogsUseCase(
      mockRepository as unknown as IAuditLogRepository,
    );
  });

  describe("execute - basic counting", () => {
    it("should count all audit logs when no filter provided", async () => {
      // Arrange
      const logs: AuditLogEntry[] = [
        {
          id: "log-1",
          userId: "user-1",
          action: "CREATE",
          entityType: "Task",
          entityId: "task-1",
          createdAt: new Date(),
        },
        {
          id: "log-2",
          userId: "user-2",
          action: "UPDATE",
          entityType: "Task",
          entityId: "task-2",
          createdAt: new Date(),
        },
        {
          id: "log-3",
          userId: "user-1",
          action: "DELETE",
          entityType: "User",
          entityId: "user-3",
          createdAt: new Date(),
        },
      ];
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toBe(3);
    });

    it("should return 0 when no audit logs exist", async () => {
      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toBe(0);
    });

    it("should count logs without params object", async () => {
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
      const result = await useCase.execute(undefined);

      // Assert
      expect(result).toBe(1);
    });
  });

  describe("execute - filtering by user", () => {
    it("should count logs for specific user", async () => {
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
      expect(result).toBe(2);
    });

    it("should return 0 when no logs match user ID", async () => {
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
      expect(result).toBe(0);
    });

    it("should count logs without userId when filtering by different user", async () => {
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
      expect(result).toBe(1);
    });
  });

  describe("execute - filtering by action", () => {
    it("should count logs for specific action", async () => {
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
      expect(result).toBe(2);
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
      expect(result).toBe(1);
    });
  });

  describe("execute - filtering by entity", () => {
    it("should count logs for specific entity type", async () => {
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
      expect(result).toBe(2);
    });

    it("should count logs for specific entity type and ID", async () => {
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
      expect(result).toBe(2);
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
      expect(result).toBe(1);
    });
  });

  describe("execute - filtering by date range", () => {
    it("should count logs within date range", async () => {
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
      expect(result).toBe(2);
    });

    it("should count logs from start date only", async () => {
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
      expect(result).toBe(2);
    });

    it("should count logs up to end date only", async () => {
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
      expect(result).toBe(2);
    });

    it("should return 0 when no logs in date range", async () => {
      // Arrange
      const now = new Date();
      const _yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
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
      expect(result).toBe(0);
    });
  });

  describe("execute - combined filters", () => {
    it("should count logs matching multiple filters", async () => {
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
      expect(result).toBe(2);
    });

    it("should count logs matching all filters including date range", async () => {
      // Arrange
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const logs: AuditLogEntry[] = [
        {
          id: "log-1",
          userId: "user-1",
          action: "CREATE",
          entityType: "Task",
          createdAt: now,
        },
        {
          id: "log-2",
          userId: "user-1",
          action: "CREATE",
          entityType: "Task",
          createdAt: yesterday,
        },
        {
          id: "log-3",
          userId: "user-2",
          action: "CREATE",
          entityType: "Task",
          createdAt: now,
        },
      ];
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute({
        userId: "user-1",
        action: "CREATE",
        entityType: "Task",
        startDate: yesterday,
      });

      // Assert
      expect(result).toBe(2);
    });

    it("should return 0 when filters match no logs", async () => {
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
      expect(result).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("should handle large number of logs", async () => {
      // Arrange
      const logs: AuditLogEntry[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `log-${i}`,
        action: "CREATE",
        entityType: "Task",
        createdAt: new Date(),
      }));
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toBe(1000);
    });

    it("should handle empty filters object", async () => {
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
      expect(result).toBe(1);
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
      expect(result).toBe(1);
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
          changes: { title: "New Task" },
          metadata: { source: "web" },
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0",
          createdAt: new Date(),
        },
      ];
      mockRepository.addLogs(logs);

      // Act
      const result = await useCase.execute({ userId: "user-1" });

      // Assert
      expect(result).toBe(1);
    });
  });
});
