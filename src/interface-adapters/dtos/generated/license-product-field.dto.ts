/**
 * LicenseProductField DTOs
 */

import { z } from "zod";

// Create LicenseProductField DTO
export const CreateLicenseProductFieldSchema = z.object({
  licenseProductId: z.string().uuid("Invalid license product ID"),
  fieldDefinitionId: z.string().uuid("Invalid field definition ID"),
  isRequired: z.boolean().optional().default(false),
  isVisible: z.boolean().optional().default(true),
  uiOrder: z
    .number()
    .int("UI order must be an integer")
    .nonnegative("UI order must be non-negative")
    .optional()
    .default(0),
  defaultValue: z.record(z.string(), z.unknown()).optional().nullable(),
});

// Update LicenseProductField DTO
export const UpdateLicenseProductFieldSchema = z.object({
  isRequired: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  uiOrder: z
    .number()
    .int("UI order must be an integer")
    .nonnegative("UI order must be non-negative")
    .optional(),
  defaultValue: z.record(z.string(), z.unknown()).optional().nullable(),
});

// Type exports
export type CreateLicenseProductFieldDTO = z.infer<
  typeof CreateLicenseProductFieldSchema
>;
export type UpdateLicenseProductFieldDTO = z.infer<
  typeof UpdateLicenseProductFieldSchema
>;
