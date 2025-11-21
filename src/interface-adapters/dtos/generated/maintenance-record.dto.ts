/**
 * MaintenanceRecord DTOs
 */

import { z } from "zod";
import { MAINTENANCE_STATUS_VALUES } from "@/core/domain/value-objects/maintenance-status";
import { currencyField } from "../validation-helpers";

// Helper schema for date coercion
const dateSchema = z.coerce.date();

// Status enum validation
const statusSchema = z.enum(MAINTENANCE_STATUS_VALUES as [string, ...string[]]);

export const CreateMaintenanceRecordSchema = z.object({
  assetId: z.string().min(1, "Asset ID is required"),
  maintenanceScheduleId: z.string().optional().nullable(),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .max(5000, "Description must be 5000 characters or less")
    .optional()
    .nullable(),
  scheduledDate: dateSchema.optional(),
  completedDate: dateSchema.optional().nullable(),
  performedById: z.string().optional().nullable(),
  status: statusSchema.optional(),
  notes: z
    .string()
    .max(10000, "Notes must be 10000 characters or less")
    .optional()
    .nullable(),
  cost: currencyField("Maintenance cost"),
  partsUsed: z.array(z.string()).optional().nullable(),
  nextMaintenanceDate: dateSchema.optional().nullable(),
});

export const UpdateMaintenanceRecordSchema = z.object({
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
  scheduledDate: dateSchema.optional(),
  completedDate: dateSchema.optional().nullable(),
  performedById: z.string().optional().nullable(),
  status: statusSchema.optional(),
  notes: z
    .string()
    .max(10000, "Notes must be 10000 characters or less")
    .optional()
    .nullable(),
  cost: currencyField("Maintenance cost"),
  partsUsed: z.array(z.string()).optional().nullable(),
  nextMaintenanceDate: dateSchema.optional().nullable(),
});

export const MaintenanceRecordFilterSchema = z.object({
  assetId: z.string().optional(),
  maintenanceScheduleId: z.string().optional(),
  performedById: z.string().optional(),
  status: statusSchema.optional(),
  scheduledAfter: dateSchema.optional(),
  scheduledBefore: dateSchema.optional(),
  completedAfter: dateSchema.optional(),
  completedBefore: dateSchema.optional(),
});

export const StartMaintenanceSchema = z.object({
  id: z.string().min(1, "Maintenance record ID is required"),
  performedById: z.string().min(1, "Performer ID is required"),
});

export const CompleteMaintenanceSchema = z.object({
  id: z.string().min(1, "Maintenance record ID is required"),
  performedById: z.string().min(1, "Performer ID is required"),
  completedDate: dateSchema.optional(),
  notes: z
    .string()
    .max(10000, "Notes must be 10000 characters or less")
    .optional()
    .nullable(),
  cost: currencyField("Maintenance cost"),
  partsUsed: z.array(z.string()).optional().nullable(),
  nextMaintenanceDate: dateSchema.optional().nullable(),
});

export const CancelMaintenanceSchema = z.object({
  id: z.string().min(1, "Maintenance record ID is required"),
  notes: z
    .string()
    .max(10000, "Notes must be 10000 characters or less")
    .optional()
    .nullable(),
});

// Type exports
export type CreateMaintenanceRecordDTO = z.infer<
  typeof CreateMaintenanceRecordSchema
>;
export type UpdateMaintenanceRecordDTO = z.infer<
  typeof UpdateMaintenanceRecordSchema
>;
export type MaintenanceRecordFilterDTO = z.infer<
  typeof MaintenanceRecordFilterSchema
>;
export type StartMaintenanceDTO = z.infer<typeof StartMaintenanceSchema>;
export type CompleteMaintenanceDTO = z.infer<typeof CompleteMaintenanceSchema>;
export type CancelMaintenanceDTO = z.infer<typeof CancelMaintenanceSchema>;
