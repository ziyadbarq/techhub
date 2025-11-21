/**
 * Vendor DTOs
 * Zod schemas for validating Vendor inputs
 */

import { z } from "zod";
import { VendorType } from "@/core/domain/value-objects/foundation-enums";

export const CreateVendorSchema = z.object({
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
      "Code must contain only uppercase letters, numbers, hyphens, and underscores",
    ),
  legalName: z
    .string()
    .max(200, "Legal name must be 200 characters or less")
    .optional()
    .nullable(),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .optional()
    .nullable(),
  vendorType: z.nativeEnum(VendorType),
  website: z
    .string()
    .url("Invalid URL format")
    .max(255, "Website URL must be 255 characters or less")
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
  address: z
    .string()
    .max(500, "Address must be 500 characters or less")
    .optional()
    .nullable(),
  city: z
    .string()
    .max(100, "City must be 100 characters or less")
    .optional()
    .nullable(),
  state: z
    .string()
    .max(100, "State must be 100 characters or less")
    .optional()
    .nullable(),
  country: z
    .string()
    .max(100, "Country must be 100 characters or less")
    .optional()
    .nullable(),
  postalCode: z
    .string()
    .max(20, "Postal code must be 20 characters or less")
    .optional()
    .nullable(),
  taxId: z
    .string()
    .max(100, "Tax ID must be 100 characters or less")
    .optional()
    .nullable(),
  paymentTerms: z
    .string()
    .max(500, "Payment terms must be 500 characters or less")
    .optional()
    .nullable(),
  isPreferred: z.boolean().default(false),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).optional().default([]),
  note: z
    .string()
    .max(2000, "Note must be 2000 characters or less")
    .optional()
    .nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type CreateVendorDTO = z.infer<typeof CreateVendorSchema>;

export const UpdateVendorSchema = z.object({
  id: z.string().min(1, "ID is required"),
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
      "Code must contain only uppercase letters, numbers, hyphens, and underscores",
    )
    .optional(),
  legalName: z
    .string()
    .max(200, "Legal name must be 200 characters or less")
    .optional()
    .nullable(),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .optional()
    .nullable(),
  vendorType: z.nativeEnum(VendorType).optional(),
  website: z
    .string()
    .url("Invalid URL format")
    .max(255, "Website URL must be 255 characters or less")
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
  address: z
    .string()
    .max(500, "Address must be 500 characters or less")
    .optional()
    .nullable(),
  city: z
    .string()
    .max(100, "City must be 100 characters or less")
    .optional()
    .nullable(),
  state: z
    .string()
    .max(100, "State must be 100 characters or less")
    .optional()
    .nullable(),
  country: z
    .string()
    .max(100, "Country must be 100 characters or less")
    .optional()
    .nullable(),
  postalCode: z
    .string()
    .max(20, "Postal code must be 20 characters or less")
    .optional()
    .nullable(),
  taxId: z
    .string()
    .max(100, "Tax ID must be 100 characters or less")
    .optional()
    .nullable(),
  paymentTerms: z
    .string()
    .max(500, "Payment terms must be 500 characters or less")
    .optional()
    .nullable(),
  isPreferred: z.boolean().optional(),
  isActive: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  note: z
    .string()
    .max(2000, "Note must be 2000 characters or less")
    .optional()
    .nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type UpdateVendorDTO = z.infer<typeof UpdateVendorSchema>;

export const VendorIdSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export type VendorIdDTO = z.infer<typeof VendorIdSchema>;
