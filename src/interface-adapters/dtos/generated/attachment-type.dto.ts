/**
 * AttachmentType DTOs
 */

import { z } from "zod";

// Validation for file extensions
const fileExtensionSchema = z
  .string()
  .trim()
  .min(1, "Extension cannot be empty")
  .toLowerCase()
  .transform((ext) => ext.replace(/^\./, "")) // Remove leading dot if present
  .refine(
    (ext) => /^[a-z0-9]+$/.test(ext),
    "Extension must contain only letters and numbers",
  );

// Create AttachmentType DTO
export const CreateAttachmentTypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Attachment type name is required")
    .max(255, "Attachment type name must not exceed 255 characters"),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .max(50, "Attachment type code must not exceed 50 characters")
    .regex(
      /^[A-Z0-9_-]*$/,
      "Attachment type code must contain only letters, numbers, hyphens, and underscores",
    )
    .optional(),
  description: z
    .string()
    .trim()
    .max(2000, "Description must not exceed 2000 characters")
    .optional()
    .nullable(),
  allowedExtensions: z
    .array(fileExtensionSchema)
    .min(0, "Allowed extensions must be an array")
    .max(50, "Cannot specify more than 50 allowed extensions")
    .optional()
    .default([]),
  maxFileSizeMB: z
    .number()
    .int("Max file size must be an integer")
    .positive("Max file size must be a positive number")
    .max(10000, "Max file size must not exceed 10000 MB (10 GB)")
    .optional()
    .default(100),
  isActive: z.boolean().optional(),
});

// Update AttachmentType DTO
export const UpdateAttachmentTypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Attachment type name is required")
    .max(255, "Attachment type name must not exceed 255 characters")
    .optional(),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "Attachment type code is required")
    .max(50, "Attachment type code must not exceed 50 characters")
    .regex(
      /^[A-Z0-9_-]+$/,
      "Attachment type code must contain only letters, numbers, hyphens, and underscores",
    )
    .optional(),
  description: z
    .string()
    .trim()
    .max(2000, "Description must not exceed 2000 characters")
    .optional()
    .nullable(),
  allowedExtensions: z
    .array(fileExtensionSchema)
    .min(0, "Allowed extensions must be an array")
    .max(50, "Cannot specify more than 50 allowed extensions")
    .optional(),
  maxFileSizeMB: z
    .number()
    .int("Max file size must be an integer")
    .positive("Max file size must be a positive number")
    .max(10000, "Max file size must not exceed 10000 MB (10 GB)")
    .optional(),
  isActive: z.boolean().optional(),
});

// Type exports
export type CreateAttachmentTypeDTO = z.infer<
  typeof CreateAttachmentTypeSchema
>;
export type UpdateAttachmentTypeDTO = z.infer<
  typeof UpdateAttachmentTypeSchema
>;
