"use client";

/**
 * Permission Hooks
 * Client-side React hooks for permission checking
 */

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth/client";
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
 * Fetches and caches user permissions from the server
 *
 * States:
 * - isLoading: true while fetching permissions
 * - isError: true if fetch failed
 * - hasNoPermissions: true when loaded successfully but user has zero permissions
 * - permissions: empty array during loading/error, actual permissions when loaded
 */
export function usePermissions(): UsePermissionsReturn {
  const { data: session, isPending } = useSession();
  const [permissions, setPermissions] = useState<PermissionKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [hasNoPermissions, setHasNoPermissions] = useState(false);

  useEffect(() => {
    async function fetchPermissions() {
      if (!session?.user) {
        setPermissions([]);
        setIsLoading(false);
        setIsError(false);
        setHasNoPermissions(false);
        return;
      }

      try {
        setIsLoading(true);
        setIsError(false);
        const response = await fetch("/api/rbac/my-permissions");
        if (response.ok) {
          const data = await response.json();
          const userPermissions = data.permissions || [];
          setPermissions(userPermissions);
          setHasNoPermissions(userPermissions.length === 0);
        } else {
          // Server returned error - mark as error state, keep empty permissions
          setIsError(true);
          setPermissions([]);
          setHasNoPermissions(false);
        }
      } catch (error) {
        console.error("Failed to fetch permissions:", error);
        // Network/fetch error - mark as error state, keep empty permissions
        setIsError(true);
        setPermissions([]);
        setHasNoPermissions(false);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPermissions();
  }, [session?.user, session?.user?.id]);

  const hasPermission = (permission: PermissionKey): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (perms: PermissionKey[]): boolean => {
    return perms.some((p) => permissions.includes(p));
  };

  const hasAllPermissions = (perms: PermissionKey[]): boolean => {
    return perms.every((p) => permissions.includes(p));
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    permissions,
    isLoading: isPending || isLoading,
    isError,
    hasNoPermissions,
  };
}
