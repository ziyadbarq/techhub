/**
 * Complete Task Use Case Tests
 *
 * Tests for CompleteTaskUseCase including job queue integration.
 * Demonstrates testing background job triggering.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { CompleteTaskUseCase } from "@/core/use-cases/task/complete-task.use-case";
import type { ITaskRepository } from "@/core/repositories/task.repository.interface";
import type { IJobQueueService } from "@/core/services/job-queue.service.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { Task, TaskStatus } from "@/core/domain/entities/task.entity";
import { createMockJobQueue, waitForJob } from "../helpers/queue.helper";
import { TASK_JOBS } from "@/core/domain/jobs/job-names";

/**
 * Mock task repository for testing
 */
class MockTaskRepository implements ITaskRepository {
  private tasks: Map<string, Task> = new Map();

  async create(task: Task): Promise<Task> {
    this.tasks.set(task.id, task);
    return task;
  }

  async findById(id: string): Promise<Task | null> {
    return this.tasks.get(id) || null;
  }

  async update(task: Task): Promise<Task> {
    this.tasks.set(task.id, task);
    return task;
  }

  async delete(id: string): Promise<void> {
    this.tasks.delete(id);
  }

  async findAll(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async countByStatus(): Promise<Record<TaskStatus, number>> {
    const counts = {
      [TaskStatus.PENDING]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.COMPLETED]: 0,
    };

    Array.from(this.tasks.values()).forEach((task) => {
      counts[task.status]++;
    });

    return counts;
  }

  // Test helper
  addTask(task: Task): void {
    this.tasks.set(task.id, task);
  }

  clear(): void {
    this.tasks.clear();
  }
}

/**
 * Mock logger for testing
 */
const mockLogger: ILoggerService = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  child: () => mockLogger,
  startTimer: (operation: string, context?: Record<string, unknown>) => ({
    startTime: Date.now(),
    operation,
    context,
  }),
  endTimer: () => {},
  audit: () => {},
  withTiming: async <T>(_operation: string, fn: () => Promise<T>): Promise<T> =>
    fn(),
};

describe("CompleteTaskUseCase", () => {
  let container: Container;
  let completeTaskUseCase: CompleteTaskUseCase;
  let mockTaskRepository: MockTaskRepository;
  let mockJobQueue: ReturnType<typeof createMockJobQueue>;

  beforeEach(() => {
    // Create fresh mocks for each test
    mockTaskRepository = new MockTaskRepository();
    mockJobQueue = createMockJobQueue();

    // Setup DI container
    container = new Container();

    // Bind mocks
    container
      .bind<ITaskRepository>(DI_TOKENS.ITaskRepository)
      .toConstantValue(mockTaskRepository);

    container
      .bind<IJobQueueService>(DI_TOKENS.IJobQueueService)
      .toConstantValue(mockJobQueue);

    container
      .bind<ILoggerService>(DI_TOKENS.ILoggerService)
      .toConstantValue(mockLogger);

    container
      .bind<CompleteTaskUseCase>(DI_TOKENS.CompleteTaskUseCase)
      .to(CompleteTaskUseCase);

    // Get use case instance
    completeTaskUseCase = container.get<CompleteTaskUseCase>(
      DI_TOKENS.CompleteTaskUseCase,
    );
  });

  describe("execute", () => {
    it("should complete a task and queue notification job", async () => {
      // Arrange
      const task = Task.create({
        title: "Test Task",
        description: "Test Description",
        status: TaskStatus.PENDING,
      });
      mockTaskRepository.addTask(task);

      // Act
      const completedTask = await completeTaskUseCase.execute(task.id);

      // Assert - Task is completed
      expect(completedTask.isCompleted()).toBe(true);
      expect(completedTask.status).toBe(TaskStatus.COMPLETED);

      // Assert - Notification job was queued
      const jobs = mockJobQueue.getJobsByName(
        TASK_JOBS.TASK_COMPLETED_NOTIFICATION,
      );
      expect(jobs).toHaveLength(1);
      expect(jobs[0].data).toMatchObject({
        taskId: task.id,
        taskTitle: task.title,
      });
    });

    it("should throw error if task not found", async () => {
      // Act & Assert
      await expect(
        completeTaskUseCase.execute("non-existent-id"),
      ).rejects.toThrow("Task not found");

      // Assert - No job was queued
      const jobs = mockJobQueue.getAllJobs();
      expect(jobs).toHaveLength(0);
    });

    it("should throw error if task already completed", async () => {
      // Arrange
      const task = Task.create({
        title: "Test Task",
        description: "Test Description",
        status: TaskStatus.PENDING,
      });
      task.complete(); // Already completed
      mockTaskRepository.addTask(task);

      // Act & Assert
      await expect(completeTaskUseCase.execute(task.id)).rejects.toThrow();

      // Assert - No additional job was queued
      const jobs = mockJobQueue.getAllJobs();
      expect(jobs).toHaveLength(0);
    });

    it("should set correct job priority for notifications", async () => {
      // Arrange
      const task = Task.create({
        title: "High Priority Task",
        description: "Important task",
        status: TaskStatus.PENDING,
      });
      mockTaskRepository.addTask(task);

      // Act
      await completeTaskUseCase.execute(task.id);

      // Assert - Job was queued with high priority
      const job = await waitForJob(
        mockJobQueue,
        TASK_JOBS.TASK_COMPLETED_NOTIFICATION,
      );
      expect(job).toBeDefined();
      expect(job.name).toBe(TASK_JOBS.TASK_COMPLETED_NOTIFICATION);
    });
  });
});
