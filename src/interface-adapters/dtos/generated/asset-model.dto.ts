/**
 * AssetModel DTOs
 */

import { z } from "zod";

export const CreateAssetModelSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(200, "Name must be 200 characters or less"),
  code: z
    .string()
    .max(50, "Code must be 50 characters or less")
    .regex(
      /^[A-Z0-9_-]*$/i,
      "Code must contain only letters, numbers, hyphens, and underscores",
    )
    .optional(),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .optional()
    .nullable(),
  assetCategoryId: z.string().min(1, "Asset category is required"),
  vendorId: z.string().min(1, "Vendor is required"),
  defaultWarrantyMonths: z
    .number()
    .int()
    .min(0, "Warranty months cannot be negative")
    .max(120, "Warranty months cannot exceed 120")
    .optional()
    .nullable(),
  defaultAttributes: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const UpdateAssetModelSchema = z.object({
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
  assetCategoryId: z.string().optional(),
  vendorId: z.string().optional(),
  defaultWarrantyMonths: z
    .number()
    .int()
    .min(0, "Warranty months cannot be negative")
    .max(120, "Warranty months cannot exceed 120")
    .optional()
    .nullable(),
  defaultAttributes: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const AssetModelIdSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export type CreateAssetModelDTO = z.infer<typeof CreateAssetModelSchema>;
export type UpdateAssetModelDTO = z.infer<typeof UpdateAssetModelSchema>;
export type AssetModelIdDTO = z.infer<typeof AssetModelIdSchema>;
