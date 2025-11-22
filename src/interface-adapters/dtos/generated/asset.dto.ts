/**
 * Asset DTOs
 */

import { z } from "zod";
import {
  currencyField,
  currencyCode,
  optionalDate,
} from "../validation-helpers";

// Helper schema for date coercion (for backward compatibility)
const dateSchema = optionalDate;

export const CreateAssetSchema = z.object({
  assetTag: z
    .string()
    .min(2, "Asset tag must be at least 2 characters")
    .max(100, "Asset tag must be 100 characters or less")
    .regex(
      /^[A-Z0-9_-]+$/i,
      "Asset tag can only contain letters, numbers, hyphens, and underscores",
    )
    .optional(),
  assetCategoryId: z.string().min(1, "Asset category is required"),
  assetModelId: z.string().optional().nullable(),
  vendorId: z.string().optional().nullable(),
  contractId: z.string().optional().nullable(),
  lifecycleStateId: z.string().optional().nullable(),
  serialNumber: z
    .string()
    .max(200, "Serial number must be 200 characters or less")
    .optional()
    .nullable(),
  condition: z
    .enum(["NEW", "GOOD", "FAIR", "POOR"], {
      message: "Condition must be NEW, GOOD, FAIR, or POOR",
    })
    .optional()
    .nullable(),
  purchaseDate: dateSchema,
  purchaseCost: currencyField("Purchase cost"),
  currency: currencyCode,
  depreciationModel: z
    .string()
    .max(100, "Depreciation model must be 100 characters or less")
    .optional()
    .nullable(),
  depreciationStart: dateSchema,
  depreciationEnd: dateSchema,
  warrantyEndDate: dateSchema,
  currentStockLocationId: z.string().optional().nullable(),
  attributes: z.record(z.string(), z.unknown()).optional().nullable(),
  note: z
    .string()
    .max(5000, "Note must be 5000 characters or less")
    .optional()
    .nullable(),
});

export const UpdateAssetSchema = z.object({
  assetTag: z
    .string()
    .min(2, "Asset tag must be at least 2 characters")
    .max(100, "Asset tag must be 100 characters or less")
    .regex(
      /^[A-Z0-9_-]+$/i,
      "Asset tag can only contain letters, numbers, hyphens, and underscores",
    )
    .optional(),
  assetModelId: z.string().optional().nullable(),
  vendorId: z.string().optional().nullable(),
  contractId: z.string().optional().nullable(),
  lifecycleStateId: z.string().optional().nullable(),
  serialNumber: z
    .string()
    .max(200, "Serial number must be 200 characters or less")
    .optional()
    .nullable(),
  condition: z
    .enum(["NEW", "GOOD", "FAIR", "POOR"], {
      message: "Condition must be NEW, GOOD, FAIR, or POOR",
    })
    .optional()
    .nullable(),
  purchaseDate: dateSchema,
  purchaseCost: currencyField("Purchase cost"),
  currency: currencyCode,
  depreciationModel: z
    .string()
    .max(100, "Depreciation model must be 100 characters or less")
    .optional()
    .nullable(),
  depreciationStart: dateSchema,
  depreciationEnd: dateSchema,
  warrantyEndDate: dateSchema,
  currentStockLocationId: z.string().optional().nullable(),
  attributes: z.record(z.string(), z.unknown()).optional().nullable(),
  note: z
    .string()
    .max(5000, "Note must be 5000 characters or less")
    .optional()
    .nullable(),
});

export const AssetIdSchema = z.object({
  id: z.string().min(1, "Asset ID is required"),
});

export const AssetTagSchema = z.object({
  assetTag: z.string().min(1, "Asset tag is required"),
});

export const AssetSearchSchema = z.object({
  assetCategoryId: z.string().optional(),
  assetModelId: z.string().optional(),
  vendorId: z.string().optional(),
  lifecycleStateId: z.string().optional(),
  currentStockLocationId: z.string().optional(),
  contractId: z.string().optional(),
  searchTerm: z.string().optional(),
  warrantyStatus: z.enum(["active", "expired", "none"]).optional(),
  depreciationStatus: z.enum(["active", "complete", "none"]).optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

// Type exports
export type CreateAssetDTO = z.infer<typeof CreateAssetSchema>;
export type UpdateAssetDTO = z.infer<typeof UpdateAssetSchema>;
export type AssetIdDTO = z.infer<typeof AssetIdSchema>;
export type AssetTagDTO = z.infer<typeof AssetTagSchema>;
export type AssetSearchDTO = z.infer<typeof AssetSearchSchema>;
