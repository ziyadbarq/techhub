/**
 * Person Role Assignment DTOs
 * Zod schemas for validating Person Role Assignment inputs
 */

import { z } from "zod";

export const CreatePersonRoleAssignmentSchema = z.object({
  personId: z.string().min(1, "Person ID is required"),
  roleId: z.string().min(1, "Role ID is required"),
  scope: z
    .string()
    .max(100, "Scope must be 100 characters or less")
    .optional()
    .nullable(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  isPrimary: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type CreatePersonRoleAssignmentDTO = z.infer<
  typeof CreatePersonRoleAssignmentSchema
>;

export const UpdatePersonRoleAssignmentSchema = z.object({
  id: z.string().min(1, "ID is required"),
  scope: z
    .string()
    .max(100, "Scope must be 100 characters or less")
    .optional()
    .nullable(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  isPrimary: z.boolean().optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type UpdatePersonRoleAssignmentDTO = z.infer<
  typeof UpdatePersonRoleAssignmentSchema
>;

export const PersonRoleAssignmentIdSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export type PersonRoleAssignmentIdDTO = z.infer<
  typeof PersonRoleAssignmentIdSchema
>;
