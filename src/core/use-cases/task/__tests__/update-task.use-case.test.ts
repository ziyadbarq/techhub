/**
 * UpdateTaskUseCase - Unit Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { UpdateTaskUseCase } from "../update-task.use-case";
import type { ITaskRepository } from "@/core/repositories/task.repository.interface";
import { Task } from "@/core/domain/entities/task.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import { ValidationError } from "@/core/domain/errors/validation.error";

class MockTaskRepository implements Partial<ITaskRepository> {
  private tasks = new Map<string, Task>();
  private idCounter = 1;

  async findById(id: string): Promise<Task | null> {
    return this.tasks.get(id) || null;
  }

  async update(task: Task): Promise<Task> {
    this.tasks.set(task.id, task);
    return task;
  }

  setTask(task: Task): Task {
    // If task doesn't have ID, create a new Task instance with an ID
    let taskToStore = task;
    if (!task.id) {
      const newId = `task-${this.idCounter++}`;
      taskToStore = new Task(
        newId,
        task.title,
        task.description,
        task.status,
        task.createdBy,
        task.createdAt,
        task.updatedAt,
      );
    }
    this.tasks.set(taskToStore.id, taskToStore);
    return taskToStore;
  }

  clear(): void {
    this.tasks.clear();
    this.idCounter = 1;
  }
}

describe("UpdateTaskUseCase", () => {
  let useCase: UpdateTaskUseCase;
  let mockRepository: MockTaskRepository;

  beforeEach(() => {
    mockRepository = new MockTaskRepository();
    useCase = new UpdateTaskUseCase(
      mockRepository as unknown as ITaskRepository,
    );
  });

  describe("execute - successful update", () => {
    it("should update task title", async () => {
      // Arrange
      const task = Task.create({ title: "Original Title" });
      const taskWithId = mockRepository.setTask(task);

      // Act
      const result = await useCase.execute({
        id: taskWithId.id,
        title: "Updated Title",
      });

      // Assert
      expect(result.title).toBe("Updated Title");
    });

    it("should update task description", async () => {
      // Arrange
      const task = Task.create({
        title: "Task",
        description: "Original Description",
      });
      const taskWithId = mockRepository.setTask(task);

      // Act
      const result = await useCase.execute({
        id: taskWithId.id,
        description: "Updated Description",
      });

      // Assert
      expect(result.description).toBe("Updated Description");
    });

    it("should update both title and description", async () => {
      // Arrange
      const task = Task.create({
        title: "Original",
        description: "Original Desc",
      });
      const taskWithId = mockRepository.setTask(task);

      // Act
      const result = await useCase.execute({
        id: taskWithId.id,
        title: "New Title",
        description: "New Description",
      });

      // Assert
      expect(result.title).toBe("New Title");
      expect(result.description).toBe("New Description");
    });

    it("should clear description when set to null", async () => {
      // Arrange
      const task = Task.create({
        title: "Task",
        description: "Has description",
      });
      const taskWithId = mockRepository.setTask(task);

      // Act
      const result = await useCase.execute({
        id: taskWithId.id,
        description: null,
      });

      // Assert
      expect(result.description).toBeNull();
    });

    it("should not change fields when not provided", async () => {
      // Arrange
      const task = Task.create({
        title: "Original Title",
        description: "Original Description",
      });
      const taskWithId = mockRepository.setTask(task);

      // Act - Only update title
      const result = await useCase.execute({
        id: taskWithId.id,
        title: "New Title",
      });

      // Assert - Description should remain unchanged
      expect(result.title).toBe("New Title");
      expect(result.description).toBe("Original Description");
    });
  });

  describe("execute - validation", () => {
    it("should throw NotFoundError when task does not exist", async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          id: "non-existent-id",
          title: "New Title",
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw ValidationError for empty title", async () => {
      // Arrange
      const task = Task.create({ title: "Original" });
      const taskWithId = mockRepository.setTask(task);

      // Act & Assert
      await expect(
        useCase.execute({
          id: taskWithId.id,
          title: "",
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for title exceeding 200 characters", async () => {
      // Arrange
      const task = Task.create({ title: "Original" });
      const taskWithId = mockRepository.setTask(task);

      // Act & Assert
      await expect(
        useCase.execute({
          id: taskWithId.id,
          title: "A".repeat(201),
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("edge cases", () => {
    it("should trim whitespace from updated title", async () => {
      // Arrange
      const task = Task.create({ title: "Original" });
      const taskWithId = mockRepository.setTask(task);

      // Act
      const result = await useCase.execute({
        id: taskWithId.id,
        title: "  Updated Title  ",
      });

      // Assert
      expect(result.title).toBe("Updated Title");
    });

    it("should handle title at max length (200 chars)", async () => {
      // Arrange
      const task = Task.create({ title: "Original" });
      const taskWithId = mockRepository.setTask(task);

      // Act
      const result = await useCase.execute({
        id: taskWithId.id,
        title: "A".repeat(200),
      });

      // Assert
      expect(result.title.length).toBe(200);
    });
  });
});
