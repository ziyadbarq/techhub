/**
 * RBAC Roles
 *
 * System Administrator (protected, all permissions), Viewer (every
 * employee) and the four base roles: Asset Manager, Asset Officer,
 * CMDB Manager and Workflow Officer. Only System Administrator is protected;
 * the others can be edited from Roles after seeding.
 */

export type { RoleDefinition } from "./types";
export { ADMIN_ROLES } from "./seed-rbac-roles-admin";
export { BASE_ROLES, EMPLOYEE_PERMISSIONS } from "./seed-rbac-roles-base";

import { ADMIN_ROLES } from "./seed-rbac-roles-admin";
import { BASE_ROLES } from "./seed-rbac-roles-base";
import type { RoleDefinition } from "./types";

export const SYSTEM_ROLES: Record<string, RoleDefinition> = {
  ...ADMIN_ROLES,
  ...BASE_ROLES,
} as const;
