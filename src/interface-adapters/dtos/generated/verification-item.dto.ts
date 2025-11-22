/**
 * VerificationItem DTOs
 */

import { z } from "zod";
import { TargetObjectTypeEnum, VerificationStatusEnum } from "@/generated/prisma";

// Create VerificationItem DTO
export const CreateVerificationItemSchema = z.object({
  verificationCampaignId: z
    .string()
    .trim()
    .min(1, "Verification campaign ID is required"),
  targetType: z.nativeEnum(TargetObjectTypeEnum, {
    required_error: "Target type is required",
  }),
  targetId: z.string().trim().min(1, "Target ID is required"),
  verifierPersonId: z.string().trim().optional().nullable(),
  status: z.nativeEnum(VerificationStatusEnum).optional(),
  verifiedAt: z.coerce.date().optional().nullable(),
  comment: z
    .string()
    .trim()
    .max(5000, "Comment must not exceed 5000 characters")
    .optional()
    .nullable(),
});

// Update VerificationItem DTO
export const UpdateVerificationItemSchema = z.object({
  verifierPersonId: z.string().trim().optional().nullable(),
  comment: z
    .string()
    .trim()
    .max(5000, "Comment must not exceed 5000 characters")
    .optional()
    .nullable(),
});

// Verify VerificationItem DTO
export const VerifyVerificationItemSchema = z.object({
  comment: z
    .string()
    .trim()
    .max(5000, "Comment must not exceed 5000 characters")
    .optional(),
});

// Flag Exception VerificationItem DTO
export const FlagExceptionVerificationItemSchema = z.object({
  comment: z
    .string()
    .trim()
    .min(1, "Comment is required when flagging as exception")
    .max(5000, "Comment must not exceed 5000 characters"),
});

// Type exports
export type CreateVerificationItemDTO = z.infer<
  typeof CreateVerificationItemSchema
>;
export type UpdateVerificationItemDTO = z.infer<
  typeof UpdateVerificationItemSchema
>;
export type VerifyVerificationItemDTO = z.infer<
  typeof VerifyVerificationItemSchema
>;
export type FlagExceptionVerificationItemDTO = z.infer<
  typeof FlagExceptionVerificationItemSchema
>;
