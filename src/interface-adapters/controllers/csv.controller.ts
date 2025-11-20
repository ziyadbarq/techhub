/**
 * CSV Controller
 *
 * Server actions for CSV import/export operations.
 * Handles bulk task operations with validation and error reporting.
 */

"use server";

import { z } from "zod";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import type { ICSVService } from "@/core/services";
import type { TaskDTO } from "@/interface-adapters/presenters/task.presenter";
import { TaskStatus } from "@/core/domain/entities/task.entity";
import type { CreateTaskUseCase } from "@/core/use-cases/task";
import { presentTask } from "@/interface-adapters/presenters/task.presenter";

/**
 * Schema for validating imported task data
 */
const ImportTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional().nullable().default(null),
  status: z
    .enum([TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED])
    .optional()
    .default(TaskStatus.PENDING),
});

/**
 * Export tasks to CSV
 *
 * @param tasks - Array of tasks to export
 * @returns CSV string wrapped in ActionResponse
 */
export async function exportTasksToCSV(
  tasks: TaskDTO[],
): Promise<ActionResponse<string>> {
  try {
    if (tasks.length === 0) {
      return {
        success: false,
        error: "No tasks to export",
      };
    }

    const container = getContainer();
    const csvService = container.get<ICSVService>(DI_TOKENS.ICSVService);

    // Transform TaskDTO to export format
    const exportData = tasks.map((task) => ({
      Title: task.title,
      Description: task.description || "",
      Status: task.status,
      Created: task.createdAt,
      Updated: task.updatedAt,
    }));

    const csv = csvService.exportToCSV(exportData);

    return {
      success: true,
      data: csv,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "exportTasksToCSV" },
      "Failed to export tasks",
    );
  }
}

/**
 * Import tasks from CSV string
 *
 * @param csvString - CSV content as string
 * @returns Import result with created tasks and errors
 */
export async function importTasksFromCSV(csvString: string): Promise<
  ActionResponse<{
    tasks: TaskDTO[];
    totalRows: number;
    successCount: number;
    errorCount: number;
    errors: Array<{ row: number; message: string }>;
  }>
> {
  try {
    const container = getContainer();
    const csvService = container.get<ICSVService>(DI_TOKENS.ICSVService);
    const createTask = container.get<CreateTaskUseCase>(
      DI_TOKENS.CreateTaskUseCase,
    );

    // Parse and validate CSV
    const parseResult = csvService.parseCSV(csvString, ImportTaskSchema, {
      headerMap: {
        Title: "title",
        Description: "description",
        Status: "status",
      },
    });

    // Create tasks in database
    const createdTasks: TaskDTO[] = [];
    const createErrors: Array<{ row: number; message: string }> = [];

    for (let i = 0; i < parseResult.data.length; i++) {
      const taskData = parseResult.data[i];
      try {
        const task = await createTask.execute({
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
        });
        createdTasks.push(presentTask(task));
      } catch (error) {
        let errorMessage = "Failed to create task";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        createErrors.push({
          row: i + 1,
          message: errorMessage,
        });
      }
    }

    // Combine validation and creation errors
    const allErrors = [
      ...parseResult.errors,
      ...createErrors.map((err) => ({
        ...err,
        row: err.row + parseResult.errors.length, // Offset by validation errors
      })),
    ];

    return {
      success: true,
      data: {
        tasks: createdTasks,
        totalRows: parseResult.totalRows,
        successCount: createdTasks.length,
        errorCount: allErrors.length,
        errors: allErrors,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "importTasksFromCSV" },
      "Failed to import tasks",
    );
  }
}

/**
 * Validate CSV content without importing
 *
 * @param csvString - CSV content as string
 * @returns Validation result with preview and errors
 */
export async function validateTasksCSV(csvString: string): Promise<
  ActionResponse<{
    isValid: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    preview: any[];
    totalRows: number;
    errorCount: number;
    errors: Array<{ row: number; message: string }>;
  }>
> {
  try {
    const container = getContainer();
    const csvService = container.get<ICSVService>(DI_TOKENS.ICSVService);

    // Parse and validate CSV
    const parseResult = csvService.parseCSV(csvString, ImportTaskSchema, {
      headerMap: {
        Title: "title",
        Description: "description",
        Status: "status",
      },
    });

    // Get preview of first 5 valid rows
    const preview = parseResult.data.slice(0, 5);

    return {
      success: true,
      data: {
        isValid: parseResult.errorCount === 0,
        preview,
        totalRows: parseResult.totalRows,
        errorCount: parseResult.errorCount,
        errors: parseResult.errors,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "validateTasksCSV" },
      "Failed to validate CSV",
    );
  }
}
