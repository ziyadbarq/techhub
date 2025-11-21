/**
 * Relationship Type Scope DTOs
 */

import { z } from "zod";

// Create Relationship Type Scope DTO
export const CreateRelationshipTypeScopeSchema = z.object({
  relationshipTypeId: z.string().uuid("Invalid relationship type ID"),
  fromCiClassId: z.string().uuid("Invalid from CI class ID"),
  toCiClassId: z.string().uuid("Invalid to CI class ID"),
  note: z
    .string()
    .max(5000, "Note must be 5000 characters or less")
    .optional()
    .nullable(),
});

// Update Relationship Type Scope DTO
export const UpdateRelationshipTypeScopeSchema = z.object({
  note: z
    .string()
    .max(5000, "Note must be 5000 characters or less")
    .optional()
    .nullable(),
});

// Type exports
export type CreateRelationshipTypeScopeDTO = z.infer<
  typeof CreateRelationshipTypeScopeSchema
>;
export type UpdateRelationshipTypeScopeDTO = z.infer<
  typeof UpdateRelationshipTypeScopeSchema
>;
