/**
 * RBAC Role Types
 *
 * Shared type definitions for role configuration
 */

import type { PermissionKey } from "@/core/domain/value-objects/permission-key";

/**
 * Role definition shape
 */
export interface RoleDefinition {
  name: string;
  displayName: string;
  description: string;
  permissions: PermissionKey[];
}
