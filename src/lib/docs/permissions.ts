/**
 * Documentation Permission Utilities
 * Server-side permission checking for documentation access
 */

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { getCurrentUserId } from "@/lib/auth/session";
import type { GetUserPermissionsUseCase } from "@/core/use-cases/rbac/get-user-permissions.use-case";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";
import { hasPermission } from "@/lib/permissions/server";

/**
 * Get current user's permissions for documentation filtering
 * Returns null if user is not authenticated
 */
export async function getUserDocPermissions(): Promise<PermissionKey[] | null> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return null;
  }

  const container = getContainer();
  const getUserPermissionsUseCase = container.get<GetUserPermissionsUseCase>(
    DI_TOKENS.GetUserPermissionsUseCase,
  );

  const result = await getUserPermissionsUseCase.execute({ userId });
  return result.permissions;
}

/**
 * Check if user can access a specific documentation page
 * @param requiredPermission - Permission required to view the doc
 * @returns true if user has permission or no permission required
 */
export async function canAccessDoc(
  requiredPermission: PermissionKey | undefined,
): Promise<boolean> {
  if (!requiredPermission) {
    return true;
  }

  return hasPermission(requiredPermission);
}

/**
 * Get enabled feature flags for current user
 * This is a placeholder - implement based on your feature flag system
 */
export async function getUserEnabledFeatures(): Promise<string[]> {
  // For now, return all features as enabled
  // In production, integrate with your feature flag service
  return [];
}
