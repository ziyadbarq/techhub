/**
 * GetTaskUseCase - Unit Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { GetTaskUseCase } from "../get-task.use-case";
import type { ITaskRepository } from "@/core/repositories/task.repository.interface";
import { Task } from "@/core/domain/entities/task.entity";

class MockTaskRepository implements Partial<ITaskRepository> {
  private tasks = new Map<string, Task>();
  private idCounter = 1;

  async findById(id: string): Promise<Task | null> {
    return this.tasks.get(id) || null;
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

describe("GetTaskUseCase", () => {
  let useCase: GetTaskUseCase;
  let mockRepository: MockTaskRepository;

  beforeEach(() => {
    mockRepository = new MockTaskRepository();
    useCase = new GetTaskUseCase(mockRepository as unknown as ITaskRepository);
  });

  it("should return task when found", async () => {
    // Arrange
    const task = mockRepository.setTask(Task.create({ title: "Test Task" }));

    // Act
    const result = await useCase.execute(task.id);

    // Assert
    expect(result).not.toBeNull();
    expect(result!.id).toBe(task.id);
    expect(result!.title).toBe("Test Task");
  });

  it("should return null when task not found", async () => {
    // Act
    const result = await useCase.execute("non-existent-id");

    // Assert
    expect(result).toBeNull();
  });

  it("should return correct task when multiple tasks exist", async () => {
    // Arrange
    const task1 = mockRepository.setTask(Task.create({ title: "Task 1" }));
    const task2 = mockRepository.setTask(Task.create({ title: "Task 2" }));
    const task3 = mockRepository.setTask(Task.create({ title: "Task 3" }));

    // Verify each task has unique ID
    expect(task1.id).not.toBe(task2.id);
    expect(task2.id).not.toBe(task3.id);

    // Act
    const result = await useCase.execute(task2.id);

    // Assert
    expect(result).not.toBeNull();
    expect(result!.id).toBe(task2.id);
    expect(result!.title).toBe("Task 2");
  });
});
