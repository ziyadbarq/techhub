/**
 * MaintenanceSchedule DTOs
 */

import { z } from "zod";
import { SCHEDULE_TYPE_VALUES } from "@/core/domain/value-objects/schedule-type";
import { MAINTENANCE_PRIORITY_VALUES } from "@/core/domain/value-objects/maintenance-priority";

// Helper schema for date coercion
const dateSchema = z.coerce.date();

// Schedule type enum validation
const scheduleTypeSchema = z.enum(
  SCHEDULE_TYPE_VALUES as [string, ...string[]],
);

// Priority enum validation
const prioritySchema = z.enum(
  MAINTENANCE_PRIORITY_VALUES as [string, ...string[]],
);

export const CreateMaintenanceScheduleSchema = z.object({
  assetId: z.string().min(1, "Asset ID is required"),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .max(5000, "Description must be 5000 characters or less")
    .optional()
    .nullable(),
  scheduleType: scheduleTypeSchema,
  intervalValue: z
    .number()
    .int("Interval value must be an integer")
    .min(1, "Interval value must be at least 1")
    .max(1000, "Interval value cannot exceed 1000")
    .optional(),
  startDate: dateSchema.optional(),
  nextDueDate: dateSchema.optional(),
  isActive: z.boolean().optional(),
  assignedToId: z.string().optional().nullable(),
  estimatedDurationMinutes: z
    .number()
    .int("Duration must be an integer")
    .min(0, "Duration cannot be negative")
    .max(43200, "Duration cannot exceed 43200 minutes (30 days)")
    .optional()
    .nullable(),
  priority: prioritySchema.optional(),
  instructions: z
    .string()
    .max(10000, "Instructions must be 10000 characters or less")
    .optional()
    .nullable(),
});

export const UpdateMaintenanceScheduleSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be 200 characters or less")
    .optional(),
  description: z
    .string()
    .max(5000, "Description must be 5000 characters or less")
    .optional()
    .nullable(),
  scheduleType: scheduleTypeSchema.optional(),
  intervalValue: z
    .number()
    .int("Interval value must be an integer")
    .min(1, "Interval value must be at least 1")
    .max(1000, "Interval value cannot exceed 1000")
    .optional(),
  startDate: dateSchema.optional(),
  nextDueDate: dateSchema.optional(),
  isActive: z.boolean().optional(),
  assignedToId: z.string().optional().nullable(),
  estimatedDurationMinutes: z
    .number()
    .int("Duration must be an integer")
    .min(0, "Duration cannot be negative")
    .max(43200, "Duration cannot exceed 43200 minutes (30 days)")
    .optional()
    .nullable(),
  priority: prioritySchema.optional(),
  instructions: z
    .string()
    .max(10000, "Instructions must be 10000 characters or less")
    .optional()
    .nullable(),
});

export const MaintenanceScheduleFilterSchema = z.object({
  assetId: z.string().optional(),
  assignedToId: z.string().optional(),
  isActive: z.boolean().optional(),
  scheduleType: scheduleTypeSchema.optional(),
  priority: prioritySchema.optional(),
  dueBefore: dateSchema.optional(),
  overdueOnly: z.boolean().optional(),
});

// Type exports
export type CreateMaintenanceScheduleDTO = z.infer<
  typeof CreateMaintenanceScheduleSchema
>;
export type UpdateMaintenanceScheduleDTO = z.infer<
  typeof UpdateMaintenanceScheduleSchema
>;
export type MaintenanceScheduleFilterDTO = z.infer<
  typeof MaintenanceScheduleFilterSchema
>;
