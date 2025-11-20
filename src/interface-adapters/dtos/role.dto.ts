/**
 * Role DTOs (Data Transfer Objects)
 *
 * Zod schemas for validating Role-related inputs.
 * Used in server actions to ensure type safety at runtime.
 */

import { z } from "zod";

/**
 * Schema for creating a new role
 */
export const CreateRoleSchema = z.object({
  name: z
    .string()
    .min(1, "Role name is required")
    .max(100, "Role name must be 100 characters or less")
    .regex(
      /^[a-z0-9-]+$/,
      "Role name must be lowercase alphanumeric with hyphens only",
    ),
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(200, "Display name must be 200 characters or less"),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .optional(),
  isActive: z.boolean().optional(),
});

export type CreateRoleDTO = z.infer<typeof CreateRoleSchema>;

/**
 * Schema for updating an existing role
 */
export const UpdateRoleSchema = z.object({
  id: z.string().min(1, "Role ID is required"),
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

export type UpdateRoleDTO = z.infer<typeof UpdateRoleSchema>;

/**
 * Schema for role ID
 */
export const RoleIdSchema = z.object({
  id: z.string().min(1, "Role ID is required"),
});

export type RoleIdDTO = z.infer<typeof RoleIdSchema>;

/**
 * Schema for assigning permissions to a role
 */
export const AssignPermissionsToRoleSchema = z.object({
  roleId: z.string().min(1, "Role ID is required"),
  permissionIds: z.array(z.string()).min(1, "At least one permission required"),
});

export type AssignPermissionsToRoleDTO = z.infer<
  typeof AssignPermissionsToRoleSchema
>;

/**
 * Schema for filtering roles
 */
export const RoleFilterSchema = z.object({
  isActive: z.boolean().optional(),
});

export type RoleFilterDTO = z.infer<typeof RoleFilterSchema>;
