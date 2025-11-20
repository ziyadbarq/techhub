/**
 * BroadcastTaskEventUseCase - Unit Tests
 *
 * Tests for the BroadcastTaskEventUseCase including:
 * - Successful event broadcasting
 * - Task entity conversion to payload
 * - Direct payload broadcasting
 * - Convenience methods (broadcastCreated, broadcastUpdated, etc.)
 * - Error handling (non-critical failures)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  BroadcastTaskEventUseCase,
  TaskEventType,
  type TaskEventPayload,
} from "../broadcast-task-event.use-case";
import type { ISSEService } from "@/core/services/sse.service.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { Task, TaskStatus } from "@/core/domain/entities/task.entity";

/**
 * Mock SSE Service
 */
class MockSSEService implements Partial<ISSEService> {
  broadcastEvent = vi.fn();
  getSubscriberCount = vi.fn();

  reset(): void {
    this.broadcastEvent.mockReset();
    this.getSubscriberCount.mockReset();
  }
}

/**
 * Mock Logger Service
 */
class MockLoggerService implements Partial<ILoggerService> {
  info = vi.fn();
  error = vi.fn();
  debug = vi.fn();
  warn = vi.fn();

  reset(): void {
    this.info.mockReset();
    this.error.mockReset();
    this.debug.mockReset();
    this.warn.mockReset();
  }
}

describe("BroadcastTaskEventUseCase", () => {
  let useCase: BroadcastTaskEventUseCase;
  let mockSSEService: MockSSEService;
  let mockLogger: MockLoggerService;

  beforeEach(() => {
    mockSSEService = new MockSSEService();
    mockLogger = new MockLoggerService();
    useCase = new BroadcastTaskEventUseCase(
      mockSSEService as unknown as ISSEService,
      mockLogger as unknown as ILoggerService,
    );
  });

  describe("execute - successful broadcasting with Task entity", () => {
    it("should broadcast task created event with Task entity", async () => {
      // Arrange
      const task = new Task(
        "task-1",
        "Test Task",
        "Test Description",
        TaskStatus.PENDING,
        "user-123",
        new Date(),
        new Date(),
      );

      // Act
      await useCase.execute(TaskEventType.CREATED, task);

      // Assert
      expect(mockSSEService.broadcastEvent).toHaveBeenCalledTimes(1);
      const call = mockSSEService.broadcastEvent.mock.calls[0];
      expect(call[0]).toBe("tasks"); // default channel
      expect(call[1].event).toBe(TaskEventType.CREATED);
      expect(call[1].data).toMatchObject({
        id: "task-1",
        title: "Test Task",
        description: "Test Description",
        status: TaskStatus.PENDING,
      });
      expect(call[1].data.timestamp).toBeDefined();
      expect(call[1].id).toBeDefined();
    });

    it("should broadcast task updated event with Task entity", async () => {
      // Arrange
      const task = new Task(
        "task-2",
        "Updated Task",
        null,
        TaskStatus.IN_PROGRESS,
        "user-456",
        new Date(),
        new Date(),
      );

      // Act
      await useCase.execute(TaskEventType.UPDATED, task, "custom-channel");

      // Assert
      expect(mockSSEService.broadcastEvent).toHaveBeenCalledTimes(1);
      const call = mockSSEService.broadcastEvent.mock.calls[0];
      expect(call[0]).toBe("custom-channel");
      expect(call[1].event).toBe(TaskEventType.UPDATED);
      expect(call[1].data).toMatchObject({
        id: "task-2",
        title: "Updated Task",
        description: null,
        status: TaskStatus.IN_PROGRESS,
      });
    });

    it("should log successful broadcast", async () => {
      // Arrange
      const task = new Task(
        "task-3",
        "Task",
        null,
        TaskStatus.COMPLETED,
        null,
        new Date(),
        new Date(),
      );

      // Act
      await useCase.execute(TaskEventType.COMPLETED, task);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Broadcasted task event",
        expect.objectContaining({
          eventType: TaskEventType.COMPLETED,
          taskId: "task-3",
          channel: "tasks",
        }),
      );
    });
  });

  describe("execute - successful broadcasting with TaskEventPayload", () => {
    it("should broadcast task event with direct payload", async () => {
      // Arrange
      const payload: TaskEventPayload = {
        id: "task-10",
        title: "Direct Payload Task",
        description: "Direct description",
        status: TaskStatus.PENDING,
        timestamp: Date.now(),
      };

      // Act
      await useCase.execute(TaskEventType.CREATED, payload);

      // Assert
      expect(mockSSEService.broadcastEvent).toHaveBeenCalledTimes(1);
      const call = mockSSEService.broadcastEvent.mock.calls[0];
      expect(call[1].data).toMatchObject(payload);
    });

    it("should use payload timestamp if provided", async () => {
      // Arrange
      const fixedTimestamp = 1234567890;
      const payload: TaskEventPayload = {
        id: "task-11",
        title: "Task with Timestamp",
        status: TaskStatus.COMPLETED,
        timestamp: fixedTimestamp,
      };

      // Act
      await useCase.execute(TaskEventType.COMPLETED, payload);

      // Assert
      const call = mockSSEService.broadcastEvent.mock.calls[0];
      expect(call[1].data.timestamp).toBe(fixedTimestamp);
    });

    it("should generate timestamp if not provided in payload", async () => {
      // Arrange
      const payload = {
        id: "task-12",
        title: "Task without Timestamp",
        status: TaskStatus.PENDING,
      } as TaskEventPayload;

      // Act
      const beforeTimestamp = Date.now();
      await useCase.execute(TaskEventType.CREATED, payload);
      const afterTimestamp = Date.now();

      // Assert
      const call = mockSSEService.broadcastEvent.mock.calls[0];
      const resultTimestamp = call[1].data.timestamp;
      expect(resultTimestamp).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(resultTimestamp).toBeLessThanOrEqual(afterTimestamp);
    });
  });

  describe("execute - error handling", () => {
    it("should catch and log SSE service errors without throwing", async () => {
      // Arrange
      const task = new Task(
        "task-error",
        "Task",
        null,
        TaskStatus.PENDING,
        null,
        new Date(),
        new Date(),
      );
      const broadcastError = new Error("SSE broadcast failed");
      mockSSEService.broadcastEvent.mockRejectedValueOnce(broadcastError);

      // Act - Should not throw
      await expect(
        useCase.execute(TaskEventType.CREATED, task),
      ).resolves.not.toThrow();

      // Assert - Error should be logged
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to broadcast task event",
        broadcastError,
        expect.objectContaining({
          eventType: TaskEventType.CREATED,
          channel: "tasks",
        }),
      );
    });

    it("should handle non-Error exceptions", async () => {
      // Arrange
      const task = new Task(
        "task-error-2",
        "Task",
        null,
        TaskStatus.PENDING,
        null,
        new Date(),
        new Date(),
      );
      mockSSEService.broadcastEvent.mockRejectedValueOnce(
        "String error message",
      );

      // Act & Assert - Should not throw
      await expect(
        useCase.execute(TaskEventType.CREATED, task),
      ).resolves.not.toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
      const errorCall = mockLogger.error.mock.calls[0];
      expect(errorCall[1]).toBeInstanceOf(Error);
    });

    it("should log error but not fail the operation", async () => {
      // Arrange
      const payload: TaskEventPayload = {
        id: "task-error-3",
        title: "Error Task",
        status: TaskStatus.PENDING,
        timestamp: Date.now(),
      };
      mockSSEService.broadcastEvent.mockRejectedValueOnce(
        new Error("Network timeout"),
      );

      // Act
      await useCase.execute(TaskEventType.UPDATED, payload, "custom-channel");

      // Assert
      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalled(); // Success log should not be called
    });
  });

  describe("convenience methods", () => {
    it("should call execute with CREATED event type via broadcastCreated", async () => {
      // Arrange
      const task = new Task(
        "task-20",
        "Created Task",
        null,
        TaskStatus.PENDING,
        null,
        new Date(),
        new Date(),
      );

      // Act
      await useCase.broadcastCreated(task);

      // Assert
      expect(mockSSEService.broadcastEvent).toHaveBeenCalledTimes(1);
      const call = mockSSEService.broadcastEvent.mock.calls[0];
      expect(call[1].event).toBe(TaskEventType.CREATED);
    });

    it("should call execute with UPDATED event type via broadcastUpdated", async () => {
      // Arrange
      const task = new Task(
        "task-21",
        "Updated Task",
        null,
        TaskStatus.IN_PROGRESS,
        null,
        new Date(),
        new Date(),
      );

      // Act
      await useCase.broadcastUpdated(task, "custom-channel");

      // Assert
      expect(mockSSEService.broadcastEvent).toHaveBeenCalledTimes(1);
      const call = mockSSEService.broadcastEvent.mock.calls[0];
      expect(call[0]).toBe("custom-channel");
      expect(call[1].event).toBe(TaskEventType.UPDATED);
    });

    it("should call execute with DELETED event type via broadcastDeleted", async () => {
      // Arrange
      const taskId = "task-22";

      // Act
      await useCase.broadcastDeleted(taskId);

      // Assert
      expect(mockSSEService.broadcastEvent).toHaveBeenCalledTimes(1);
      const call = mockSSEService.broadcastEvent.mock.calls[0];
      expect(call[1].event).toBe(TaskEventType.DELETED);
      expect(call[1].data).toMatchObject({
        id: taskId,
        title: "",
        status: "",
      });
      expect(call[1].data.timestamp).toBeDefined();
    });

    it("should call execute with COMPLETED event type via broadcastCompleted", async () => {
      // Arrange
      const payload: TaskEventPayload = {
        id: "task-23",
        title: "Completed Task",
        status: TaskStatus.COMPLETED,
        timestamp: Date.now(),
      };

      // Act
      await useCase.broadcastCompleted(payload);

      // Assert
      expect(mockSSEService.broadcastEvent).toHaveBeenCalledTimes(1);
      const call = mockSSEService.broadcastEvent.mock.calls[0];
      expect(call[1].event).toBe(TaskEventType.COMPLETED);
    });
  });

  describe("edge cases", () => {
    it("should handle task with null description", async () => {
      // Arrange
      const task = new Task(
        "task-30",
        "Task without description",
        null,
        TaskStatus.PENDING,
        null,
        new Date(),
        new Date(),
      );

      // Act
      await useCase.execute(TaskEventType.CREATED, task);

      // Assert
      const call = mockSSEService.broadcastEvent.mock.calls[0];
      expect(call[1].data.description).toBeNull();
    });

    it("should handle task with null createdBy", async () => {
      // Arrange
      const task = new Task(
        "task-31",
        "Anonymous Task",
        "Description",
        TaskStatus.PENDING,
        null,
        new Date(),
        new Date(),
      );

      // Act
      await useCase.execute(TaskEventType.CREATED, task);

      // Assert
      expect(mockSSEService.broadcastEvent).toHaveBeenCalledTimes(1);
      const call = mockSSEService.broadcastEvent.mock.calls[0];
      // Verify payload contains all required fields for TaskEventPayload
      expect(call[1].data).toMatchObject({
        id: "task-31",
        title: "Anonymous Task",
        description: "Description",
        status: TaskStatus.PENDING,
      });
      expect(call[1].data.timestamp).toBeDefined();
    });

    it("should generate unique event IDs for each broadcast", async () => {
      // Arrange
      const task = new Task(
        "task-32",
        "Task",
        null,
        TaskStatus.PENDING,
        null,
        new Date(),
        new Date(),
      );

      // Act
      await useCase.execute(TaskEventType.CREATED, task);
      await useCase.execute(TaskEventType.UPDATED, task);

      // Assert
      expect(mockSSEService.broadcastEvent).toHaveBeenCalledTimes(2);
      const firstId = mockSSEService.broadcastEvent.mock.calls[0][1].id;
      const secondId = mockSSEService.broadcastEvent.mock.calls[1][1].id;
      expect(firstId).not.toBe(secondId);
    });

    it("should use default channel when not specified", async () => {
      // Arrange
      const payload: TaskEventPayload = {
        id: "task-33",
        title: "Default Channel Task",
        status: TaskStatus.PENDING,
        timestamp: Date.now(),
      };

      // Act
      await useCase.execute(TaskEventType.CREATED, payload);

      // Assert
      const call = mockSSEService.broadcastEvent.mock.calls[0];
      expect(call[0]).toBe("tasks");
    });

    it("should support custom channel names", async () => {
      // Arrange
      const task = new Task(
        "task-34",
        "Custom Channel Task",
        null,
        TaskStatus.PENDING,
        null,
        new Date(),
        new Date(),
      );

      // Act
      await useCase.execute(TaskEventType.CREATED, task, "workspace:123:tasks");

      // Assert
      const call = mockSSEService.broadcastEvent.mock.calls[0];
      expect(call[0]).toBe("workspace:123:tasks");
    });

    it("should handle all TaskStatus values", async () => {
      // Test PENDING
      const pendingTask = new Task(
        "task-35",
        "Pending",
        null,
        TaskStatus.PENDING,
        null,
        new Date(),
        new Date(),
      );
      await useCase.execute(TaskEventType.CREATED, pendingTask);

      // Test IN_PROGRESS
      const inProgressTask = new Task(
        "task-36",
        "In Progress",
        null,
        TaskStatus.IN_PROGRESS,
        null,
        new Date(),
        new Date(),
      );
      await useCase.execute(TaskEventType.UPDATED, inProgressTask);

      // Test COMPLETED
      const completedTask = new Task(
        "task-37",
        "Completed",
        null,
        TaskStatus.COMPLETED,
        null,
        new Date(),
        new Date(),
      );
      await useCase.execute(TaskEventType.COMPLETED, completedTask);

      // Assert all broadcasts succeeded
      expect(mockSSEService.broadcastEvent).toHaveBeenCalledTimes(3);
    });
  });
});
