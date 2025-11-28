/**
 * Field Template DTOs
 * Zod schemas for validating Field Template inputs
 */

import { z } from "zod";
import { FieldDataTypeEnum } from "@/core/domain/value-objects/foundation-enums";

// Item schema for template items
export const FieldTemplateItemSchema = z.object({
  fieldDefinitionId: z.string().optional().nullable(),
  fieldName: z
    .string()
    .min(1, "Field name is required")
    .max(100, "Field name must be 100 characters or less")
    .regex(/^[a-z][a-z0-9_]*$/, "Field name must be snake_case"),
  fieldLabel: z
    .string()
    .min(1, "Field label is required")
    .max(200, "Field label must be 200 characters or less"),
  fieldDataType: z.nativeEnum(FieldDataTypeEnum),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .optional()
    .nullable(),
  isRequired: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  validationRules: z.record(z.string(), z.unknown()).optional().nullable(),
  defaultValue: z.unknown().optional().nullable(),
  enumOptions: z.array(z.string()).optional().nullable(),
  uiOrder: z
    .number()
    .int("UI order must be an integer")
    .min(0, "UI order must be non-negative")
    .default(0),
  uiGroup: z
    .string()
    .max(100, "UI group must be 100 characters or less")
    .optional()
    .nullable(),
  isSearchable: z.boolean().default(false),
  isFilterable: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type FieldTemplateItemDTO = z.infer<typeof FieldTemplateItemSchema>;

export const CreateFieldTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be 200 characters or less"),
  code: z
    .string()
    .min(1, "Code is required")
    .max(50, "Code must be 50 characters or less")
    .regex(
      /^[A-Z][A-Z0-9_]*$/,
      "Code must be SCREAMING_SNAKE_CASE (e.g., IT_HARDWARE_TEMPLATE)",
    ),
  description: z
    .string()
    .max(2000, "Description must be 2000 characters or less")
    .optional()
    .nullable(),
  entityType: z
    .string()
    .min(1, "Entity type is required")
    .max(100, "Entity type must be 100 characters or less"),
  category: z
    .string()
    .max(100, "Category must be 100 characters or less")
    .optional()
    .nullable(),
  standard: z
    .string()
    .max(100, "Standard must be 100 characters or less")
    .optional()
    .nullable(),
  isBuiltIn: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  items: z.array(FieldTemplateItemSchema).optional().default([]),
});

export type CreateFieldTemplateDTO = z.infer<typeof CreateFieldTemplateSchema>;

export const UpdateFieldTemplateSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be 200 characters or less")
    .optional(),
  description: z
    .string()
    .max(2000, "Description must be 2000 characters or less")
    .optional()
    .nullable(),
  category: z
    .string()
    .max(100, "Category must be 100 characters or less")
    .optional()
    .nullable(),
  standard: z
    .string()
    .max(100, "Standard must be 100 characters or less")
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type UpdateFieldTemplateDTO = z.infer<typeof UpdateFieldTemplateSchema>;

export const CloneFieldTemplateSchema = z.object({
  sourceTemplateId: z.string().min(1, "Source template ID is required"),
  newName: z
    .string()
    .min(1, "New name is required")
    .max(200, "Name must be 200 characters or less"),
  newCode: z
    .string()
    .min(1, "New code is required")
    .max(50, "Code must be 50 characters or less")
    .regex(
      /^[A-Z][A-Z0-9_]*$/,
      "Code must be SCREAMING_SNAKE_CASE (e.g., CUSTOM_TEMPLATE)",
    ),
});

export type CloneFieldTemplateDTO = z.infer<typeof CloneFieldTemplateSchema>;

export const ApplyFieldTemplateSchema = z.object({
  templateId: z.string().min(1, "Template ID is required"),
  targetEntityType: z.enum(["AssetCategory", "CIClass", "LicenseProduct"], {
    message:
      "Target entity type must be AssetCategory, CIClass, or LicenseProduct",
  }),
  targetEntityId: z.string().min(1, "Target entity ID is required"),
  fieldNames: z.array(z.string()).optional(),
  skipExisting: z.boolean().default(true),
});

export type ApplyFieldTemplateDTO = z.infer<typeof ApplyFieldTemplateSchema>;

export const FieldTemplateIdSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export type FieldTemplateIdDTO = z.infer<typeof FieldTemplateIdSchema>;

export const ListFieldTemplatesSchema = z.object({
  search: z.string().optional(),
  entityType: z.string().optional(),
  category: z.string().optional(),
  standard: z.string().optional(),
  builtInOnly: z.boolean().optional(),
  userCreatedOnly: z.boolean().optional(),
  activeOnly: z.boolean().optional().default(true),
  skip: z.number().int().min(0).optional().default(0),
  take: z.number().int().min(1).max(100).optional().default(50),
  orderBy: z.enum(["name", "code", "entityType", "createdAt"]).optional(),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
});

export type ListFieldTemplatesDTO = z.infer<typeof ListFieldTemplatesSchema>;
