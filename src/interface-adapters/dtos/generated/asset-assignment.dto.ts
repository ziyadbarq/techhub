/**
 * AssetAssignment DTOs
 */

import { z } from "zod";

// AssigneeType enum
export const AssigneeTypeSchema = z.enum([
  "PERSON",
  "ORG_UNIT",
  "LOCATION",
  "CI",
]);

// AssignmentSource enum
export const AssignmentSourceSchema = z.enum([
  "MANUAL",
  "INTUNE_SYNC",
  "INTUNE_MANUAL",
  "IMPORT",
  "SYSTEM",
]);

export const CreateAssetAssignmentSchema = z.object({
  assetId: z.string().min(1, "Asset is required"),
  assigneeType: AssigneeTypeSchema,
  assigneeId: z.string().min(1, "Assignee is required"),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional().nullable(),
  isPrimary: z.boolean().optional(),
  note: z
    .string()
    .max(5000, "Note must be 5000 characters or less")
    .optional()
    .nullable(),
});

export const UpdateAssetAssignmentSchema = z.object({
  assigneeType: AssigneeTypeSchema.optional(),
  assigneeId: z.string().min(1, "Assignee is required").optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional().nullable(),
  isPrimary: z.boolean().optional(),
  note: z
    .string()
    .max(5000, "Note must be 5000 characters or less")
    .optional()
    .nullable(),
});

export const AssetAssignmentIdSchema = z.object({
  id: z.string().min(1, "Assignment ID is required"),
});

export const ListAssetAssignmentsSchema = z.object({
  assetId: z.string().optional(),
  assigneeType: AssigneeTypeSchema.optional(),
  assigneeId: z.string().optional(),
  activeOnly: z.boolean().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

// Conflict management schemas
export const ListConflictsSchema = z.object({
  assetId: z.string().optional(),
  personId: z.string().optional(),
  source: AssignmentSourceSchema.optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

export const UpdateConflictStatusSchema = z.object({
  assignmentId: z.string().min(1, "Assignment ID is required"),
  hasConflict: z.boolean(),
  conflictNote: z
    .string()
    .max(5000, "Conflict note must be 5000 characters or less")
    .optional()
    .nullable(),
});

// Type exports
export type CreateAssetAssignmentDTO = z.infer<
  typeof CreateAssetAssignmentSchema
>;
export type UpdateAssetAssignmentDTO = z.infer<
  typeof UpdateAssetAssignmentSchema
>;
export type AssetAssignmentIdDTO = z.infer<typeof AssetAssignmentIdSchema>;
export type ListAssetAssignmentsDTO = z.infer<
  typeof ListAssetAssignmentsSchema
>;
export type ListConflictsDTO = z.infer<typeof ListConflictsSchema>;
export type UpdateConflictStatusDTO = z.infer<
  typeof UpdateConflictStatusSchema
>;
export type AssigneeTypeDTO = z.infer<typeof AssigneeTypeSchema>;
export type AssignmentSourceDTO = z.infer<typeof AssignmentSourceSchema>;
