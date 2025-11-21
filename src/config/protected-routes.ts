/**
 * Protected Routes Configuration
 * Centralized configuration for route-level permission requirements
 *
 * Note: Next.js 16 middleware should keep permissions lightweight.
 * Full permission validation happens in server actions and use cases.
 * This config is primarily for documentation and optional middleware enhancement.
 */

import {
  PERMISSIONS,
  type PermissionKey,
} from "@/core/domain/value-objects/permission-key";

export interface RouteProtection {
  /**
   * Permissions required to access this route
   * User must have ANY of these permissions (OR logic)
   */
  requiredPermissions?: PermissionKey[];
  /**
   * Permissions required to access this route
   * User must have ALL of these permissions (AND logic)
   */
  requiredAllPermissions?: PermissionKey[];
  /**
   * Roles required to access this route
   * User must have ANY of these roles (OR logic)
   */
  requiredRoles?: string[];
  /**
   * Description of what this route is for
   */
  description?: string;
}

/**
 * Protected routes configuration map
 * Key: Route path pattern
 * Value: Route protection configuration
 */
export const PROTECTED_ROUTES: Record<string, RouteProtection> = {
  // ============================================================================
  // ADMIN ROUTES
  // ============================================================================

  "/admin": {
    requiredPermissions: [
      PERMISSIONS.USERS_MANAGE,
      PERMISSIONS.ROLES_VIEW,
      PERMISSIONS.PERMISSIONS_VIEW,
    ],
    description: "Admin dashboard - requires any admin permission",
  },

  "/admin/roles": {
    requiredPermissions: [PERMISSIONS.ROLES_VIEW],
    description: "Role management - view, create, edit, delete roles",
  },

  "/admin/roles/new": {
    requiredPermissions: [PERMISSIONS.ROLES_CREATE],
    description: "Create new role",
  },

  "/admin/roles/[id]": {
    requiredPermissions: [PERMISSIONS.ROLES_VIEW],
    description: "View/edit specific role",
  },

  "/admin/roles/[id]/permissions": {
    requiredPermissions: [PERMISSIONS.ROLES_MANAGE],
    description: "Assign permissions to role",
  },

  "/admin/permissions": {
    requiredPermissions: [PERMISSIONS.PERMISSIONS_VIEW],
    description:
      "Permission management - view, create, edit, delete permissions",
  },

  "/admin/permissions/new": {
    requiredPermissions: [PERMISSIONS.PERMISSIONS_CREATE],
    description: "Create new permission",
  },

  "/admin/permissions/[id]": {
    requiredPermissions: [PERMISSIONS.PERMISSIONS_VIEW],
    description: "View/edit specific permission",
  },

  "/admin/users": {
    requiredPermissions: [PERMISSIONS.USERS_VIEW],
    description: "User management - view users and their roles",
  },

  "/admin/users/[id]": {
    requiredPermissions: [PERMISSIONS.USERS_VIEW],
    description: "View specific user details",
  },

  "/admin/users/[id]/roles": {
    requiredPermissions: [PERMISSIONS.USERS_MANAGE],
    description: "Assign roles to user",
  },

  "/admin/audit-logs": {
    requiredPermissions: [PERMISSIONS.AUDIT_LOGS_VIEW],
    description: "View audit logs of all RBAC changes",
  },

  // ============================================================================
  // TASK ROUTES
  // ============================================================================

  "/tasks": {
    requiredPermissions: [PERMISSIONS.TASKS_VIEW],
    description: "Task list - view all tasks",
  },

  "/tasks/new": {
    requiredPermissions: [PERMISSIONS.TASKS_CREATE],
    description: "Create new task",
  },

  "/tasks/[id]": {
    requiredPermissions: [PERMISSIONS.TASKS_VIEW],
    description: "View specific task (ownership checks apply for editing)",
  },

  "/tasks/active": {
    requiredPermissions: [PERMISSIONS.TASKS_VIEW],
    description: "View active tasks",
  },

  "/tasks/completed": {
    requiredPermissions: [PERMISSIONS.TASKS_VIEW],
    description: "View completed tasks",
  },

  "/tasks/archived": {
    requiredPermissions: [PERMISSIONS.TASKS_VIEW],
    description: "View archived tasks",
  },

  // ============================================================================
  // SETTINGS ROUTES
  // ============================================================================

  "/settings": {
    requiredPermissions: [PERMISSIONS.SETTINGS_VIEW],
    description: "Application settings",
  },

  "/settings/account": {
    requiredPermissions: [PERMISSIONS.SETTINGS_VIEW],
    description: "Account settings",
  },

  "/settings/preferences": {
    requiredPermissions: [PERMISSIONS.SETTINGS_VIEW],
    description: "User preferences",
  },

  "/settings/security": {
    requiredPermissions: [PERMISSIONS.SETTINGS_MANAGE],
    description: "Security settings - manage passwords, 2FA, etc.",
  },

  // ============================================================================
  // ANALYTICS & REPORTS
  // ============================================================================

  "/analytics": {
    requiredPermissions: [PERMISSIONS.DASHBOARD_ANALYTICS],
    description: "Analytics dashboard",
  },

  "/reports": {
    requiredPermissions: [PERMISSIONS.DASHBOARD_ANALYTICS],
    description: "Reports and statistics",
  },

  "/reports/usage": {
    requiredPermissions: [PERMISSIONS.DASHBOARD_ANALYTICS],
    description: "Usage statistics report",
  },

  "/reports/performance": {
    requiredPermissions: [PERMISSIONS.DASHBOARD_ANALYTICS],
    description: "Performance metrics report",
  },

  // ============================================================================
  // TEAM MANAGEMENT
  // ============================================================================

  "/team": {
    requiredPermissions: [PERMISSIONS.USERS_VIEW],
    description: "Team members list",
  },

  "/team/roles": {
    requiredPermissions: [PERMISSIONS.USERS_MANAGE],
    description: "Team role management",
  },
};

/**
 * Public routes that don't require authentication
 */
export const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/unauthorized",
  "/api/auth",
  "/setup",
] as const;

/**
 * Check if a route is public
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route),
  );
}

/**
 * Get protection config for a route
 * Handles dynamic routes with [id] pattern
 */
export function getRouteProtection(pathname: string): RouteProtection | null {
  // Exact match
  if (PROTECTED_ROUTES[pathname]) {
    return PROTECTED_ROUTES[pathname];
  }

  // Try to match dynamic routes
  // e.g., /tasks/123 matches /tasks/[id]
  for (const [pattern, protection] of Object.entries(PROTECTED_ROUTES)) {
    if (pattern.includes("[")) {
      const regexPattern = pattern
        .replace(/\[.*?\]/g, "[^/]+") // Replace [id] with regex pattern
        .replace(/\//g, "\\/"); // Escape forward slashes
      const regex = new RegExp(`^${regexPattern}$`);

      if (regex.test(pathname)) {
        return protection;
      }
    }
  }

  return null;
}

/**
 * Get all routes that require a specific permission
 */
export function getRoutesByPermission(
  permission: PermissionKey,
): Array<{ path: string; protection: RouteProtection }> {
  return Object.entries(PROTECTED_ROUTES)
    .filter(
      ([_path, protection]) =>
        protection.requiredPermissions?.includes(permission) ||
        protection.requiredAllPermissions?.includes(permission),
    )
    .map(([path, protection]) => ({ path, protection }));
}

/**
 * Get all protected route paths
 */
export function getAllProtectedRoutes(): string[] {
  return Object.keys(PROTECTED_ROUTES);
}

/**
 * Check if user has access to route based on permissions
 * This is a helper for client-side route protection
 */
export function canAccessRoute(
  pathname: string,
  userPermissions: PermissionKey[],
): boolean {
  const protection = getRouteProtection(pathname);

  if (!protection) {
    // No protection configured = allow access
    return true;
  }

  // Check required permissions (OR logic - user needs ANY)
  if (protection.requiredPermissions) {
    const hasAnyPermission = protection.requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );
    if (!hasAnyPermission) {
      return false;
    }
  }

  // Check required all permissions (AND logic - user needs ALL)
  if (protection.requiredAllPermissions) {
    const hasAllPermissions = protection.requiredAllPermissions.every(
      (permission) => userPermissions.includes(permission),
    );
    if (!hasAllPermissions) {
      return false;
    }
  }

  return true;
}
