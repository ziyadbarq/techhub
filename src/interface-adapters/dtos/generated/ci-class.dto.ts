/**
 * CI Class DTOs
 */

import { z } from "zod";

// Criticality enum
export const CriticalityLevelSchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

// Environment enum
export const EnvironmentTypeSchema = z.enum([
  "PROD",
  "UAT",
  "DEV",
  "DR",
  "TEST",
  "OTHER",
]);

// Create CI Class DTO
export const CreateCIClassSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be 200 characters or less"),
  code: z
    .string()
    .max(50, "Code must be 50 characters or less")
    .regex(
      /^[A-Z0-9_-]*$/i,
      "Code must contain only letters, numbers, hyphens, and underscores",
    )
    .optional(),
  parentClassId: z.string().min(24).max(25).optional().nullable(),
  description: z
    .string()
    .max(5000, "Description must be 5000 characters or less")
    .optional()
    .nullable(),
  lifecycleModelId: z.string().min(24).max(25).optional().nullable(),
  defaultCriticality: CriticalityLevelSchema.optional().nullable(),
  defaultEnvironment: EnvironmentTypeSchema.optional().nullable(),
  isDiscoverable: z.boolean().optional().default(false),
});

// Update CI Class DTO
export const UpdateCIClassSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be 200 characters or less")
    .optional(),
  code: z
    .string()
    .min(1, "Code is required")
    .max(50, "Code must be 50 characters or less")
    .regex(
      /^[A-Z0-9_-]+$/i,
      "Code must contain only letters, numbers, hyphens, and underscores",
    )
    .optional(),
  parentClassId: z.string().min(24).max(25).optional().nullable(),
  description: z
    .string()
    .max(5000, "Description must be 5000 characters or less")
    .optional()
    .nullable(),
  lifecycleModelId: z.string().min(24).max(25).optional().nullable(),
  defaultCriticality: CriticalityLevelSchema.optional().nullable(),
  defaultEnvironment: EnvironmentTypeSchema.optional().nullable(),
  isDiscoverable: z.boolean().optional(),
});

// Type exports
export type CreateCIClassDTO = z.infer<typeof CreateCIClassSchema>;
export type UpdateCIClassDTO = z.infer<typeof UpdateCIClassSchema>;
export type CriticalityLevel = z.infer<typeof CriticalityLevelSchema>;
export type EnvironmentType = z.infer<typeof EnvironmentTypeSchema>;
