/**
 * LicenseAddon DTOs
 */

import { z } from "zod";

// Create Schema
export const CreateLicenseAddonSchema = z.object({
  licenseProductId: z.string().uuid("Invalid license product ID"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be 200 characters or less"),
  code: z
    .string()
    .min(1, "Code is required")
    .max(50, "Code must be 50 characters or less")
    .regex(
      /^[A-Z0-9_-]+$/,
      "Code must contain only uppercase letters, numbers, underscores, and hyphens",
    ),
  description: z
    .string()
    .max(5000, "Description must be 5000 characters or less")
    .optional()
    .nullable(),
  isActive: z.boolean().optional().default(true),
});

export type CreateLicenseAddonDTO = z.infer<typeof CreateLicenseAddonSchema>;

// Update Schema
export const UpdateLicenseAddonSchema = z.object({
  id: z.string().uuid("Invalid addon ID"),
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
      /^[A-Z0-9_-]+$/,
      "Code must contain only uppercase letters, numbers, underscores, and hyphens",
    )
    .optional(),
  description: z
    .string()
    .max(5000, "Description must be 5000 characters or less")
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
});

export type UpdateLicenseAddonDTO = z.infer<typeof UpdateLicenseAddonSchema>;

// Response DTO
export interface LicenseAddonDTO {
  id: string;
  licenseProductId: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
