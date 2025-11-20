"use client";

/**
 * Permission-aware Link Component
 * Automatically hides link if user lacks required permission
 */

import Link, { type LinkProps } from "next/link";
import { usePermissions } from "@/hooks/use-permissions";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";
import { cn } from "@/lib/utils";

export interface PermissionLinkProps
  extends Omit<LinkProps, "href">,
    Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  permission: PermissionKey;
  href: string;
  /**
   * If true, link is rendered as disabled instead of hidden
   * @default false
   */
  disableInsteadOfHide?: boolean;
  /**
   * Custom className for the link
   */
  className?: string;
  children: React.ReactNode;
}

/**
 * Link that automatically hides or disables based on user permissions
 *
 * @example
 * ```tsx
 * <PermissionLink
 *   permission={PERMISSIONS.TASKS_CREATE}
 *   href="/tasks/new"
 * >
 *   Create New Task
 * </PermissionLink>
 *
 * <PermissionLink
 *   permission={PERMISSIONS.ADMIN_ACCESS}
 *   href="/admin"
 *   disableInsteadOfHide
 *   className="nav-link"
 * >
 *   Admin Panel
 * </PermissionLink>
 * ```
 */
export function PermissionLink({
  permission,
  href,
  disableInsteadOfHide = false,
  className,
  children,
  ...linkProps
}: PermissionLinkProps) {
  const { hasPermission, isLoading } = usePermissions();

  const userHasPermission = hasPermission(permission);

  // Hide link if permission is missing and disableInsteadOfHide is false
  if (!disableInsteadOfHide && !isLoading && !userHasPermission) {
    return null;
  }

  // Render as disabled link if permission is missing and disableInsteadOfHide is true
  if (disableInsteadOfHide && !userHasPermission) {
    return (
      <span
        className={cn("cursor-not-allowed opacity-50", className)}
        aria-disabled="true"
        title="You don't have permission to access this"
      >
        {children}
      </span>
    );
  }

  return (
    <Link href={href} className={className} {...linkProps}>
      {children}
    </Link>
  );
}

/**
 * Multiple permissions link (AND logic - user must have ALL)
 */
export interface AllPermissionsLinkProps
  extends Omit<LinkProps, "href">,
    Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  permissions: PermissionKey[];
  href: string;
  disableInsteadOfHide?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function AllPermissionsLink({
  permissions,
  href,
  disableInsteadOfHide = false,
  className,
  children,
  ...linkProps
}: AllPermissionsLinkProps) {
  const { hasAllPermissions, isLoading } = usePermissions();

  const userHasPermissions = hasAllPermissions(permissions);

  if (!disableInsteadOfHide && !isLoading && !userHasPermissions) {
    return null;
  }

  if (disableInsteadOfHide && !userHasPermissions) {
    return (
      <span
        className={cn("cursor-not-allowed opacity-50", className)}
        aria-disabled="true"
        title="You don't have permission to access this"
      >
        {children}
      </span>
    );
  }

  return (
    <Link href={href} className={className} {...linkProps}>
      {children}
    </Link>
  );
}

/**
 * Multiple permissions link (OR logic - user must have ANY)
 */
export interface AnyPermissionLinkProps
  extends Omit<LinkProps, "href">,
    Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  permissions: PermissionKey[];
  href: string;
  disableInsteadOfHide?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function AnyPermissionLink({
  permissions,
  href,
  disableInsteadOfHide = false,
  className,
  children,
  ...linkProps
}: AnyPermissionLinkProps) {
  const { hasAnyPermission, isLoading } = usePermissions();

  const userHasPermissions = hasAnyPermission(permissions);

  if (!disableInsteadOfHide && !isLoading && !userHasPermissions) {
    return null;
  }

  if (disableInsteadOfHide && !userHasPermissions) {
    return (
      <span
        className={cn("cursor-not-allowed opacity-50", className)}
        aria-disabled="true"
        title="You don't have permission to access this"
      >
        {children}
      </span>
    );
  }

  return (
    <Link href={href} className={className} {...linkProps}>
      {children}
    </Link>
  );
}
