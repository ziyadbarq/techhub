/**
 * Task DTOs - Auto-generated from Prisma Schema
 *
 * This file re-exports and extends the auto-generated Zod schemas from prisma-zod-generator.
 * Use these schemas for controller validation instead of manually maintaining DTOs.
 *
 * Generated schemas are based on the Prisma schema and regenerated on `npm run db:generate`.
 */

import { z } from "zod";
import { TaskSchema, TaskStatusSchema } from "@/generated/zod";
import { TaskStatus as DomainTaskStatus } from "@/core/domain/entities/task.entity";

// Re-export the generated Task schema and enum
export { TaskSchema, TaskStatusSchema };

// Map generated TaskStatus to domain TaskStatus
export const TaskStatus = DomainTaskStatus;

/**
 * Schema for creating a new task
 * Extends generated schema with custom validation rules
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
  status: z.nativeEnum(DomainTaskStatus).optional(),
});

export type CreateTaskDTO = z.infer<typeof CreateTaskSchema>;

/**
 * Schema for updating an existing task
 * All fields are optional except ID
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
  status: z.nativeEnum(DomainTaskStatus).optional(),
});

export type TaskFilterDTO = z.infer<typeof TaskFilterSchema>;
