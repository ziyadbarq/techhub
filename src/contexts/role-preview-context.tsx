/**
 * Role Preview Context
 *
 * Provides client-side, non-persistent role preview (effective permissions override)
 * for admins to test navigation/UI states without changing database assignments.
 */

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";

export interface PreviewableRole {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  permissions: PermissionKey[];
}

interface RolePreviewContextValue {
  roles: PreviewableRole[];
  isLoadingRoles: boolean;
  rolesError: string | null;
  previewRoleId: string | null;
  previewRoleName: string | null;
  previewPermissions: PermissionKey[] | null;
  isPreviewing: boolean;
  ensureRolesLoaded: () => Promise<void>;
  refreshRoles: () => Promise<void>;
  setPreviewRole: (roleId: string) => void;
  clearPreview: () => void;
}

const RolePreviewContext = createContext<RolePreviewContextValue | null>(null);

export function RolePreviewProvider({ children }: { children: ReactNode }) {
  const [roles, setRoles] = useState<PreviewableRole[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [previewRoleId, setPreviewRoleId] = useLocalStorage<string | null>(
    "role-preview:id",
    null,
  );
  const [previewRoleName, setPreviewRoleName] = useLocalStorage<string | null>(
    "role-preview:name",
    null,
  );
  const [previewPermissions, setPreviewPermissions] = useState<
    PermissionKey[] | null
  >(null);

  const fetchRoles = useCallback(async () => {
    setIsLoadingRoles(true);
    setRolesError(null);

    try {
      const response = await fetch("/api/rbac/roles-with-permissions");
      if (!response.ok) {
        const message =
          response.status === 403
            ? "You do not have permission to view roles."
            : "Failed to fetch roles.";
        setRoles([]);
        setRolesError(message);
        return;
      }

      const data = await response.json();
      setRoles(data.roles ?? []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch roles.";
      setRoles([]);
      setRolesError(message);
    } finally {
      setIsLoadingRoles(false);
    }
  }, []);

  const ensureRolesLoaded = useCallback(async () => {
    if (roles.length > 0 || isLoadingRoles) return;
    await fetchRoles();
  }, [fetchRoles, isLoadingRoles, roles.length]);

  // Re-apply stored preview when roles are loaded
  useEffect(() => {
    if (!previewRoleId || previewPermissions || roles.length === 0) return;
    const role = roles.find((r) => r.id === previewRoleId);
    if (role) {
      setPreviewPermissions(role.permissions);
      setPreviewRoleName(role.displayName ?? role.name);
    } else {
      setPreviewRoleId(null);
      setPreviewRoleName(null);
    }
  }, [
    previewRoleId,
    previewPermissions,
    roles,
    setPreviewRoleId,
    setPreviewRoleName,
  ]);

  const setPreviewRole = useCallback(
    (roleId: string) => {
      const role = roles.find((r) => r.id === roleId);
      if (!role) return;
      setPreviewPermissions(role.permissions);
      setPreviewRoleId(role.id);
      setPreviewRoleName(role.displayName ?? role.name);
    },
    [roles, setPreviewRoleId, setPreviewRoleName],
  );

  const clearPreview = useCallback(() => {
    setPreviewPermissions(null);
    setPreviewRoleId(null);
    setPreviewRoleName(null);
  }, [setPreviewRoleId, setPreviewRoleName]);

  const value = useMemo<RolePreviewContextValue>(
    () => ({
      roles,
      isLoadingRoles,
      rolesError,
      previewRoleId,
      previewRoleName,
      previewPermissions,
      isPreviewing: !!previewPermissions,
      ensureRolesLoaded,
      refreshRoles: fetchRoles,
      setPreviewRole,
      clearPreview,
    }),
    [
      roles,
      isLoadingRoles,
      rolesError,
      previewRoleId,
      previewRoleName,
      previewPermissions,
      ensureRolesLoaded,
      fetchRoles,
      setPreviewRole,
      clearPreview,
    ],
  );

  return (
    <RolePreviewContext.Provider value={value}>
      {children}
    </RolePreviewContext.Provider>
  );
}

export function useRolePreviewContext(): RolePreviewContextValue {
  const context = useContext(RolePreviewContext);
  if (!context) {
    throw new Error(
      "useRolePreviewContext must be used within a RolePreviewProvider",
    );
  }
  return context;
}

export function useOptionalRolePreviewContext(): RolePreviewContextValue | null {
  return useContext(RolePreviewContext);
}
