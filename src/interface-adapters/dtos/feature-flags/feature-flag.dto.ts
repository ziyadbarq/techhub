/**
 * Feature Flag DTOs
 */

import { z } from "zod";

/**
 * Feature Flag Response DTO Schema
 */
export const FeatureFlagResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  description: z.string(),
  category: z.enum(["SYSTEM", "LAYER_1", "LAYER_2", "LAYER_3"]),
  isEnabled: z.boolean(),
  isSystem: z.boolean(),
  dependsOn: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FeatureFlagResponseDTO = z.infer<typeof FeatureFlagResponseSchema>;

/**
 * Toggle Feature Flag Request DTO Schema
 */
export const ToggleFeatureFlagRequestSchema = z.object({
  name: z.string().min(1, "Feature name is required"),
  reason: z.string().optional(),
});

export type ToggleFeatureFlagRequestDTO = z.infer<
  typeof ToggleFeatureFlagRequestSchema
>;

/**
 * Toggle Feature Flag Response DTO Schema
 */
export const ToggleFeatureFlagResponseSchema = z.object({
  featureFlag: FeatureFlagResponseSchema,
  action: z.enum(["ENABLED", "DISABLED"]),
  warnings: z.array(z.string()).optional(),
});

export type ToggleFeatureFlagResponseDTO = z.infer<
  typeof ToggleFeatureFlagResponseSchema
>;

/**
 * List Feature Flags Response DTO Schema
 */
export const ListFeatureFlagsResponseSchema = z.object({
  flags: z.array(FeatureFlagResponseSchema),
  total: z.number(),
});

export type ListFeatureFlagsResponseDTO = z.infer<
  typeof ListFeatureFlagsResponseSchema
>;
