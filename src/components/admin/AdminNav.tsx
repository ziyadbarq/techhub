/**
 * Admin utilities (permission guard + section header)
 */

"use client";

import type React from "react";
import { usePermissions } from "@/hooks/use-permissions";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";

/**
 * Permission Guard Component
 * Wraps content that requires admin permissions
 */
interface PermissionGuardProps {
  children: React.ReactNode;
  permissions: PermissionKey | PermissionKey[];
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  children,
  permissions,
  fallback = null,
}: PermissionGuardProps) {
  const { hasAnyPermission } = usePermissions();
  const permissionsArray = Array.isArray(permissions)
    ? permissions
    : [permissions];
  const hasAccess = hasAnyPermission(permissionsArray);

  if (!hasAccess) {
    return fallback;
  }

  return <>{children}</>;
}

/**
 * Admin Section Header Component
 * Provides consistent header styling for admin sections
 */
interface AdminSectionHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function AdminSectionHeader({
  title,
  description,
  actions,
}: AdminSectionHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-2 text-sm">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
