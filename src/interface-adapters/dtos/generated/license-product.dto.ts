/**
 * LicenseProduct DTOs
 */

import { z } from "zod";
import { LicenseMetricType } from "@/core/domain/entities/license-product.entity";

// Create LicenseProduct DTO
export const CreateLicenseProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "License product name is required")
    .max(255, "License product name must not exceed 255 characters"),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .max(50, "License product code must not exceed 50 characters")
    .regex(
      /^[A-Z0-9_-]*$/,
      "License product code must contain only letters, numbers, hyphens, and underscores",
    )
    .optional(),
  vendorId: z.string().min(24).max(25),
  metricType: z.nativeEnum(LicenseMetricType),
  description: z
    .string()
    .trim()
    .max(2000, "Description must not exceed 2000 characters")
    .optional()
    .nullable(),
  lifecycleModelId: z.string().min(24).max(25).optional().nullable(),
});

// Update LicenseProduct DTO
export const UpdateLicenseProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "License product name is required")
    .max(255, "License product name must not exceed 255 characters")
    .optional(),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "License product code is required")
    .max(50, "License product code must not exceed 50 characters")
    .regex(
      /^[A-Z0-9_-]+$/,
      "License product code must contain only letters, numbers, hyphens, and underscores",
    )
    .optional(),
  vendorId: z.string().min(24).max(25).optional(),
  metricType: z.nativeEnum(LicenseMetricType).optional(),
  description: z
    .string()
    .trim()
    .max(2000, "Description must not exceed 2000 characters")
    .optional()
    .nullable(),
  lifecycleModelId: z.string().min(24).max(25).optional().nullable(),
});

// Type exports
export type CreateLicenseProductDTO = z.infer<
  typeof CreateLicenseProductSchema
>;
export type UpdateLicenseProductDTO = z.infer<
  typeof UpdateLicenseProductSchema
>;
