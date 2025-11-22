/**
 * Attachment DTOs
 */

import { z } from "zod";
import { TargetObjectTypeEnum } from "@/generated/prisma";

// Create Attachment DTO
export const CreateAttachmentSchema = z.object({
  attachmentTypeId: z.string().min(1, "Attachment type is required"),
  targetType: z.nativeEnum(TargetObjectTypeEnum, {
    errorMap: () => ({ message: "Invalid target type" }),
  }),
  targetId: z.string().min(1, "Target ID is required"),
  fileName: z
    .string()
    .trim()
    .min(1, "File name is required")
    .max(255, "File name must not exceed 255 characters"),
  filePath: z.string().min(1, "File path is required"),
  mimeType: z
    .string()
    .trim()
    .regex(
      /^[a-zA-Z0-9]+\/[a-zA-Z0-9+.-]+$/,
      "Invalid MIME type format (expected: type/subtype)",
    )
    .optional()
    .nullable(),
  sizeBytes: z
    .bigint()
    .positive("File size must be greater than 0")
    .max(BigInt(100 * 1024 * 1024), "File size must not exceed 100MB")
    .optional()
    .nullable(),
  uploadedById: z.string().min(1, "Uploader ID is required"),
  note: z
    .string()
    .trim()
    .max(2000, "Note must not exceed 2000 characters")
    .optional()
    .nullable(),
});

// Update Attachment DTO
export const UpdateAttachmentSchema = z.object({
  attachmentTypeId: z.string().min(1, "Attachment type is required").optional(),
  fileName: z
    .string()
    .trim()
    .min(1, "File name is required")
    .max(255, "File name must not exceed 255 characters")
    .optional(),
  filePath: z.string().min(1, "File path is required").optional(),
  mimeType: z
    .string()
    .trim()
    .regex(
      /^[a-zA-Z0-9]+\/[a-zA-Z0-9+.-]+$/,
      "Invalid MIME type format (expected: type/subtype)",
    )
    .optional()
    .nullable(),
  sizeBytes: z
    .bigint()
    .positive("File size must be greater than 0")
    .max(BigInt(100 * 1024 * 1024), "File size must not exceed 100MB")
    .optional()
    .nullable(),
  note: z
    .string()
    .trim()
    .max(2000, "Note must not exceed 2000 characters")
    .optional()
    .nullable(),
});

// Type exports
export type CreateAttachmentDTO = z.infer<typeof CreateAttachmentSchema>;
export type UpdateAttachmentDTO = z.infer<typeof UpdateAttachmentSchema>;
