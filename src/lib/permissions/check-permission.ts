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
 */
export async function hasAllPermissions(
  userId: string,
  permissions: PermissionKey[],
  context?: PermissionContext,
): Promise<boolean> {
  const results = await Promise.all(
    permissions.map((permission) => hasPermission(userId, permission, context)),
  );

  return results.every((result) => result === true);
}

/**
 * Check multiple permissions (user must have ANY)
 */
export async function hasAnyPermission(
  userId: string,
  permissions: PermissionKey[],
  context?: PermissionContext,
): Promise<boolean> {
  const results = await Promise.all(
    permissions.map((permission) => hasPermission(userId, permission, context)),
  );

  return results.some((result) => result === true);
}
