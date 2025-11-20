/**
 * Task DTOs (Data Transfer Objects)
 *
 * Zod schemas for validating Task-related inputs.
 * Used in server actions to ensure type safety at runtime.
 */

import { z } from "zod";
import { TaskStatus } from "@/core/domain/entities/task.entity";

/**
 * Schema for creating a new task
 */
export const CreateTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .max(2000, "Description must be 2000 characters or less")
    .optional()
    .nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
});

export type CreateTaskDTO = z.infer<typeof CreateTaskSchema>;

/**
 * Schema for updating an existing task
 */
export const UpdateTaskSchema = z.object({
  id: z.string().min(1, "Task ID is required"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .optional(),
  description: z
    .string()
    .max(2000, "Description must be 2000 characters or less")
    .optional()
    .nullable(),
});

export type UpdateTaskDTO = z.infer<typeof UpdateTaskSchema>;

/**
 * Schema for task ID
 */
export const TaskIdSchema = z.object({
  id: z.string().min(1, "Task ID is required"),
});

export type TaskIdDTO = z.infer<typeof TaskIdSchema>;

/**
 * Schema for filtering tasks
 */
export const TaskFilterSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
});

export type TaskFilterDTO = z.infer<typeof TaskFilterSchema>;
