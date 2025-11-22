/**
 * VerificationCampaign DTOs
 */

import { z } from "zod";

// Target object type enum
export const TargetObjectTypeSchema = z.enum(["CI", "ASSET"]);

// Create VerificationCampaign DTO
export const CreateVerificationCampaignSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Campaign name is required")
    .max(255, "Campaign name must not exceed 255 characters"),
  description: z
    .string()
    .trim()
    .max(2000, "Description must not exceed 2000 characters")
    .optional()
    .nullable(),
  targetType: TargetObjectTypeSchema,
  filterDefinition: z.record(z.unknown()).optional().nullable(),
  scheduledStart: z.coerce.date({
    required_error: "Scheduled start date is required",
    invalid_type_error: "Scheduled start must be a valid date",
  }),
  scheduledEnd: z.coerce
    .date({
      invalid_type_error: "Scheduled end must be a valid date",
    })
    .optional()
    .nullable(),
  createdById: z.string().min(1, "Creator ID is required"),
});

// Update VerificationCampaign DTO
export const UpdateVerificationCampaignSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Campaign name is required")
    .max(255, "Campaign name must not exceed 255 characters")
    .optional(),
  description: z
    .string()
    .trim()
    .max(2000, "Description must not exceed 2000 characters")
    .optional()
    .nullable(),
  filterDefinition: z.record(z.unknown()).optional().nullable(),
  scheduledStart: z.coerce
    .date({
      invalid_type_error: "Scheduled start must be a valid date",
    })
    .optional(),
  scheduledEnd: z.coerce
    .date({
      invalid_type_error: "Scheduled end must be a valid date",
    })
    .optional()
    .nullable(),
});

// Type exports
export type CreateVerificationCampaignDTO = z.infer<
  typeof CreateVerificationCampaignSchema
>;
export type UpdateVerificationCampaignDTO = z.infer<
  typeof UpdateVerificationCampaignSchema
>;
export type TargetObjectType = z.infer<typeof TargetObjectTypeSchema>;
