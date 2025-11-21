/**
 * Lifecycle Model DTOs
 * Zod schemas for validating Lifecycle Model inputs
 */

import { z } from "zod";

export const CreateLifecycleModelSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional()
    .nullable(),
});

export type CreateLifecycleModelDTO = z.infer<
  typeof CreateLifecycleModelSchema
>;

export const UpdateLifecycleModelSchema = z.object({
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
});

export type UpdateLifecycleModelDTO = z.infer<
  typeof UpdateLifecycleModelSchema
>;

export const LifecycleModelIdSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export type LifecycleModelIdDTO = z.infer<typeof LifecycleModelIdSchema>;
