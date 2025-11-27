"use client";

/**
 * Permission Hooks
 * Client-side React hooks for permission checking
 *
 * This hook now delegates to PermissionsProvider context for centralized
 * permission fetching. This prevents duplicate API calls across components.
 */

import { usePermissionsContext } from "@/contexts/permissions-context";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";

export interface UsePermissionsReturn {
  hasPermission: (permission: PermissionKey) => boolean;
  hasAnyPermission: (permissions: PermissionKey[]) => boolean;
  hasAllPermissions: (permissions: PermissionKey[]) => boolean;
  permissions: PermissionKey[];
  isLoading: boolean;
  isError: boolean;
  /** True when permissions are loaded and user has no permissions */
  hasNoPermissions: boolean;
}

/**
 * Hook for checking user permissions on the client
 * Uses PermissionsProvider context - single fetch shared across all components
 *
 * States:
 * - isLoading: true while fetching permissions
 * - isError: true if fetch failed
 * - hasNoPermissions: true when loaded successfully but user has zero permissions
 * - permissions: empty array during loading/error, actual permissions when loaded
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { hasPermission, isLoading } = usePermissions();
 *
 *   if (isLoading) return <Skeleton />;
 *   if (!hasPermission(PERMISSIONS.ASSET_VIEW)) return null;
 *
 *   return <AssetList />;
 * }
 * ```
 */
export function usePermissions(): UsePermissionsReturn {
  return usePermissionsContext();
}
