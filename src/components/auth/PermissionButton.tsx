"use client";

/**
 * Permission-aware Button Component
 * Automatically hides button if user lacks required permission
 */

import { usePermissions } from "@/hooks/use-permissions";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";

export interface PermissionButtonProps extends ComponentProps<typeof Button> {
  permission: PermissionKey;
  /**
   * If true, button is disabled instead of hidden when permission is missing
   * @default false
   */
  disableInsteadOfHide?: boolean;
  /**
   * Custom disabled message (tooltip or aria-label)
   */
  disabledMessage?: string;
  /**
   * Loading state override
   */
  loading?: boolean;
}

/**
 * Button that automatically hides or disables based on user permissions
 *
 * @example
 * ```tsx
 * <PermissionButton
 *   permission={PERMISSIONS.TASKS_CREATE}
 *   onClick={handleCreate}
 * >
 *   Create Task
 * </PermissionButton>
 *
 * <PermissionButton
 *   permission={PERMISSIONS.TASKS_DELETE}
 *   variant="destructive"
 *   disableInsteadOfHide
 *   disabledMessage="You don't have permission to delete tasks"
 * >
 *   Delete
 * </PermissionButton>
 * ```
 */
export function PermissionButton({
  permission,
  disableInsteadOfHide = false,
  disabledMessage,
  loading = false,
  disabled,
  children,
  ...buttonProps
}: PermissionButtonProps) {
  const { hasPermission, isLoading } = usePermissions();

  const userHasPermission = hasPermission(permission);
  const isButtonLoading = isLoading || loading;

  // Hide button if permission is missing and disableInsteadOfHide is false
  if (!disableInsteadOfHide && !isButtonLoading && !userHasPermission) {
    return null;
  }

  // Disable button if permission is missing and disableInsteadOfHide is true
  const isDisabled = disabled || isButtonLoading || !userHasPermission;

  return (
    <Button
      {...buttonProps}
      disabled={isDisabled}
      aria-label={
        !userHasPermission && disabledMessage ? disabledMessage : undefined
      }
      title={
        !userHasPermission && disabledMessage ? disabledMessage : undefined
      }
    >
      {children}
    </Button>
  );
}

/**
 * Multiple permissions button (AND logic - user must have ALL)
 */
export interface AllPermissionsButtonProps
  extends ComponentProps<typeof Button> {
  permissions: PermissionKey[];
  disableInsteadOfHide?: boolean;
  disabledMessage?: string;
  loading?: boolean;
}

export function AllPermissionsButton({
  permissions,
  disableInsteadOfHide = false,
  disabledMessage,
  loading = false,
  disabled,
  children,
  ...buttonProps
}: AllPermissionsButtonProps) {
  const { hasAllPermissions, isLoading } = usePermissions();

  const userHasPermissions = hasAllPermissions(permissions);
  const isButtonLoading = isLoading || loading;

  if (!disableInsteadOfHide && !isButtonLoading && !userHasPermissions) {
    return null;
  }

  const isDisabled = disabled || isButtonLoading || !userHasPermissions;

  return (
    <Button
      {...buttonProps}
      disabled={isDisabled}
      aria-label={
        !userHasPermissions && disabledMessage ? disabledMessage : undefined
      }
      title={
        !userHasPermissions && disabledMessage ? disabledMessage : undefined
      }
    >
      {children}
    </Button>
  );
}

/**
 * Multiple permissions button (OR logic - user must have ANY)
 */
export interface AnyPermissionButtonProps
  extends ComponentProps<typeof Button> {
  permissions: PermissionKey[];
  disableInsteadOfHide?: boolean;
  disabledMessage?: string;
  loading?: boolean;
}

export function AnyPermissionButton({
  permissions,
  disableInsteadOfHide = false,
  disabledMessage,
  loading = false,
  disabled,
  children,
  ...buttonProps
}: AnyPermissionButtonProps) {
  const { hasAnyPermission, isLoading } = usePermissions();

  const userHasPermissions = hasAnyPermission(permissions);
  const isButtonLoading = isLoading || loading;

  if (!disableInsteadOfHide && !isButtonLoading && !userHasPermissions) {
    return null;
  }

  const isDisabled = disabled || isButtonLoading || !userHasPermissions;

  return (
    <Button
      {...buttonProps}
      disabled={isDisabled}
      aria-label={
        !userHasPermissions && disabledMessage ? disabledMessage : undefined
      }
      title={
        !userHasPermissions && disabledMessage ? disabledMessage : undefined
      }
    >
      {children}
    </Button>
  );
}
