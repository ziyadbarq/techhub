/**
 * DeleteTaskUseCase - Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { DeleteTaskUseCase } from "../delete-task.use-case";
import type { ITaskRepository } from "@/core/repositories/task.repository.interface";
import { Task } from "@/core/domain/entities/task.entity";

class MockTaskRepository implements Partial<ITaskRepository> {
  private tasks = new Map<string, Task>();
  private idCounter = 1;

  delete = vi.fn(async (id: string) => {
    this.tasks.delete(id);
  });

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

describe("DeleteTaskUseCase", () => {
  let useCase: DeleteTaskUseCase;
  let mockRepository: MockTaskRepository;

  beforeEach(() => {
    mockRepository = new MockTaskRepository();
    useCase = new DeleteTaskUseCase(
      mockRepository as unknown as ITaskRepository,
    );
  });

  it("should delete existing task", async () => {
    // Arrange
    const task = mockRepository.setTask(
      Task.create({ title: "Task to Delete" }),
    );

    // Act
    await useCase.execute(task.id);

    // Assert
    expect(mockRepository.delete).toHaveBeenCalledWith(task.id);
    const found = await mockRepository.findById(task.id);
    expect(found).toBeNull();
  });

  it("should handle deletion of non-existent task", async () => {
    // Act & Assert - Should not throw
    await expect(useCase.execute("non-existent-id")).resolves.toBeUndefined();
    expect(mockRepository.delete).toHaveBeenCalledWith("non-existent-id");
  });

  it("should delete only the specified task", async () => {
    // Arrange
    const task1 = mockRepository.setTask(Task.create({ title: "Task 1" }));
    const task2 = mockRepository.setTask(Task.create({ title: "Task 2" }));
    const task3 = mockRepository.setTask(Task.create({ title: "Task 3" }));

    // Verify each task has unique ID
    expect(task1.id).not.toBe(task2.id);
    expect(task2.id).not.toBe(task3.id);

    // Verify all tasks are present before deletion
    expect(await mockRepository.findById(task1.id)).not.toBeNull();
    expect(await mockRepository.findById(task2.id)).not.toBeNull();
    expect(await mockRepository.findById(task3.id)).not.toBeNull();

    // Act
    await useCase.execute(task2.id);

    // Assert - Task 2 should be deleted, others should remain
    expect(await mockRepository.findById(task1.id)).not.toBeNull();
    expect(await mockRepository.findById(task2.id)).toBeNull();
    expect(await mockRepository.findById(task3.id)).not.toBeNull();
  });
});
