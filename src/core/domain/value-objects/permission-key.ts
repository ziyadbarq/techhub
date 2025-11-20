/**
 * Permission Keys
 * Type-safe permission constants following resource:action pattern
 */

export const PERMISSIONS = {
  // Users
  USERS_VIEW: "users:view",
  USERS_CREATE: "users:create",
  USERS_UPDATE: "users:update",
  USERS_DELETE: "users:delete",
  USERS_MANAGE: "users:manage",

  // Tasks
  TASKS_VIEW: "tasks:view",
  TASKS_CREATE: "tasks:create",
  TASKS_UPDATE: "tasks:update",
  TASKS_UPDATE_OWN: "tasks:update:own",
  TASKS_DELETE: "tasks:delete",
  TASKS_DELETE_OWN: "tasks:delete:own",

  // Roles
  ROLES_VIEW: "roles:view",
  ROLES_CREATE: "roles:create",
  ROLES_UPDATE: "roles:update",
  ROLES_DELETE: "roles:delete",
  ROLES_MANAGE: "roles:manage",

  // Permissions
  PERMISSIONS_VIEW: "permissions:view",
  PERMISSIONS_CREATE: "permissions:create",
  PERMISSIONS_UPDATE: "permissions:update",
  PERMISSIONS_DELETE: "permissions:delete",
  PERMISSIONS_MANAGE: "permissions:manage",

  // Audit Logs
  AUDIT_LOGS_VIEW: "audit-logs:view",
  AUDIT_LOGS_EXPORT: "audit-logs:export",

  // Settings
  SETTINGS_VIEW: "settings:view",
  SETTINGS_MANAGE: "settings:manage",

  // Dashboard
  DASHBOARD_VIEW: "dashboard:view",
  DASHBOARD_ANALYTICS: "dashboard:analytics",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Helper to check if a string is a valid permission key
export function isPermissionKey(key: string): key is PermissionKey {
  return Object.values(PERMISSIONS).includes(key as PermissionKey);
}

// Helper to get resource and action from permission key
export function parsePermissionKey(key: PermissionKey): {
  resource: string;
  action: string;
} {
  const [resource, ...actionParts] = key.split(":");
  return {
    resource,
    action: actionParts.join(":"),
  };
}
