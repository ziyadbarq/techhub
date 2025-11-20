/**
 * Server-Side Permission Utilities
 * For use in server components and actions
 */

import { getCurrentUserId } from "@/lib/auth/session";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";
import type { PermissionContext } from "./check-permission";
import {
  hasPermission as checkPermission,
  requirePermission as checkRequirePermission,
  hasAllPermissions,
  hasAnyPermission,
} from "./check-permission";

/**
 * Get current user's permission status
 * Automatically gets userId from session
 */
export async function hasPermission(
  permission: PermissionKey,
  context?: PermissionContext,
): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return false;
  }

  return checkPermission(userId, permission, context);
}

/**
 * Require permission or throw error
 * Automatically gets userId from session
 */
export async function requirePermission(
  permission: PermissionKey,
  context?: PermissionContext,
): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Not authenticated");
  }

  return checkRequirePermission(userId, permission, context);
}

/**
 * Check if current user has all permissions
 */
export async function hasAll(
  permissions: PermissionKey[],
  context?: PermissionContext,
): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return false;
  }

  return hasAllPermissions(userId, permissions, context);
}

/**
 * Check if current user has any of the permissions
 */
export async function hasAny(
  permissions: PermissionKey[],
  context?: PermissionContext,
): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return false;
  }

  return hasAnyPermission(userId, permissions, context);
}
