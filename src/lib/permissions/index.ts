/**
 * Permission Utilities
 * Centralized exports for permission checking
 */

export {
  PERMISSIONS,
  type PermissionKey,
} from "@/core/domain/value-objects/permission-key";
export { hasPermission, requirePermission, hasAll, hasAny } from "./server";
export type { PermissionContext } from "./check-permission";
