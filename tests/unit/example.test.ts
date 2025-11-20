/**
 * Example Unit Test
 *
 * This is a simple unit test that doesn't require database setup.
 * Use for testing pure functions, utilities, and domain logic.
 */

import { describe, it, expect } from "vitest";
import { Task, TaskStatus } from "@/core/domain/entities/task.entity";
import { ValidationError } from "@/core/domain/errors/validation.error";

describe("Task Entity Unit Tests", () => {
  describe("Task.create", () => {
    it("should create a task with valid data", () => {
      // Arrange & Act
      const task = Task.create({
        title: "Test Task",
        description: "Test Description",
      });

      // Assert
      expect(task.title).toBe("Test Task");
      expect(task.description).toBe("Test Description");
      expect(task.status).toBe(TaskStatus.PENDING);
    });

    it("should throw ValidationError for empty title", () => {
      // Act & Assert
      expect(() => {
        Task.create({ title: "" });
      }).toThrow(ValidationError);
    });

    it("should throw ValidationError for title exceeding 200 characters", () => {
      // Arrange
      const longTitle = "A".repeat(201);

      // Act & Assert
      expect(() => {
        Task.create({ title: longTitle });
      }).toThrow(ValidationError);
    });
  });

  describe("Task methods", () => {
    it("should complete a pending task", () => {
      // Arrange
      const task = Task.create({ title: "Test" });
      expect(task.isPending()).toBe(true);

      // Act
      task.complete();

      // Assert
      expect(task.isCompleted()).toBe(true);
      expect(task.status).toBe(TaskStatus.COMPLETED);
    });

    it("should start a pending task", () => {
      // Arrange
      const task = Task.create({ title: "Test" });

      // Act
      task.start();

      // Assert
      expect(task.isInProgress()).toBe(true);
      expect(task.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it("should throw error when completing an already completed task", () => {
      // Arrange
      const task = Task.create({ title: "Test" });
      task.complete();

      // Act & Assert
      expect(() => {
        task.complete();
      }).toThrow(ValidationError);
    });
  });
});
