/**
 * Lifecycle Transition DTOs
 * Zod schemas for validating Lifecycle Transition inputs
 */

import { z } from "zod";

export const CreateLifecycleTransitionSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional()
    .nullable(),
  modelId: z.string().min(1, "Model ID is required"),
  fromStateId: z.string().min(1, "From State ID is required"),
  toStateId: z.string().min(1, "To State ID is required"),
  conditions: z.record(z.string(), z.unknown()).optional().nullable(),
  requiresApproval: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type CreateLifecycleTransitionDTO = z.infer<
  typeof CreateLifecycleTransitionSchema
>;

export const UpdateLifecycleTransitionSchema = z.object({
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
  conditions: z.record(z.string(), z.unknown()).optional().nullable(),
  requiresApproval: z.boolean().optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type UpdateLifecycleTransitionDTO = z.infer<
  typeof UpdateLifecycleTransitionSchema
>;

export const LifecycleTransitionIdSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export type LifecycleTransitionIdDTO = z.infer<
  typeof LifecycleTransitionIdSchema
>;
