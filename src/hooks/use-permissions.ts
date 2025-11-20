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
}

/**
 * Hook for checking user permissions on the client
 * Fetches and caches user permissions from the server
 */
export function usePermissions(): UsePermissionsReturn {
  const { data: session, isPending } = useSession();
  const [permissions, setPermissions] = useState<PermissionKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPermissions() {
      if (!session?.user) {
        setPermissions([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch("/api/rbac/my-permissions");
        if (response.ok) {
          const data = await response.json();
          setPermissions(data.permissions || []);
        }
      } catch (error) {
        console.error("Failed to fetch permissions:", error);
        setPermissions([]);
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
  };
}
