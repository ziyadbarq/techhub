/**
 * UserRole DTOs (Data Transfer Objects)
 *
 * Zod schemas for validating UserRole-related inputs.
 * Used in server actions to ensure type safety at runtime.
 */

import { z } from "zod";

/**
 * Schema for assigning a role to a user
 */
export const AssignRoleToUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  roleId: z.string().min(1, "Role ID is required"),
  expiresAt: z.coerce.date().optional().nullable(),
});

export type AssignRoleToUserDTO = z.infer<typeof AssignRoleToUserSchema>;

/**
 * Schema for revoking a role from a user
 */
export const RevokeRoleFromUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  roleId: z.string().min(1, "Role ID is required"),
});

export type RevokeRoleFromUserDTO = z.infer<typeof RevokeRoleFromUserSchema>;

/**
 * Schema for getting user's roles
 */
export const UserIdSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export type UserIdDTO = z.infer<typeof UserIdSchema>;

/**
 * Schema for getting role's users
 */
export const RoleIdSchema = z.object({
  roleId: z.string().min(1, "Role ID is required"),
});

export type RoleIdDTO = z.infer<typeof RoleIdSchema>;
