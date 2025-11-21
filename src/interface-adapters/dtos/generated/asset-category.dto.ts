/**
 * AssetCategory DTOs
 * Zod schemas for validating AssetCategory inputs
 */

import { z } from "zod";

export const CreateAssetCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(200, "Name must be 200 characters or less"),
  code: z
    .string()
    .min(1, "Code is required")
    .min(2, "Code must be at least 2 characters")
    .max(50, "Code must be 50 characters or less")
    .regex(
      /^[A-Z0-9_-]+$/i,
      "Code must contain only letters, numbers, hyphens, and underscores",
    ),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .optional()
    .nullable(),
  lifecycleModelId: z.string().optional().nullable(),
  isConsumable: z.boolean().optional(),
});

export const UpdateAssetCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(200, "Name must be 200 characters or less")
    .optional(),
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(50, "Code must be 50 characters or less")
    .regex(
      /^[A-Z0-9_-]+$/i,
      "Code must contain only letters, numbers, hyphens, and underscores",
    )
    .optional(),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .optional()
    .nullable(),
  lifecycleModelId: z.string().optional().nullable(),
  isConsumable: z.boolean().optional(),
});

export const AssetCategoryIdSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export type CreateAssetCategoryDTO = z.infer<typeof CreateAssetCategorySchema>;
export type UpdateAssetCategoryDTO = z.infer<typeof UpdateAssetCategorySchema>;
export type AssetCategoryIdDTO = z.infer<typeof AssetCategoryIdSchema>;
