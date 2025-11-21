/**
 * Field Definition DTOs
 * Zod schemas for validating Field Definition inputs
 */

import { z } from "zod";
import { FieldDataTypeEnum } from "@/core/domain/value-objects/foundation-enums";

export const CreateFieldDefinitionSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  label: z
    .string()
    .min(1, "Label is required")
    .max(200, "Label must be 200 characters or less"),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .optional()
    .nullable(),
  dataType: z.nativeEnum(FieldDataTypeEnum),
  entityType: z
    .string()
    .min(1, "Entity type is required")
    .max(100, "Entity type must be 100 characters or less"),
  isRequired: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  defaultValue: z.unknown().optional().nullable(),
  validationRules: z.record(z.string(), z.unknown()).optional().nullable(),
  displayOrder: z
    .number()
    .int("Display order must be an integer")
    .min(0, "Display order must be non-negative")
    .optional()
    .default(0),
  isActive: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type CreateFieldDefinitionDTO = z.infer<
  typeof CreateFieldDefinitionSchema
>;

export const UpdateFieldDefinitionSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less")
    .optional(),
  label: z
    .string()
    .min(1, "Label is required")
    .max(200, "Label must be 200 characters or less")
    .optional(),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .optional()
    .nullable(),
  dataType: z.nativeEnum(FieldDataTypeEnum).optional(),
  isRequired: z.boolean().optional(),
  isUnique: z.boolean().optional(),
  defaultValue: z.unknown().optional().nullable(),
  validationRules: z.record(z.string(), z.unknown()).optional().nullable(),
  displayOrder: z
    .number()
    .int("Display order must be an integer")
    .min(0, "Display order must be non-negative")
    .optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type UpdateFieldDefinitionDTO = z.infer<
  typeof UpdateFieldDefinitionSchema
>;

export const FieldDefinitionIdSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export type FieldDefinitionIdDTO = z.infer<typeof FieldDefinitionIdSchema>;
