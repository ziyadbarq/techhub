/**
 * ScheduleTaskReminderUseCase - Unit Tests
 *
 * Tests for the ScheduleTaskReminderUseCase including:
 * - Successful reminder scheduling
 * - Task existence validation
 * - Completed task validation
 * - Future date validation
 * - Job queue integration
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  ScheduleTaskReminderUseCase,
  type ScheduleTaskReminderInput,
} from "../schedule-task-reminder.use-case";
import type { ITaskRepository } from "@/core/repositories/task.repository.interface";
import type { IJobQueueService } from "@/core/services/job-queue.service.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { Task, TaskStatus } from "@/core/domain/entities/task.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import { QUEUE_NAMES, TASK_JOBS } from "@/core/domain/jobs/job-names";

/**
 * Mock Task Repository
 */
class MockTaskRepository implements Partial<ITaskRepository> {
  private tasks = new Map<string, Task>();

  async findById(id: string): Promise<Task | null> {
    return this.tasks.get(id) || null;
  }

  setTask(task: Task): Task {
    this.tasks.set(task.id, task);
    return task;
  }

  clear(): void {
    this.tasks.clear();
  }
}

/**
 * Mock Job Queue Service
 */
class MockJobQueueService implements Partial<IJobQueueService> {
  addJob = vi.fn().mockResolvedValue("job-id-123");

  reset(): void {
    this.addJob.mockReset().mockResolvedValue("job-id-123");
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

describe("ScheduleTaskReminderUseCase", () => {
  let useCase: ScheduleTaskReminderUseCase;
  let mockTaskRepository: MockTaskRepository;
  let mockJobQueueService: MockJobQueueService;
  let mockLogger: MockLoggerService;

  beforeEach(() => {
    mockTaskRepository = new MockTaskRepository();
    mockJobQueueService = new MockJobQueueService();
    mockLogger = new MockLoggerService();
    useCase = new ScheduleTaskReminderUseCase(
      mockTaskRepository as unknown as ITaskRepository,
      mockJobQueueService as unknown as IJobQueueService,
      mockLogger as unknown as ILoggerService,
    );
  });

  describe("execute - successful reminder scheduling", () => {
    it("should schedule a reminder for a pending task", async () => {
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
      mockTaskRepository.setTask(task);

      const reminderDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      const input: ScheduleTaskReminderInput = {
        taskId: "task-1",
        reminderDate,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toMatchObject({
        jobId: "job-id-123",
        taskId: "task-1",
        scheduledFor: reminderDate,
      });
    });

    it("should schedule a reminder for an in-progress task", async () => {
      // Arrange
      const task = new Task(
        "task-2",
        "In Progress Task",
        null,
        TaskStatus.IN_PROGRESS,
        "user-456",
        new Date(),
        new Date(),
      );
      mockTaskRepository.setTask(task);

      const reminderDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now
      const input: ScheduleTaskReminderInput = {
        taskId: "task-2",
        reminderDate,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.taskId).toBe("task-2");
      expect(result.scheduledFor).toBe(reminderDate);
    });

    it("should add job to correct queue with proper configuration", async () => {
      // Arrange
      const task = new Task(
        "task-3",
        "Task with Reminder",
        null,
        TaskStatus.PENDING,
        null,
        new Date(),
        new Date(),
      );
      mockTaskRepository.setTask(task);

      const reminderDate = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
      const input: ScheduleTaskReminderInput = {
        taskId: "task-3",
        reminderDate,
      };

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockJobQueueService.addJob).toHaveBeenCalledTimes(1);
      const call = mockJobQueueService.addJob.mock.calls[0];
      expect(call[0]).toBe(QUEUE_NAMES.TASKS);
      expect(call[1]).toBe(TASK_JOBS.TASK_REMINDER);
      expect(call[2]).toMatchObject({
        taskId: "task-3",
        taskTitle: "Task with Reminder",
        entityId: "task-3",
      });
      expect(call[3]).toMatchObject({
        delay: expect.any(Number),
        attempts: 3,
        priority: 5,
      });
    });

    it("should calculate correct delay for reminder", async () => {
      // Arrange
      const task = new Task(
        "task-4",
        "Task",
        null,
        TaskStatus.PENDING,
        null,
        new Date(),
        new Date(),
      );
      mockTaskRepository.setTask(task);

      const reminderDate = new Date(Date.now() + 5000); // 5 seconds from now
      const input: ScheduleTaskReminderInput = {
        taskId: "task-4",
        reminderDate,
      };

      // Act
      const beforeExecution = Date.now();
      await useCase.execute(input);
      const afterExecution = Date.now();

      // Assert
      const call = mockJobQueueService.addJob.mock.calls[0];
      const jobOptions = call[3] as { delay: number };
      const expectedDelay = reminderDate.getTime() - beforeExecution;
      const maxExpectedDelay = reminderDate.getTime() - afterExecution;

      expect(jobOptions.delay).toBeGreaterThanOrEqual(maxExpectedDelay);
      expect(jobOptions.delay).toBeLessThanOrEqual(expectedDelay);
    });

    it("should log successful scheduling", async () => {
      // Arrange
      const task = new Task(
        "task-5",
        "Log Test Task",
        null,
        TaskStatus.PENDING,
        null,
        new Date(),
        new Date(),
      );
      mockTaskRepository.setTask(task);

      const reminderDate = new Date(Date.now() + 3600000);
      const input: ScheduleTaskReminderInput = {
        taskId: "task-5",
        reminderDate,
      };

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Scheduled task reminder",
        expect.objectContaining({
          taskId: "task-5",
          jobId: "job-id-123",
          scheduledFor: reminderDate.toISOString(),
        }),
      );
    });
  });

  describe("execute - task validation", () => {
    it("should throw NotFoundError when task does not exist", async () => {
      // Arrange
      const input: ScheduleTaskReminderInput = {
        taskId: "non-existent-task",
        reminderDate: new Date(Date.now() + 3600000),
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
      await expect(useCase.execute(input)).rejects.toThrow(
        "Task with ID non-existent-task not found",
      );
    });

    it("should throw error when trying to schedule reminder for completed task", async () => {
      // Arrange
      const task = new Task(
        "task-10",
        "Completed Task",
        null,
        TaskStatus.COMPLETED,
        null,
        new Date(),
        new Date(),
      );
      mockTaskRepository.setTask(task);

      const input: ScheduleTaskReminderInput = {
        taskId: "task-10",
        reminderDate: new Date(Date.now() + 3600000),
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        "Cannot schedule reminder for completed task",
      );
    });

    it("should not call job queue service when task validation fails", async () => {
      // Arrange
      const task = new Task(
        "task-11",
        "Completed Task",
        null,
        TaskStatus.COMPLETED,
        null,
        new Date(),
        new Date(),
      );
      mockTaskRepository.setTask(task);

      const input: ScheduleTaskReminderInput = {
        taskId: "task-11",
        reminderDate: new Date(Date.now() + 3600000),
      };

      // Act
      try {
        await useCase.execute(input);
      } catch {
        // Expected error
      }

      // Assert
      expect(mockJobQueueService.addJob).not.toHaveBeenCalled();
    });
  });

  describe("execute - date validation", () => {
    it("should throw error when reminder date is in the past", async () => {
      // Arrange
      const task = new Task(
        "task-20",
        "Task",
        null,
        TaskStatus.PENDING,
        null,
        new Date(),
        new Date(),
      );
      mockTaskRepository.setTask(task);

      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
      const input: ScheduleTaskReminderInput = {
        taskId: "task-20",
        reminderDate: pastDate,
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        "Reminder date must be in the future",
      );
    });

    it("should throw error when reminder date is exactly now or very close", async () => {
      // Arrange
      const task = new Task(
        "task-21",
        "Task",
        null,
        TaskStatus.PENDING,
        null,
        new Date(),
        new Date(),
      );
      mockTaskRepository.setTask(task);

      // Set date to current time minus a small buffer to ensure it's in the past
      const now = new Date(Date.now() - 10);
      const input: ScheduleTaskReminderInput = {
        taskId: "task-21",
        reminderDate: now,
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        "Reminder date must be in the future",
      );
    });

    it("should accept reminder date 1 millisecond in the future", async () => {
      // Arrange
      const task = new Task(
        "task-22",
        "Task",
        null,
        TaskStatus.PENDING,
        null,
        new Date(),
        new Date(),
      );
      mockTaskRepository.setTask(task);

      const futureDate = new Date(Date.now() + 1);
      const input: ScheduleTaskReminderInput = {
        taskId: "task-22",
        reminderDate: futureDate,
      };

      // Act & Assert
      await expect(useCase.execute(input)).resolves.toBeDefined();
    });

    it("should handle far future dates", async () => {
      // Arrange
      const task = new Task(
        "task-23",
        "Task",
        null,
        TaskStatus.PENDING,
        null,
        new Date(),
        new Date(),
      );
      mockTaskRepository.setTask(task);

      const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
      const input: ScheduleTaskReminderInput = {
        taskId: "task-23",
        reminderDate: farFuture,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.scheduledFor).toBe(farFuture);
      const call = mockJobQueueService.addJob.mock.calls[0];
      const jobOptions = call[3] as { delay: number };
      expect(jobOptions.delay).toBeGreaterThan(365 * 24 * 60 * 60 * 1000 - 100); // Allow small margin
    });
  });

  describe("execute - job data payload", () => {
    it("should include correct task information in job data", async () => {
      // Arrange
      const task = new Task(
        "task-30",
        "Task Title for Reminder",
        "Task Description",
        TaskStatus.PENDING,
        "user-789",
        new Date(),
        new Date(),
      );
      mockTaskRepository.setTask(task);

      const reminderDate = new Date(Date.now() + 7200000);
      const input: ScheduleTaskReminderInput = {
        taskId: "task-30",
        reminderDate,
      };

      // Act
      await useCase.execute(input);

      // Assert
      const call = mockJobQueueService.addJob.mock.calls[0];
      const jobData = call[2] as {
        taskId: string;
        taskTitle: string;
        entityId: string;
      };
      expect(jobData.taskId).toBe("task-30");
      expect(jobData.taskTitle).toBe("Task Title for Reminder");
      expect(jobData.entityId).toBe("task-30");
    });

    it("should include createdAt timestamp in job data", async () => {
      // Arrange
      const task = new Task(
        "task-31",
        "Task",
        null,
        TaskStatus.PENDING,
        null,
        new Date(),
        new Date(),
      );
      mockTaskRepository.setTask(task);

      const reminderDate = new Date(Date.now() + 3600000);
      const input: ScheduleTaskReminderInput = {
        taskId: "task-31",
        reminderDate,
      };

      // Act
      const beforeExecution = Date.now();
      await useCase.execute(input);
      const afterExecution = Date.now();

      // Assert
      const call = mockJobQueueService.addJob.mock.calls[0];
      const jobData = call[2] as { createdAt: number };
      expect(jobData.createdAt).toBeGreaterThanOrEqual(beforeExecution);
      expect(jobData.createdAt).toBeLessThanOrEqual(afterExecution);
    });
  });

  describe("edge cases", () => {
    it("should handle task with null description", async () => {
      // Arrange
      const task = new Task(
        "task-40",
        "Task without description",
        null,
        TaskStatus.PENDING,
        null,
        new Date(),
        new Date(),
      );
      mockTaskRepository.setTask(task);

      const reminderDate = new Date(Date.now() + 3600000);
      const input: ScheduleTaskReminderInput = {
        taskId: "task-40",
        reminderDate,
      };

      // Act & Assert
      await expect(useCase.execute(input)).resolves.toBeDefined();
    });

    it("should handle task with null createdBy", async () => {
      // Arrange
      const task = new Task(
        "task-41",
        "Anonymous Task",
        "Description",
        TaskStatus.PENDING,
        null,
        new Date(),
        new Date(),
      );
      mockTaskRepository.setTask(task);

      const reminderDate = new Date(Date.now() + 3600000);
      const input: ScheduleTaskReminderInput = {
        taskId: "task-41",
        reminderDate,
      };

      // Act & Assert
      await expect(useCase.execute(input)).resolves.toBeDefined();
    });

    it("should handle very short delay (1 second)", async () => {
      // Arrange
      const task = new Task(
        "task-42",
        "Task",
        null,
        TaskStatus.PENDING,
        null,
        new Date(),
        new Date(),
      );
      mockTaskRepository.setTask(task);

      const reminderDate = new Date(Date.now() + 1000); // 1 second
      const input: ScheduleTaskReminderInput = {
        taskId: "task-42",
        reminderDate,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toBeDefined();
      const call = mockJobQueueService.addJob.mock.calls[0];
      const jobOptions = call[3] as { delay: number };
      expect(jobOptions.delay).toBeGreaterThan(0);
      expect(jobOptions.delay).toBeLessThanOrEqual(1000);
    });

    it("should return correct jobId from job queue service", async () => {
      // Arrange
      const task = new Task(
        "task-43",
        "Task",
        null,
        TaskStatus.PENDING,
        null,
        new Date(),
        new Date(),
      );
      mockTaskRepository.setTask(task);

      const customJobId = "custom-job-id-456";
      mockJobQueueService.addJob.mockResolvedValueOnce(customJobId);

      const reminderDate = new Date(Date.now() + 3600000);
      const input: ScheduleTaskReminderInput = {
        taskId: "task-43",
        reminderDate,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.jobId).toBe(customJobId);
    });

    it("should propagate job queue service errors", async () => {
      // Arrange
      const task = new Task(
        "task-44",
        "Task",
        null,
        TaskStatus.PENDING,
        null,
        new Date(),
        new Date(),
      );
      mockTaskRepository.setTask(task);

      const jobQueueError = new Error("Redis connection failed");
      mockJobQueueService.addJob.mockRejectedValueOnce(jobQueueError);

      const reminderDate = new Date(Date.now() + 3600000);
      const input: ScheduleTaskReminderInput = {
        taskId: "task-44",
        reminderDate,
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        "Redis connection failed",
      );
    });

    it("should verify job options include all required fields", async () => {
      // Arrange
      const task = new Task(
        "task-45",
        "Task",
        null,
        TaskStatus.PENDING,
        null,
        new Date(),
        new Date(),
      );
      mockTaskRepository.setTask(task);

      const reminderDate = new Date(Date.now() + 3600000);
      const input: ScheduleTaskReminderInput = {
        taskId: "task-45",
        reminderDate,
      };

      // Act
      await useCase.execute(input);

      // Assert
      const call = mockJobQueueService.addJob.mock.calls[0];
      const jobOptions = call[3] as {
        delay: number;
        attempts: number;
        priority: number;
      };
      expect(jobOptions).toMatchObject({
        delay: expect.any(Number),
        attempts: 3,
        priority: 5,
      });
    });
  });
});
