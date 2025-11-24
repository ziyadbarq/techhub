/**
 * RBAC Roles - Consolidated Exports
 *
 * All system role definitions with their assigned permissions.
 * Split from a single 799-line file into 4 functional categories for better maintainability:
 * - Admin & System Roles
 * - Financial & Procurement Roles
 * - Technical & Operations Roles
 * - Specialized Roles
 */

// Types
export type { RoleDefinition } from "./types";

// Individual role categories
export { ADMIN_ROLES } from "./seed-rbac-roles-admin";
export { FINANCIAL_ROLES } from "./seed-rbac-roles-financial";
export { TECHNICAL_ROLES } from "./seed-rbac-roles-technical";
export { SPECIALIZED_ROLES } from "./seed-rbac-roles-specialized";

// Import for combining
import { ADMIN_ROLES } from "./seed-rbac-roles-admin";
import { FINANCIAL_ROLES } from "./seed-rbac-roles-financial";
import { TECHNICAL_ROLES } from "./seed-rbac-roles-technical";
import { SPECIALIZED_ROLES } from "./seed-rbac-roles-specialized";
import type { RoleDefinition } from "./types";

/**
 * System roles with their permissions
 * Organized by function: admin + financial + technical + specialized
 * Maintains backward compatibility with existing seed scripts
 */
export const SYSTEM_ROLES: Record<string, RoleDefinition> = {
  ...ADMIN_ROLES,
  ...FINANCIAL_ROLES,
  ...TECHNICAL_ROLES,
  ...SPECIALIZED_ROLES,
} as const;
