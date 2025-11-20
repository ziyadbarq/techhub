/**
 * ListTasksUseCase - Unit Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ListTasksUseCase } from "../list-tasks.use-case";
import type {
  ITaskRepository,
  TaskFilterOptions,
} from "@/core/repositories/task.repository.interface";
import { Task, TaskStatus } from "@/core/domain/entities/task.entity";

class MockTaskRepository implements Partial<ITaskRepository> {
  private tasks: Task[] = [];

  async findAll(filter?: TaskFilterOptions): Promise<Task[]> {
    let result = [...this.tasks];

    if (filter?.status) {
      result = result.filter((t) => t.status === filter.status);
    }

    return result;
  }

  addTasks(tasks: Task[]): void {
    this.tasks.push(...tasks);
  }

  clear(): void {
    this.tasks = [];
  }
}

describe("ListTasksUseCase", () => {
  let useCase: ListTasksUseCase;
  let mockRepository: MockTaskRepository;

  beforeEach(() => {
    mockRepository = new MockTaskRepository();
    useCase = new ListTasksUseCase(
      mockRepository as unknown as ITaskRepository,
    );
  });

  it("should return all tasks when no filter provided", async () => {
    // Arrange
    const tasks = [
      Task.create({ title: "Task 1" }),
      Task.create({ title: "Task 2", status: TaskStatus.IN_PROGRESS }),
      Task.create({ title: "Task 3", status: TaskStatus.COMPLETED }),
    ];
    mockRepository.addTasks(tasks);

    // Act
    const result = await useCase.execute();

    // Assert
    expect(result).toHaveLength(3);
  });

  it("should return empty array when no tasks exist", async () => {
    // Act
    const result = await useCase.execute();

    // Assert
    expect(result).toEqual([]);
  });

  it("should filter tasks by status", async () => {
    // Arrange
    const tasks = [
      Task.create({ title: "Pending Task", status: TaskStatus.PENDING }),
      Task.create({
        title: "In Progress Task",
        status: TaskStatus.IN_PROGRESS,
      }),
      Task.create({ title: "Completed Task", status: TaskStatus.COMPLETED }),
    ];
    mockRepository.addTasks(tasks);

    // Act
    const result = await useCase.execute({ status: TaskStatus.IN_PROGRESS });

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe(TaskStatus.IN_PROGRESS);
  });

  it("should return multiple tasks with same status", async () => {
    // Arrange
    const tasks = [
      Task.create({ title: "Pending 1", status: TaskStatus.PENDING }),
      Task.create({ title: "Pending 2", status: TaskStatus.PENDING }),
      Task.create({ title: "Completed", status: TaskStatus.COMPLETED }),
    ];
    mockRepository.addTasks(tasks);

    // Act
    const result = await useCase.execute({ status: TaskStatus.PENDING });

    // Assert
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.status === TaskStatus.PENDING)).toBe(true);
  });
});
