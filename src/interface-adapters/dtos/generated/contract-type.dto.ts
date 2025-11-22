/**
 * Contract Type DTOs
 */

import { z } from "zod";

// Create Contract Type DTO
export const CreateContractTypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Contract type name is required")
    .max(100, "Contract type name must not exceed 100 characters"),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .max(50, "Contract type code must not exceed 50 characters")
    .regex(
      /^[A-Z0-9_-]+$/,
      "Contract type code must contain only uppercase letters, numbers, hyphens, and underscores",
    )
    .optional(),
  description: z
    .string()
    .trim()
    .max(500, "Description must not exceed 500 characters")
    .optional()
    .nullable(),
  isActive: z.boolean().optional().default(true),
});

// Update Contract Type DTO
export const UpdateContractTypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Contract type name is required")
    .max(100, "Contract type name must not exceed 100 characters")
    .optional(),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "Contract type code is required")
    .max(50, "Contract type code must not exceed 50 characters")
    .regex(
      /^[A-Z0-9_-]+$/,
      "Contract type code must contain only uppercase letters, numbers, hyphens, and underscores",
    )
    .optional(),
  description: z
    .string()
    .trim()
    .max(500, "Description must not exceed 500 characters")
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
});

// Type exports
export type CreateContractTypeDTO = z.infer<typeof CreateContractTypeSchema>;
export type UpdateContractTypeDTO = z.infer<typeof UpdateContractTypeSchema>;
