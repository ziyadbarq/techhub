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
    .min(1, "License product code is required")
    .max(50, "License product code must not exceed 50 characters")
    .regex(
      /^[A-Z0-9_-]+$/,
      "License product code must contain only letters, numbers, hyphens, and underscores",
    ),
  vendorId: z.string().uuid("Invalid vendor ID"),
  metricType: z.nativeEnum(LicenseMetricType),
  description: z
    .string()
    .trim()
    .max(2000, "Description must not exceed 2000 characters")
    .optional()
    .nullable(),
  lifecycleModelId: z
    .string()
    .uuid("Invalid lifecycle model ID")
    .optional()
    .nullable(),
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
  vendorId: z.string().uuid("Invalid vendor ID").optional(),
  metricType: z.nativeEnum(LicenseMetricType).optional(),
  description: z
    .string()
    .trim()
    .max(2000, "Description must not exceed 2000 characters")
    .optional()
    .nullable(),
  lifecycleModelId: z
    .string()
    .uuid("Invalid lifecycle model ID")
    .optional()
    .nullable(),
});

// Type exports
export type CreateLicenseProductDTO = z.infer<
  typeof CreateLicenseProductSchema
>;
export type UpdateLicenseProductDTO = z.infer<
  typeof UpdateLicenseProductSchema
>;
