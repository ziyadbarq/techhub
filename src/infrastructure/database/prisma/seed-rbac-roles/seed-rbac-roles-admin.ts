/**
 * Admin & System Roles
 *
 * - system-administrator: Full system access (protected)
 * - viewer: every employee's self-service access
 */

import { SYSTEM_PERMISSIONS } from "../seed-rbac-permissions";
import { EMPLOYEE_PERMISSIONS } from "./seed-rbac-roles-base";
import type { RoleDefinition } from "./types";

const ALL_PERMISSION_KEYS = SYSTEM_PERMISSIONS.map((perm) => perm.name);

export const ADMIN_ROLES: Record<string, RoleDefinition> = {
  /**
   * System Administrator - Full system access
   * Has all available permissions in the system
   */
  "system-administrator": {
    name: "system-administrator",
    displayName: "System Administrator",
    description: "Full system access with all permissions",
    permissions: ALL_PERMISSION_KEYS, // All permissions
  },

  /**
   * Viewer - every employee's self-service access: dashboard, their own
   * requests, approvals assigned to them, and the knowledge base.
   */
  viewer: {
    name: "viewer",
    displayName: "Viewer",
    description:
      "Employee self-service: dashboard, own requests, assigned approvals and the knowledge base",
    permissions: EMPLOYEE_PERMISSIONS,
  },
};
