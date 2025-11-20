"use client";

/**
 * Role Guard Component
 * Conditionally renders children based on user roles
 */

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth/client";

export interface RoleGuardProps {
  roles: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
  /**
   * If true, user must have ALL roles (AND logic)
   * If false, user must have ANY role (OR logic)
   * @default false
   */
  requireAll?: boolean;
}

interface UserRolesResponse {
  roles: Array<{
    id: string;
    name: string;
    displayName: string;
  }>;
}

/**
 * RoleGuard component
 * Shows/hides content based on user's assigned roles
 *
 * @example
 * ```tsx
 * <RoleGuard roles="admin">
 *   <AdminPanel />
 * </RoleGuard>
 *
 * <RoleGuard roles={["admin", "manager"]} requireAll={false}>
 *   <ManagerPanel />
 * </RoleGuard>
 * ```
 */
export function RoleGuard({
  roles,
  children,
  fallback = null,
  loading = null,
  requireAll = false,
}: RoleGuardProps) {
  const { data: session, isPending } = useSession();
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  useEffect(() => {
    async function fetchUserRoles() {
      if (!session?.user) {
        setUserRoles([]);
        setIsLoadingRoles(false);
        return;
      }

      try {
        setIsLoadingRoles(true);
        const response = await fetch("/api/rbac/my-roles");
        if (response.ok) {
          const data: UserRolesResponse = await response.json();
          setUserRoles(data.roles.map((role) => role.name));
        }
      } catch (error) {
        console.error("Failed to fetch user roles:", error);
        setUserRoles([]);
      } finally {
        setIsLoadingRoles(false);
      }
    }

    fetchUserRoles();
  }, [session?.user, session?.user?.id]);

  const requiredRoles = Array.isArray(roles) ? roles : [roles];

  const hasRequiredRoles = requireAll
    ? requiredRoles.every((role) => userRoles.includes(role))
    : requiredRoles.some((role) => userRoles.includes(role));

  if (isPending || isLoadingRoles) {
    return <>{loading}</>;
  }

  if (!hasRequiredRoles) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook to check user roles
 */
export function useRoles() {
  const { data: session, isPending } = useSession();
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRoles() {
      if (!session?.user) {
        setRoles([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch("/api/rbac/my-roles");
        if (response.ok) {
          const data: UserRolesResponse = await response.json();
          setRoles(data.roles.map((role) => role.name));
        }
      } catch (error) {
        console.error("Failed to fetch roles:", error);
        setRoles([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRoles();
  }, [session?.user, session?.user?.id]);

  const hasRole = (role: string): boolean => {
    return roles.includes(role);
  };

  const hasAnyRole = (rolesToCheck: string[]): boolean => {
    return rolesToCheck.some((role) => roles.includes(role));
  };

  const hasAllRoles = (rolesToCheck: string[]): boolean => {
    return rolesToCheck.every((role) => roles.includes(role));
  };

  return {
    roles,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isLoading: isPending || isLoading,
  };
}
