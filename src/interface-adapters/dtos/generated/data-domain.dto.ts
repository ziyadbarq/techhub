/**
 * DataDomain DTOs
 */

import { z } from "zod";

// Create DataDomain DTO
export const CreateDataDomainSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Data domain name is required")
    .max(255, "Data domain name must not exceed 255 characters"),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .max(50, "Data domain code must not exceed 50 characters")
    .regex(
      /^[A-Z0-9_-]*$/,
      "Data domain code must contain only letters, numbers, hyphens, and underscores",
    )
    .optional(),
  description: z
    .string()
    .trim()
    .max(2000, "Description must not exceed 2000 characters")
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
});

// Update DataDomain DTO
export const UpdateDataDomainSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Data domain name is required")
    .max(255, "Data domain name must not exceed 255 characters")
    .optional(),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "Data domain code is required")
    .max(50, "Data domain code must not exceed 50 characters")
    .regex(
      /^[A-Z0-9_-]+$/,
      "Data domain code must contain only letters, numbers, hyphens, and underscores",
    )
    .optional(),
  description: z
    .string()
    .trim()
    .max(2000, "Description must not exceed 2000 characters")
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
});

// Type exports
export type CreateDataDomainDTO = z.infer<typeof CreateDataDomainSchema>;
export type UpdateDataDomainDTO = z.infer<typeof UpdateDataDomainSchema>;
