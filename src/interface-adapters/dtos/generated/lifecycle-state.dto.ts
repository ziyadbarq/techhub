/**
 * Lifecycle State DTOs
 * Zod schemas for validating Lifecycle State inputs
 */

import { z } from "zod";
import { StateType } from "@/core/domain/value-objects/foundation-enums";

export const CreateLifecycleStateSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  code: z
    .string()
    .max(50, "Code must be 50 characters or less")
    .regex(
      /^[A-Z0-9_-]+$/,
      "Code must contain only uppercase letters, numbers, hyphens, and underscores",
    )
    .optional(),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional()
    .nullable(),
  modelId: z.string().min(1, "Model ID is required"),
  stateType: z.nativeEnum(StateType),
  isActive: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type CreateLifecycleStateDTO = z.infer<
  typeof CreateLifecycleStateSchema
>;

export const UpdateLifecycleStateSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional()
    .nullable(),
  stateType: z.nativeEnum(StateType).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type UpdateLifecycleStateDTO = z.infer<
  typeof UpdateLifecycleStateSchema
>;

export const LifecycleStateIdSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export type LifecycleStateIdDTO = z.infer<typeof LifecycleStateIdSchema>;
