/**
 * Permissions Context
 * Provides centralized permission fetching to prevent duplicate API calls
 * All components should use usePermissionsContext() instead of independent fetching
 */

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useSessionContext } from "@/contexts/session-context";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";

interface PermissionsContextValue {
  permissions: PermissionKey[];
  isLoading: boolean;
  isError: boolean;
  hasNoPermissions: boolean;
  hasPermission: (permission: PermissionKey) => boolean;
  hasAnyPermission: (permissions: PermissionKey[]) => boolean;
  hasAllPermissions: (permissions: PermissionKey[]) => boolean;
  refetch: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

interface PermissionsProviderProps {
  children: ReactNode;
}

/**
 * Provider that fetches permissions ONCE and shares with all consumers
 * Handles user session changes and refetch capability
 *
 * IMPORTANT: This provider should be placed after SessionProvider in the tree
 * to ensure user state is available for permission fetching.
 *
 * Benefits:
 * - Single /api/rbac/my-permissions call instead of multiple across components
 * - Reduces API calls from N components to 1
 * - Consistent permission state across all consumers
 */
export function PermissionsProvider({ children }: PermissionsProviderProps) {
  const { user, isPending } = useSessionContext();
  const [permissions, setPermissions] = useState<PermissionKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [hasNoPermissions, setHasNoPermissions] = useState(false);

  const fetchPermissions = useCallback(async () => {
    if (!user) {
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
  }, [user]);

  useEffect(() => {
    if (!isPending) {
      fetchPermissions();
    }
  }, [fetchPermissions, isPending, user?.id]);

  const hasPermission = useCallback(
    (permission: PermissionKey): boolean => {
      return permissions.includes(permission);
    },
    [permissions],
  );

  const hasAnyPermission = useCallback(
    (perms: PermissionKey[]): boolean => {
      return perms.some((p) => permissions.includes(p));
    },
    [permissions],
  );

  const hasAllPermissions = useCallback(
    (perms: PermissionKey[]): boolean => {
      return perms.every((p) => permissions.includes(p));
    },
    [permissions],
  );

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        isLoading: isPending || isLoading,
        isError,
        hasNoPermissions,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        refetch: fetchPermissions,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

/**
 * Hook to access permissions from context
 * Must be used within PermissionsProvider
 */
export function usePermissionsContext(): PermissionsContextValue {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error(
      "usePermissionsContext must be used within PermissionsProvider",
    );
  }
  return context;
}
