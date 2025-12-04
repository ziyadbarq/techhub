/**
 * Permission Checking Utilities
 * Server-side permission validation
 */

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { CheckPermissionUseCase } from "@/core/use-cases/rbac/check-permission.use-case";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";
import { InsufficientPermissionsError } from "@/core/domain/errors/rbac-errors";

export interface PermissionContext {
  resourceOwnerId?: string;
  [key: string]: unknown;
}

/**
 * Check if a user has a specific permission
 * @returns true if user has permission, false otherwise
 */
export async function hasPermission(
  userId: string,
  permission: PermissionKey,
  context?: PermissionContext,
): Promise<boolean> {
  const container = getContainer();
  const checkPermissionUseCase = container.get<CheckPermissionUseCase>(
    DI_TOKENS.CheckPermissionUseCase,
  );

  return checkPermissionUseCase.execute({
    userId,
    permission,
    context,
  });
}

/**
 * Require a specific permission or throw error
 * @throws InsufficientPermissionsError if user lacks permission
 */
export async function requirePermission(
  userId: string,
  permission: PermissionKey,
  context?: PermissionContext,
): Promise<void> {
  const hasAccess = await hasPermission(userId, permission, context);

  if (!hasAccess) {
    throw new InsufficientPermissionsError(permission, userId);
  }
}

/**
 * Check multiple permissions (user must have ALL)
 *
 * Performance optimization: Checks first permission serially to populate cache,
 * then checks remaining permissions in parallel. This prevents N parallel DB queries
 * on cold cache (race condition where all checks miss cache simultaneously).
 */
export async function hasAllPermissions(
  userId: string,
  permissions: PermissionKey[],
  context?: PermissionContext,
): Promise<boolean> {
  if (permissions.length === 0) return true;
  if (permissions.length === 1) {
    return hasPermission(userId, permissions[0], context);
  }

  // Check first permission to populate cache (if cold)
  const firstResult = await hasPermission(userId, permissions[0], context);
  if (!firstResult) return false; // Short-circuit if first check fails

  // Now cache is warm - check remaining permissions in parallel
  const remainingResults = await Promise.all(
    permissions
      .slice(1)
      .map((permission) => hasPermission(userId, permission, context)),
  );

  return remainingResults.every((result) => result === true);
}

/**
 * Check multiple permissions (user must have ANY)
 *
 * Performance optimization: Checks first permission serially to populate cache,
 * then checks remaining permissions in parallel. This prevents N parallel DB queries
 * on cold cache (race condition where all checks miss cache simultaneously).
 */
export async function hasAnyPermission(
  userId: string,
  permissions: PermissionKey[],
  context?: PermissionContext,
): Promise<boolean> {
  if (permissions.length === 0) return false;
  if (permissions.length === 1) {
    return hasPermission(userId, permissions[0], context);
  }

  // Check first permission to populate cache (if cold)
  const firstResult = await hasPermission(userId, permissions[0], context);
  if (firstResult) return true; // Short-circuit if first check succeeds

  // Now cache is warm - check remaining permissions in parallel
  const remainingResults = await Promise.all(
    permissions
      .slice(1)
      .map((permission) => hasPermission(userId, permission, context)),
  );

  return remainingResults.some((result) => result === true);
}
