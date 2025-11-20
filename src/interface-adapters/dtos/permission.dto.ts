/**
 * Permission DTOs (Data Transfer Objects)
 *
 * Zod schemas for validating Permission-related inputs.
 * Used in server actions to ensure type safety at runtime.
 */

import { z } from "zod";

/**
 * Schema for creating a new permission
 */
export const CreatePermissionSchema = z.object({
  resource: z
    .string()
    .min(1, "Resource is required")
    .max(100, "Resource must be 100 characters or less")
    .regex(
      /^[a-z0-9-]+$/,
      "Resource must be lowercase alphanumeric with hyphens only",
    ),
  action: z
    .string()
    .min(1, "Action is required")
    .max(100, "Action must be 100 characters or less")
    .regex(
      /^[a-z0-9-]+$/,
      "Action must be lowercase alphanumeric with hyphens only",
    ),
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(200, "Display name must be 200 characters or less"),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .optional(),
  isSystem: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export type CreatePermissionDTO = z.infer<typeof CreatePermissionSchema>;

/**
 * Schema for updating an existing permission
 */
export const UpdatePermissionSchema = z.object({
  id: z.string().min(1, "Permission ID is required"),
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(200, "Display name must be 200 characters or less")
    .optional(),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .optional(),
  isActive: z.boolean().optional(),
});

export type UpdatePermissionDTO = z.infer<typeof UpdatePermissionSchema>;

/**
 * Schema for permission ID
 */
export const PermissionIdSchema = z.object({
  id: z.string().min(1, "Permission ID is required"),
});

export type PermissionIdDTO = z.infer<typeof PermissionIdSchema>;

/**
 * Schema for filtering permissions
 */
export const PermissionFilterSchema = z.object({
  resource: z.string().optional(),
  isActive: z.boolean().optional(),
  isSystem: z.boolean().optional(),
});

export type PermissionFilterDTO = z.infer<typeof PermissionFilterSchema>;
