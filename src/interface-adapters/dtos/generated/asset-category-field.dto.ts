/**
 * Asset Category Field DTOs
 */

import { z } from "zod";

// Create Asset Category Field DTO
export const CreateAssetCategoryFieldSchema = z.object({
  assetCategoryId: z.string().uuid("Invalid asset category ID"),
  fieldDefinitionId: z.string().uuid("Invalid field definition ID"),
  isRequired: z.boolean().optional().default(false),
  isUnique: z.boolean().optional().default(false),
  isVisible: z.boolean().optional().default(true),
  defaultValue: z.record(z.string(), z.unknown()).optional().nullable(),
  uiOrder: z
    .number()
    .int("UI order must be an integer")
    .nonnegative("UI order must be non-negative")
    .optional()
    .default(0),
});

// Update Asset Category Field DTO
export const UpdateAssetCategoryFieldSchema = z.object({
  isRequired: z.boolean().optional(),
  isUnique: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  defaultValue: z.record(z.string(), z.unknown()).optional().nullable(),
  uiOrder: z
    .number()
    .int("UI order must be an integer")
    .nonnegative("UI order must be non-negative")
    .optional(),
});

// Type exports
export type CreateAssetCategoryFieldDTO = z.infer<
  typeof CreateAssetCategoryFieldSchema
>;
export type UpdateAssetCategoryFieldDTO = z.infer<
  typeof UpdateAssetCategoryFieldSchema
>;
