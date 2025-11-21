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
export type AssigneeTypeDTO = z.infer<typeof AssigneeTypeSchema>;
