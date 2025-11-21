/**
 * Vendor Contact DTOs
 * Zod schemas for validating Vendor Contact inputs
 */

import { z } from "zod";

export const CreateVendorContactSchema = z.object({
  vendorId: z.string().min(1, "Vendor ID is required"),
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must be 100 characters or less"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name must be 100 characters or less"),
  title: z
    .string()
    .max(100, "Title must be 100 characters or less")
    .optional()
    .nullable(),
  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email must be 255 characters or less")
    .optional()
    .nullable(),
  phone: z
    .string()
    .max(50, "Phone must be 50 characters or less")
    .optional()
    .nullable(),
  mobile: z
    .string()
    .max(50, "Mobile must be 50 characters or less")
    .optional()
    .nullable(),
  role: z
    .string()
    .max(100, "Role must be 100 characters or less")
    .optional()
    .nullable(),
  isPrimary: z.boolean().default(false),
  isActive: z.boolean().default(true),
  note: z
    .string()
    .max(1000, "Note must be 1000 characters or less")
    .optional()
    .nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type CreateVendorContactDTO = z.infer<typeof CreateVendorContactSchema>;

export const UpdateVendorContactSchema = z.object({
  id: z.string().min(1, "ID is required"),
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must be 100 characters or less")
    .optional(),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name must be 100 characters or less")
    .optional(),
  title: z
    .string()
    .max(100, "Title must be 100 characters or less")
    .optional()
    .nullable(),
  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email must be 255 characters or less")
    .optional()
    .nullable(),
  phone: z
    .string()
    .max(50, "Phone must be 50 characters or less")
    .optional()
    .nullable(),
  mobile: z
    .string()
    .max(50, "Mobile must be 50 characters or less")
    .optional()
    .nullable(),
  role: z
    .string()
    .max(100, "Role must be 100 characters or less")
    .optional()
    .nullable(),
  isPrimary: z.boolean().optional(),
  isActive: z.boolean().optional(),
  note: z
    .string()
    .max(1000, "Note must be 1000 characters or less")
    .optional()
    .nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type UpdateVendorContactDTO = z.infer<typeof UpdateVendorContactSchema>;

export const VendorContactIdSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export type VendorContactIdDTO = z.infer<typeof VendorContactIdSchema>;
