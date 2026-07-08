/**
 * CSV Controller - Unit Tests
 *
 * Tests for CSV import/export server actions including:
 * - Export tasks to CSV
 * - Import tasks from CSV
 * - Validate CSV content
 * - Error handling
 * - Zod validation
 * - Bulk operations
 * - Response formatting
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  exportTasksToCSV,
  importTasksFromCSV,
  validateTasksCSV,
} from "../csv.controller";
import { TaskStatus } from "@/core/domain/entities/task.entity";
import type { TaskDTO } from "@/interface-adapters/presenters/task.presenter";
import type { Task } from "@/core/domain/entities/task.entity";

// Mock logger service
const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  startTimer: vi.fn(() => ({ startTime: Date.now() })),
  endTimer: vi.fn(),
};

// Mock CSV service
const mockCSVService = {
  exportToCSV: vi.fn(),
  parseCSV: vi.fn(),
};

// Mock use cases
const mockCreateTaskUseCase = {
  execute: vi.fn(),
};

// Mock requirePermission
vi.mock("@/lib/permissions/server", () => ({
  requirePermission: vi.fn(),
}));

// Mock the DI container
vi.mock("@/di/container", () => ({
  getContainer: vi.fn(() => ({
    get: vi.fn((token) => {
      const tokenKey = token.toString();
      if (tokenKey === Symbol.for("ICSVService").toString()) {
        return mockCSVService;
      }
      if (tokenKey === Symbol.for("CreateTaskUseCase").toString()) {
        return mockCreateTaskUseCase;
      }
      if (tokenKey === Symbol.for("ILoggerService").toString()) {
        return mockLogger;
      }
      return null;
    }),
  })),
}));

describe("CSV Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Sample task data
  const createMockTaskDTO = (overrides?: Partial<TaskDTO>): TaskDTO => ({
    id: "task-1",
    title: "Test Task",
    description: "Test description",
    status: TaskStatus.PENDING,
    createdBy: null,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    ...overrides,
  });

  const createMockTask = (overrides?: Partial<Task>): Task =>
    ({
      id: "task-1",
      title: "Test Task",
      description: "Test description",
      status: TaskStatus.PENDING,
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
      ...overrides,
    }) as Task;

  describe("exportTasksToCSV", () => {
    it("should export tasks to CSV successfully", async () => {
      // Arrange
      const mockTasks = [
        createMockTaskDTO(),
        createMockTaskDTO({ id: "task-2", title: "Task 2" }),
      ];
      mockCSVService.exportToCSV.mockReturnValue(
        "Title,Description,Status\nTest Task,Test description,pending",
      );

      // Act
      const result = await exportTasksToCSV(mockTasks);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data).toBe("string");
        expect(result.data).toContain("Title");
      }
    });

    it("should call CSV service with correct format", async () => {
      // Arrange
      const mockTasks = [createMockTaskDTO()];
      mockCSVService.exportToCSV.mockReturnValue("csv content");

      // Act
      await exportTasksToCSV(mockTasks);

      // Assert
      expect(mockCSVService.exportToCSV).toHaveBeenCalledWith([
        {
          Title: "Test Task",
          Description: "Test description",
          Status: TaskStatus.PENDING,
          Created: "2024-01-01T00:00:00Z",
          Updated: "2024-01-01T00:00:00Z",
        },
      ]);
    });

    it("should handle empty description", async () => {
      // Arrange
      const mockTasks = [createMockTaskDTO({ description: null })];
      mockCSVService.exportToCSV.mockReturnValue("csv content");

      // Act
      await exportTasksToCSV(mockTasks);

      // Assert
      expect(mockCSVService.exportToCSV).toHaveBeenCalledWith([
        expect.objectContaining({
          Description: "",
        }),
      ]);
    });

    it("should return error when no tasks to export", async () => {
      // Act
      const result = await exportTasksToCSV([]);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("No tasks to export");
      }
    });

    it("should handle export errors", async () => {
      // Arrange
      mockCSVService.exportToCSV.mockImplementation(() => {
        throw new Error("Export failed");
      });

      // Act
      const result = await exportTasksToCSV([createMockTaskDTO()]);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Export failed");
      }
    });
  });

  describe("importTasksFromCSV", () => {
    it("should import tasks from CSV successfully", async () => {
      // Arrange
      const csvString = "Title,Description,Status\nTask 1,Desc 1,pending";
      const mockParseResult = {
        data: [
          {
            title: "Task 1",
            description: "Desc 1",
            status: TaskStatus.PENDING,
          },
        ],
        errors: [],
        totalRows: 1,
        errorCount: 0,
      };
      mockCSVService.parseCSV.mockReturnValue(mockParseResult);
      mockCreateTaskUseCase.execute.mockResolvedValue(createMockTask());

      // Act
      const result = await importTasksFromCSV(csvString);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.successCount).toBe(1);
        expect(result.data.errorCount).toBe(0);
        expect(result.data.totalRows).toBe(1);
      }
    });

    it("should call CSV service with correct schema and header map", async () => {
      // Arrange
      const csvString = "Title,Description,Status\nTask 1,Desc 1,pending";
      mockCSVService.parseCSV.mockReturnValue({
        data: [],
        errors: [],
        totalRows: 0,
        errorCount: 0,
      });

      // Act
      await importTasksFromCSV(csvString);

      // Assert
      expect(mockCSVService.parseCSV).toHaveBeenCalledWith(
        csvString,
        expect.any(Object), // Zod schema
        {
          headerMap: {
            Title: "title",
            Description: "description",
            Status: "status",
          },
        },
      );
    });

    it("should create tasks in database", async () => {
      // Arrange
      const csvString = "Title,Description,Status\nTask 1,Desc 1,pending";
      const mockParseResult = {
        data: [
          {
            title: "Task 1",
            description: "Desc 1",
            status: TaskStatus.PENDING,
          },
        ],
        errors: [],
        totalRows: 1,
        errorCount: 0,
      };
      mockCSVService.parseCSV.mockReturnValue(mockParseResult);
      mockCreateTaskUseCase.execute.mockResolvedValue(createMockTask());

      // Act
      await importTasksFromCSV(csvString);

      // Assert
      expect(mockCreateTaskUseCase.execute).toHaveBeenCalledWith({
        title: "Task 1",
        description: "Desc 1",
        status: TaskStatus.PENDING,
      });
    });

    it("should handle validation errors", async () => {
      // Arrange
      const csvString = "Title,Description,Status\n,Invalid,invalid";
      const mockParseResult = {
        data: [],
        errors: [
          { row: 1, message: "Title is required" },
          { row: 1, message: "Invalid status" },
        ],
        totalRows: 1,
        errorCount: 2,
      };
      mockCSVService.parseCSV.mockReturnValue(mockParseResult);

      // Act
      const result = await importTasksFromCSV(csvString);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.errorCount).toBe(2);
        expect(result.data.successCount).toBe(0);
        expect(result.data.errors).toHaveLength(2);
      }
    });

    it("should handle database errors during import", async () => {
      // Arrange
      const csvString = "Title,Description,Status\nTask 1,Desc 1,pending";
      const mockParseResult = {
        data: [
          {
            title: "Task 1",
            description: "Desc 1",
            status: TaskStatus.PENDING,
          },
        ],
        errors: [],
        totalRows: 1,
        errorCount: 0,
      };
      mockCSVService.parseCSV.mockReturnValue(mockParseResult);
      mockCreateTaskUseCase.execute.mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const result = await importTasksFromCSV(csvString);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.successCount).toBe(0);
        expect(result.data.errorCount).toBe(1);
        expect(result.data.errors[0].message).toBe("Database error");
      }
    });

    it("should continue importing after individual task failures", async () => {
      // Arrange
      const csvString =
        "Title,Description,Status\nTask 1,Desc 1,pending\nTask 2,Desc 2,pending";
      const mockParseResult = {
        data: [
          {
            title: "Task 1",
            description: "Desc 1",
            status: TaskStatus.PENDING,
          },
          {
            title: "Task 2",
            description: "Desc 2",
            status: TaskStatus.PENDING,
          },
        ],
        errors: [],
        totalRows: 2,
        errorCount: 0,
      };
      mockCSVService.parseCSV.mockReturnValue(mockParseResult);
      mockCreateTaskUseCase.execute
        .mockRejectedValueOnce(new Error("First task failed"))
        .mockResolvedValueOnce(createMockTask({ id: "task-2" }));

      // Act
      const result = await importTasksFromCSV(csvString);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.successCount).toBe(1);
        expect(result.data.errorCount).toBe(1);
      }
    });

    it("should combine validation and creation errors", async () => {
      // Arrange
      const csvString =
        "Title,Description,Status\n,Invalid,invalid\nTask 1,Desc 1,pending";
      const mockParseResult = {
        data: [
          {
            title: "Task 1",
            description: "Desc 1",
            status: TaskStatus.PENDING,
          },
        ],
        errors: [{ row: 1, message: "Validation error" }],
        totalRows: 2,
        errorCount: 1,
      };
      mockCSVService.parseCSV.mockReturnValue(mockParseResult);
      mockCreateTaskUseCase.execute.mockRejectedValue(
        new Error("Creation error"),
      );

      // Act
      const result = await importTasksFromCSV(csvString);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.errors.length).toBe(2);
      }
    });

    it("should return error response on CSV service failure", async () => {
      // Arrange
      mockCSVService.parseCSV.mockImplementation(() => {
        throw new Error("Parse error");
      });

      // Act
      const result = await importTasksFromCSV("invalid csv");

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Parse error");
      }
    });
  });

  describe("validateTasksCSV", () => {
    it("should validate CSV successfully", async () => {
      // Arrange
      const csvString = "Title,Description,Status\nTask 1,Desc 1,pending";
      const mockParseResult = {
        data: [
          {
            title: "Task 1",
            description: "Desc 1",
            status: TaskStatus.PENDING,
          },
        ],
        errors: [],
        totalRows: 1,
        errorCount: 0,
      };
      mockCSVService.parseCSV.mockReturnValue(mockParseResult);

      // Act
      const result = await validateTasksCSV(csvString);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isValid).toBe(true);
        expect(result.data.errorCount).toBe(0);
        expect(result.data.totalRows).toBe(1);
      }
    });

    it("should return preview of first 5 rows", async () => {
      // Arrange
      const mockData = Array(10)
        .fill(null)
        .map((_, i) => ({
          title: `Task ${i}`,
          description: `Desc ${i}`,
          status: TaskStatus.PENDING,
        }));
      const mockParseResult = {
        data: mockData,
        errors: [],
        totalRows: 10,
        errorCount: 0,
      };
      mockCSVService.parseCSV.mockReturnValue(mockParseResult);

      // Act
      const result = await validateTasksCSV("csv content");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.preview).toHaveLength(5);
      }
    });

    it("should detect validation errors", async () => {
      // Arrange
      const csvString = "Title,Description,Status\n,Invalid,invalid";
      const mockParseResult = {
        data: [],
        errors: [{ row: 1, message: "Title is required" }],
        totalRows: 1,
        errorCount: 1,
      };
      mockCSVService.parseCSV.mockReturnValue(mockParseResult);

      // Act
      const result = await validateTasksCSV(csvString);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isValid).toBe(false);
        expect(result.data.errorCount).toBe(1);
        expect(result.data.errors).toHaveLength(1);
      }
    });

    it("should call CSV service with correct schema", async () => {
      // Arrange
      const csvString = "Title,Description,Status\nTask 1,Desc 1,pending";
      mockCSVService.parseCSV.mockReturnValue({
        data: [],
        errors: [],
        totalRows: 0,
        errorCount: 0,
      });

      // Act
      await validateTasksCSV(csvString);

      // Assert
      expect(mockCSVService.parseCSV).toHaveBeenCalledWith(
        csvString,
        expect.any(Object), // Zod schema
        {
          headerMap: {
            Title: "title",
            Description: "description",
            Status: "status",
          },
        },
      );
    });

    it("should not create tasks during validation", async () => {
      // Arrange
      const csvString = "Title,Description,Status\nTask 1,Desc 1,pending";
      mockCSVService.parseCSV.mockReturnValue({
        data: [
          {
            title: "Task 1",
            description: "Desc 1",
            status: TaskStatus.PENDING,
          },
        ],
        errors: [],
        totalRows: 1,
        errorCount: 0,
      });

      // Act
      await validateTasksCSV(csvString);

      // Assert
      expect(mockCreateTaskUseCase.execute).not.toHaveBeenCalled();
    });

    it("should return error response on CSV service failure", async () => {
      // Arrange
      mockCSVService.parseCSV.mockImplementation(() => {
        throw new Error("Parse error");
      });

      // Act
      const result = await validateTasksCSV("invalid csv");

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Parse error");
      }
    });
  });

  describe("error handling", () => {
    it("should handle CSV service errors gracefully", async () => {
      // Arrange
      mockCSVService.exportToCSV.mockImplementation(() => {
        throw new Error("Service error");
      });

      // Act
      const result = await exportTasksToCSV([createMockTaskDTO()]);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Service error");
      }
    });

    it("should handle use case errors during import", async () => {
      // Arrange
      mockCSVService.parseCSV.mockReturnValue({
        data: [
          {
            title: "Task 1",
            description: "Desc 1",
            status: TaskStatus.PENDING,
          },
        ],
        errors: [],
        totalRows: 1,
        errorCount: 0,
      });
      mockCreateTaskUseCase.execute.mockRejectedValue(
        new Error("Use case error"),
      );

      // Act
      const result = await importTasksFromCSV("csv content");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.errorCount).toBe(1);
        expect(result.data.errors[0].message).toBe("Use case error");
      }
    });

    it("should handle malformed CSV", async () => {
      // Arrange
      mockCSVService.parseCSV.mockImplementation(() => {
        throw new Error("Malformed CSV");
      });

      // Act
      const result = await validateTasksCSV("malformed");

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Malformed CSV");
      }
    });
  });

  describe("response format", () => {
    it("should return discriminated union with success=true for export", async () => {
      // Arrange
      mockCSVService.exportToCSV.mockReturnValue("csv content");

      // Act
      const result = await exportTasksToCSV([createMockTaskDTO()]);

      // Assert
      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result).toHaveProperty("data");
        expect(result).not.toHaveProperty("error");
      }
    });

    it("should return discriminated union with success=false for errors", async () => {
      // Arrange
      mockCSVService.exportToCSV.mockImplementation(() => {
        throw new Error("Test error");
      });

      // Act
      const result = await exportTasksToCSV([createMockTaskDTO()]);

      // Assert
      expect(result).toHaveProperty("success");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result).toHaveProperty("error");
        expect(result).not.toHaveProperty("data");
      }
    });

    it("should return success=true for import with partial errors", async () => {
      // Arrange
      mockCSVService.parseCSV.mockReturnValue({
        data: [],
        errors: [{ row: 1, message: "Error" }],
        totalRows: 1,
        errorCount: 1,
      });

      // Act
      const result = await importTasksFromCSV("csv content");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.errorCount).toBe(1);
      }
    });
  });

  describe("data validation", () => {
    it("should validate required fields", async () => {
      // Arrange
      const csvString = "Title,Description,Status\n,Desc,pending";
      mockCSVService.parseCSV.mockReturnValue({
        data: [],
        errors: [{ row: 1, message: "Title is required" }],
        totalRows: 1,
        errorCount: 1,
      });

      // Act
      const result = await validateTasksCSV(csvString);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isValid).toBe(false);
      }
    });

    it("should validate status enum values", async () => {
      // Arrange
      const csvString = "Title,Description,Status\nTask,Desc,invalid";
      mockCSVService.parseCSV.mockReturnValue({
        data: [],
        errors: [{ row: 1, message: "Invalid status" }],
        totalRows: 1,
        errorCount: 1,
      });

      // Act
      const result = await validateTasksCSV(csvString);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.errorCount).toBe(1);
      }
    });

    it("should allow optional description", async () => {
      // Arrange
      mockCSVService.parseCSV.mockReturnValue({
        data: [
          {
            title: "Task 1",
            description: null,
            status: TaskStatus.PENDING,
          },
        ],
        errors: [],
        totalRows: 1,
        errorCount: 0,
      });

      // Act
      const result = await validateTasksCSV(
        "Title,Description,Status\nTask,,pending",
      );

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isValid).toBe(true);
      }
    });
  });
});
