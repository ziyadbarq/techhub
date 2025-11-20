/**
 * CreateTaskUseCase - Unit Tests
 *
 * Tests for the CreateTaskUseCase including:
 * - Successful task creation
 * - Validation errors
 * - Repository integration
 */

import { describe, it, expect, beforeEach } from "vitest";
import { CreateTaskUseCase } from "../create-task.use-case";
import type { ITaskRepository } from "@/core/repositories/task.repository.interface";
import type { Task } from "@/core/domain/entities/task.entity";
import { TaskStatus } from "@/core/domain/entities/task.entity";
import { ValidationError } from "@/core/domain/errors/validation.error";

/**
 * Mock Task Repository
 */
class MockTaskRepository implements Partial<ITaskRepository> {
  private tasks = new Map<string, Task>();
  private idCounter = 1;

  async create(task: Task): Promise<Task> {
    // Assign ID if not set (simulate repository behavior)
    if (!task.id) {
      (task as { id: string }).id = `task-${this.idCounter++}`;
    }
    this.tasks.set(task.id, task);
    return task;
  }

  async findById(id: string): Promise<Task | null> {
    return this.tasks.get(id) || null;
  }

  clear(): void {
    this.tasks.clear();
    this.idCounter = 1;
  }
}

describe("CreateTaskUseCase", () => {
  let useCase: CreateTaskUseCase;
  let mockRepository: MockTaskRepository;

  beforeEach(() => {
    mockRepository = new MockTaskRepository();
    useCase = new CreateTaskUseCase(
      mockRepository as unknown as ITaskRepository,
    );
  });

  describe("execute - successful creation", () => {
    it("should create a task with valid data", async () => {
      // Arrange
      const props = {
        title: "Test Task",
        description: "Test Description",
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result).toBeDefined();
      expect(result.title).toBe("Test Task");
      expect(result.description).toBe("Test Description");
      expect(result.status).toBe(TaskStatus.PENDING);
      expect(result.id).toBeDefined();
    });

    it("should create a task with only title", async () => {
      // Arrange
      const props = {
        title: "Minimal Task",
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result.title).toBe("Minimal Task");
      expect(result.description).toBeNull();
      expect(result.status).toBe(TaskStatus.PENDING);
    });

    it("should create a task with specific status", async () => {
      // Arrange
      const props = {
        title: "In Progress Task",
        status: TaskStatus.IN_PROGRESS,
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it("should persist task to repository", async () => {
      // Arrange
      const props = {
        title: "Persistent Task",
        description: "Should be saved",
      };

      // Act
      const created = await useCase.execute(props);

      // Assert - Verify task exists in repository
      const found = await mockRepository.findById(created.id);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.title).toBe("Persistent Task");
    });
  });

  describe("execute - validation", () => {
    it("should throw ValidationError for empty title", async () => {
      // Arrange
      const props = {
        title: "",
      };

      // Act & Assert
      await expect(useCase.execute(props)).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for title exceeding 200 characters", async () => {
      // Arrange
      const props = {
        title: "A".repeat(201),
      };

      // Act & Assert
      await expect(useCase.execute(props)).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for whitespace-only title", async () => {
      // Arrange
      const props = {
        title: "   ",
      };

      // Act & Assert
      await expect(useCase.execute(props)).rejects.toThrow(ValidationError);
    });
  });

  describe("edge cases", () => {
    it("should handle title at max length (200 chars)", async () => {
      // Arrange
      const props = {
        title: "A".repeat(200),
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result.title.length).toBe(200);
    });

    it("should trim whitespace from title", async () => {
      // Arrange
      const props = {
        title: "  Task with spaces  ",
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result.title).toBe("Task with spaces");
    });

    it("should handle special characters in title", async () => {
      // Arrange
      const props = {
        title: "Task with émojis 🚀 and special chars: @#$",
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result.title).toBe("Task with émojis 🚀 and special chars: @#$");
    });

    it("should handle long description up to limit", async () => {
      // Arrange
      const props = {
        title: "Task",
        description: "A".repeat(2000), // Max allowed length
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result.description?.length).toBe(2000);
    });
  });
});
