import type { PermissionKey } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { requirePermission } from "@/lib/permissions/server";
import { requireFeature } from "./server";

/**
 * Require a feature flag and permission in the correct order.
 * Ensures feature enforcement happens before the permission check.
 */
export async function requireFeatureAndPermission(
  featureName: string,
  permission: PermissionKey,
  redirectPath: string,
): Promise<void> {
  await requireFeature(featureName);

  try {
    await requirePermission(permission);
  } catch (error) {
    handlePermissionRedirect(error, redirectPath);
    throw error;
  }
}
