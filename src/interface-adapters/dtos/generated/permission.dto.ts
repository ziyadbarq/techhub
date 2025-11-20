/**
 * Permission DTOs
 *
 * Data Transfer Objects for permission operations.
 * Used for validation at controller boundaries.
 */

import { z } from "zod";

/**
 * Schema for creating a new permission
 */
export const CreatePermissionSchema = z.object({
  resource: z
    .string()
    .min(1, "Resource is required")
    .max(50, "Resource must be less than 50 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Resource must contain only lowercase letters, numbers, and hyphens",
    ),
  action: z
    .string()
    .min(1, "Action is required")
    .max(50, "Action must be less than 50 characters")
    .regex(
      /^[a-z0-9:-]+$/,
      "Action must contain only lowercase letters, numbers, hyphens, and colons",
    ),
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(100, "Display name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  isSystem: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export type CreatePermissionDTO = z.infer<typeof CreatePermissionSchema>;

/**
 * Schema for updating an existing permission
 */
export const UpdatePermissionSchema = z.object({
  id: z.uuid({ error: "Invalid permission ID" }),
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(100, "Display name must be less than 100 characters")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  isActive: z.boolean().optional(),
});

export type UpdatePermissionDTO = z.infer<typeof UpdatePermissionSchema>;

/**
 * Schema for permission ID validation
 */
export const PermissionIdSchema = z.object({
  id: z.uuid({ error: "Invalid permission ID" }),
});

export type PermissionIdDTO = z.infer<typeof PermissionIdSchema>;

/**
 * Schema for permission list filtering
 */
export const PermissionFilterSchema = z
  .object({
    includeInactive: z.boolean().default(false),
  })
  .optional();

export type PermissionFilterDTO = z.infer<typeof PermissionFilterSchema>;
