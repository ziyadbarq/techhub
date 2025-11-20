/**
 * Task Controller
 *
 * Server actions for Task CRUD operations.
 * Demonstrates Clean Architecture controller pattern with:
 * - Dependency injection via container
 * - Input validation with Zod
 * - Centralized error handling
 * - Presentation layer transformation
 * - Cache revalidation after mutations
 * - RBAC permission checks
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  TaskIdSchema,
  TaskFilterSchema,
  type CreateTaskDTO,
  type UpdateTaskDTO,
  type TaskFilterDTO,
} from "../dtos/generated/task.dto";
import {
  presentTask,
  presentTasks,
  type TaskDTO,
} from "../presenters/task.presenter";
import type {
  CreateTaskUseCase,
  ListTasksUseCase,
  GetTaskUseCase,
  UpdateTaskUseCase,
  DeleteTaskUseCase,
  CompleteTaskUseCase,
} from "@/core/use-cases/task";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { getCurrentUserId } from "@/lib/auth/session";

/**
 * Create a new task
 */
export async function createTaskAction(
  data: CreateTaskDTO,
): Promise<ActionResponse<TaskDTO>> {
  try {
    // Check permission
    await requirePermission(PERMISSIONS.TASKS_CREATE);

    // Get current user ID for ownership
    const userId = await getCurrentUserId();

    // Validate input
    const validated = CreateTaskSchema.parse(data);

    // Get use case from DI container
    const container = getContainer();
    const createTask = container.get<CreateTaskUseCase>(
      DI_TOKENS.CreateTaskUseCase,
    );

    // Execute use case
    const task = await createTask.execute({
      title: validated.title,
      description: validated.description ?? null,
      status: validated.status,
      createdBy: userId,
    });

    // Revalidate tasks list to show new task
    revalidatePath("/tasks");

    // Transform to DTO
    return {
      success: true,
      data: presentTask(task),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createTaskAction" },
      "Failed to create task",
    );
  }
}

/**
 * List all tasks with optional filtering
 */
export async function listTasksAction(
  filter?: TaskFilterDTO,
): Promise<ActionResponse<TaskDTO[]>> {
  try {
    // Check permission
    await requirePermission(PERMISSIONS.TASKS_VIEW);

    // Validate filter if provided
    const validated = filter ? TaskFilterSchema.parse(filter) : undefined;

    // Get use case from DI container
    const container = getContainer();
    const listTasks = container.get<ListTasksUseCase>(
      DI_TOKENS.ListTasksUseCase,
    );

    // Execute use case
    const tasks = await listTasks.execute(validated);

    // Transform to DTOs
    return {
      success: true,
      data: presentTasks(tasks),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listTasksAction" },
      "Failed to list tasks",
    );
  }
}

/**
 * Get a single task by ID
 */
export async function getTaskAction(
  id: string,
): Promise<ActionResponse<TaskDTO>> {
  try {
    // Check permission
    await requirePermission(PERMISSIONS.TASKS_VIEW);

    // Validate input
    const validated = TaskIdSchema.parse({ id });

    // Get use case from DI container
    const container = getContainer();
    const getTask = container.get<GetTaskUseCase>(DI_TOKENS.GetTaskUseCase);

    // Execute use case
    const task = await getTask.execute(validated.id);

    if (!task) {
      return {
        success: false,
        error: "Task not found",
      };
    }

    // Transform to DTO
    return {
      success: true,
      data: presentTask(task),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getTaskAction" },
      "Failed to get task",
    );
  }
}

/**
 * Update an existing task
 */
export async function updateTaskAction(
  data: UpdateTaskDTO,
): Promise<ActionResponse<TaskDTO>> {
  try {
    // Validate input
    const validated = UpdateTaskSchema.parse(data);

    // Get current user ID
    const _userId = await getCurrentUserId();

    // Get use case from DI container
    const container = getContainer();
    const getTask = container.get<GetTaskUseCase>(DI_TOKENS.GetTaskUseCase);
    const updateTask = container.get<UpdateTaskUseCase>(
      DI_TOKENS.UpdateTaskUseCase,
    );

    // Get task to check ownership
    const existingTask = await getTask.execute(validated.id);
    if (!existingTask) {
      return {
        success: false,
        error: "Task not found",
      };
    }

    // Check permission with ownership context
    await requirePermission(PERMISSIONS.TASKS_UPDATE, {
      resourceOwnerId: existingTask.createdBy || undefined,
    });

    // Execute use case
    const task = await updateTask.execute({
      id: validated.id,
      title: validated.title,
      description: validated.description,
    });

    // Revalidate tasks list and detail page
    revalidatePath("/tasks");
    revalidatePath(`/tasks/${validated.id}`);

    // Transform to DTO
    return {
      success: true,
      data: presentTask(task),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateTaskAction" },
      "Failed to update task",
    );
  }
}

/**
 * Delete a task
 */
export async function deleteTaskAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    // Validate input
    const validated = TaskIdSchema.parse({ id });

    // Get use case from DI container
    const container = getContainer();
    const getTask = container.get<GetTaskUseCase>(DI_TOKENS.GetTaskUseCase);
    const deleteTask = container.get<DeleteTaskUseCase>(
      DI_TOKENS.DeleteTaskUseCase,
    );

    // Get task to check ownership
    const existingTask = await getTask.execute(validated.id);
    if (!existingTask) {
      return {
        success: false,
        error: "Task not found",
      };
    }

    // Check permission with ownership context
    await requirePermission(PERMISSIONS.TASKS_DELETE, {
      resourceOwnerId: existingTask.createdBy || undefined,
    });

    // Execute use case
    await deleteTask.execute(validated.id);

    // Revalidate tasks list and detail page
    revalidatePath("/tasks");
    revalidatePath(`/tasks/${validated.id}`);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteTaskAction" },
      "Failed to delete task",
    );
  }
}

/**
 * Complete a task
 */
export async function completeTaskAction(
  id: string,
): Promise<ActionResponse<TaskDTO>> {
  try {
    // Validate input
    const validated = TaskIdSchema.parse({ id });

    // Get use case from DI container
    const container = getContainer();
    const getTask = container.get<GetTaskUseCase>(DI_TOKENS.GetTaskUseCase);
    const completeTask = container.get<CompleteTaskUseCase>(
      DI_TOKENS.CompleteTaskUseCase,
    );

    // Get task to check ownership
    const existingTask = await getTask.execute(validated.id);
    if (!existingTask) {
      return {
        success: false,
        error: "Task not found",
      };
    }

    // Check permission with ownership context (completing = updating)
    await requirePermission(PERMISSIONS.TASKS_UPDATE, {
      resourceOwnerId: existingTask.createdBy || undefined,
    });

    // Execute use case
    const task = await completeTask.execute(validated.id);

    // Revalidate tasks list and detail page
    revalidatePath("/tasks");
    revalidatePath(`/tasks/${validated.id}`);

    // Transform to DTO
    return {
      success: true,
      data: presentTask(task),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "completeTaskAction" },
      "Failed to complete task",
    );
  }
}
