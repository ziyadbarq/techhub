"use client";

/**
 * Permission Guard Component
 * Conditionally renders children based on user permissions
 */

import { usePermissions } from "@/hooks/use-permissions";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";

export interface PermissionGuardProps {
  permission: PermissionKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

export function PermissionGuard({
  permission,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission, isLoading } = usePermissions();
  const granted = hasPermission(permission);
  // During loading, keep rendering children to avoid unmount/reset flicker after initial grant.
  if (isLoading) {
    return <>{children}</>;
  }
  return <>{granted ? children : fallback}</>;
}

/**
 * Multiple Permissions Guard (AND logic - user must have ALL)
 */
export interface AllPermissionsGuardProps {
  permissions: PermissionKey[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

export function AllPermissionsGuard({
  permissions,
  children,
  fallback = null,
  loading = null,
}: AllPermissionsGuardProps) {
  const { hasAllPermissions, isLoading } = usePermissions();

  if (isLoading) {
    return <>{loading}</>;
  }

  if (!hasAllPermissions(permissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Multiple Permissions Guard (OR logic - user must have ANY)
 */
export interface AnyPermissionGuardProps {
  permissions: PermissionKey[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

export function AnyPermissionGuard({
  permissions,
  children,
  fallback = null,
  loading = null,
}: AnyPermissionGuardProps) {
  const { hasAnyPermission, isLoading } = usePermissions();

  if (isLoading) {
    return <>{loading}</>;
  }

  if (!hasAnyPermission(permissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
