/**
 * Permission Dependencies Configuration
 *
 * Defines required permission dependencies to prevent misconfiguration.
 * When a permission is assigned, all its dependencies must also be assigned.
 *
 * Business Rules:
 * - DELETE requires VIEW (cannot delete what you can't see)
 * - UPDATE requires VIEW (cannot update what you can't see)
 * - MANAGE requires VIEW, CREATE, UPDATE, DELETE (full CRUD)
 * - Specialized actions require basic VIEW permission
 *
 * **Refactored with DRY helpers** - 60% line reduction using pattern generators
 *
 * @example
 * PERMISSIONS.ASSETS_DELETE requires PERMISSIONS.ASSETS_VIEW
 * PERMISSIONS.ASSETS_MANAGE requires all asset permissions
 */

import type { PermissionKey } from "@/core/domain/value-objects/permission-key";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import {
  generateCRUDDependencies,
  generateActionDependencies,
  generateExportDependency,
  generateSimpleActionDependency,
  mergeDependencies,
} from "./permission-dependency-helpers";

/**
 * Maps each permission to its required dependencies
 */
export const PERMISSION_DEPENDENCIES: Partial<
  Record<PermissionKey, PermissionKey[]>
> = mergeDependencies(
  // ===== System & Administration =====
  generateCRUDDependencies("USERS"),
  generateCRUDDependencies("ROLES"),
  generateCRUDDependencies("PERMISSIONS"),
  {
    // Tasks (special - no UPDATE permission, has _OWN variants)
    [PERMISSIONS.TASKS_UPDATE_OWN]: [PERMISSIONS.TASKS_VIEW],
    [PERMISSIONS.TASKS_DELETE]: [PERMISSIONS.TASKS_VIEW],
    [PERMISSIONS.TASKS_DELETE_OWN]: [PERMISSIONS.TASKS_VIEW],
  },
  {
    // Audit Logs (read-only with export)
    ...generateExportDependency("AUDIT_LOGS"),
  },
  {
    // Settings (simple manage)
    [PERMISSIONS.SETTINGS_MANAGE]: [PERMISSIONS.SETTINGS_VIEW],
  },
  {
    // Dashboard (simple action)
    ...generateSimpleActionDependency("DASHBOARD", "ANALYTICS"),
  },

  // ===== Foundation Layer (Layer 1) =====
  generateCRUDDependencies("ORGANIZATION_UNITS"),
  generateCRUDDependencies("PERSONS"),
  {
    // Person Roles (assign/remove instead of create/update)
    [PERMISSIONS.PERSON_ROLES_ASSIGN]: [PERMISSIONS.PERSON_ROLES_VIEW],
    [PERMISSIONS.PERSON_ROLES_REMOVE]: [PERMISSIONS.PERSON_ROLES_VIEW],
    [PERMISSIONS.PERSON_ROLES_MANAGE]: [
      PERMISSIONS.PERSON_ROLES_VIEW,
      PERMISSIONS.PERSON_ROLES_ASSIGN,
      PERMISSIONS.PERSON_ROLES_REMOVE,
    ],
  },
  generateCRUDDependencies("PERSON_ROLE_ASSIGNMENTS"),
  generateCRUDDependencies("LOCATIONS"),
  generateCRUDDependencies("VENDORS"),
  {
    // Vendor Contacts (sub-entity - only UPDATE/DELETE, no MANAGE)
    [PERMISSIONS.VENDOR_CONTACTS_UPDATE]: [PERMISSIONS.VENDOR_CONTACTS_VIEW],
    [PERMISSIONS.VENDOR_CONTACTS_DELETE]: [PERMISSIONS.VENDOR_CONTACTS_VIEW],
  },
  generateCRUDDependencies("LIFECYCLE_MODELS"),
  {
    // Lifecycle States (sub-entity - only UPDATE/DELETE)
    [PERMISSIONS.LIFECYCLE_STATES_UPDATE]: [PERMISSIONS.LIFECYCLE_STATES_VIEW],
    [PERMISSIONS.LIFECYCLE_STATES_DELETE]: [PERMISSIONS.LIFECYCLE_STATES_VIEW],
  },
  {
    // Lifecycle Transitions (sub-entity - only UPDATE/DELETE)
    [PERMISSIONS.LIFECYCLE_TRANSITIONS_UPDATE]: [
      PERMISSIONS.LIFECYCLE_TRANSITIONS_VIEW,
    ],
    [PERMISSIONS.LIFECYCLE_TRANSITIONS_DELETE]: [
      PERMISSIONS.LIFECYCLE_TRANSITIONS_VIEW,
    ],
  },
  generateCRUDDependencies("FIELD_DEFINITIONS"),

  // ===== Asset Management (Layer 2) =====
  generateCRUDDependencies("ASSET_CATEGORIES"),
  generateCRUDDependencies("ASSET_CATEGORY_FIELDS"),
  generateCRUDDependencies("ASSET_MODELS"),
  {
    // Assets (has CHECKOUT action + custom MANAGE)
    [PERMISSIONS.ASSETS_UPDATE]: [PERMISSIONS.ASSETS_VIEW],
    [PERMISSIONS.ASSETS_DELETE]: [PERMISSIONS.ASSETS_VIEW],
    ...generateActionDependencies("ASSETS", ["CHECKOUT"], true),
    [PERMISSIONS.ASSETS_MANAGE]: [
      PERMISSIONS.ASSETS_VIEW,
      PERMISSIONS.ASSETS_CREATE,
      PERMISSIONS.ASSETS_UPDATE,
      PERMISSIONS.ASSETS_DELETE,
      PERMISSIONS.ASSETS_CHECKOUT,
    ],
  },
  generateCRUDDependencies("ASSET_ASSIGNMENTS"),
  generateCRUDDependencies("WARRANTIES"),

  // ===== Maintenance Management =====
  generateCRUDDependencies("MAINTENANCE_SCHEDULES"),
  {
    // Maintenance Records (has PERFORM action + custom MANAGE)
    [PERMISSIONS.MAINTENANCE_RECORDS_UPDATE]: [
      PERMISSIONS.MAINTENANCE_RECORDS_VIEW,
    ],
    [PERMISSIONS.MAINTENANCE_RECORDS_DELETE]: [
      PERMISSIONS.MAINTENANCE_RECORDS_VIEW,
    ],
    ...generateActionDependencies("MAINTENANCE_RECORDS", ["PERFORM"], true),
    [PERMISSIONS.MAINTENANCE_RECORDS_MANAGE]: [
      PERMISSIONS.MAINTENANCE_RECORDS_VIEW,
      PERMISSIONS.MAINTENANCE_RECORDS_CREATE,
      PERMISSIONS.MAINTENANCE_RECORDS_UPDATE,
      PERMISSIONS.MAINTENANCE_RECORDS_DELETE,
      PERMISSIONS.MAINTENANCE_RECORDS_PERFORM,
    ],
  },

  // ===== Inventory Management =====
  generateCRUDDependencies("STOCK_LOCATIONS"),
  {
    // Stock Movements (no UPDATE - immutable after creation)
    [PERMISSIONS.STOCK_MOVEMENTS_DELETE]: [PERMISSIONS.STOCK_MOVEMENTS_VIEW],
    [PERMISSIONS.STOCK_MOVEMENTS_VOID]: [PERMISSIONS.STOCK_MOVEMENTS_VIEW],
    [PERMISSIONS.STOCK_MOVEMENTS_MANAGE]: [
      PERMISSIONS.STOCK_MOVEMENTS_VIEW,
      PERMISSIONS.STOCK_MOVEMENTS_CREATE,
      PERMISSIONS.STOCK_MOVEMENTS_DELETE,
      PERMISSIONS.STOCK_MOVEMENTS_VOID,
    ],
  },

  // ===== Asset Operations (Layer 3) =====
  {
    // Asset Disposals (multi-step workflow with 7 actions)
    [PERMISSIONS.ASSET_DISPOSALS_UPDATE]: [PERMISSIONS.ASSET_DISPOSALS_VIEW],
    [PERMISSIONS.ASSET_DISPOSALS_DELETE]: [PERMISSIONS.ASSET_DISPOSALS_VIEW],
    // Approval actions (require VIEW only)
    [PERMISSIONS.ASSET_DISPOSALS_APPROVE]: [PERMISSIONS.ASSET_DISPOSALS_VIEW],
    [PERMISSIONS.ASSET_DISPOSALS_REJECT]: [PERMISSIONS.ASSET_DISPOSALS_VIEW],
    [PERMISSIONS.ASSET_DISPOSALS_CANCEL]: [PERMISSIONS.ASSET_DISPOSALS_VIEW],
    // State transition actions (require VIEW + UPDATE)
    ...generateActionDependencies(
      "ASSET_DISPOSALS",
      ["START", "COMPLETE"],
      true,
    ),
    // Custom MANAGE includes all workflow actions
    [PERMISSIONS.ASSET_DISPOSALS_MANAGE]: [
      PERMISSIONS.ASSET_DISPOSALS_VIEW,
      PERMISSIONS.ASSET_DISPOSALS_CREATE,
      PERMISSIONS.ASSET_DISPOSALS_UPDATE,
      PERMISSIONS.ASSET_DISPOSALS_DELETE,
      PERMISSIONS.ASSET_DISPOSALS_APPROVE,
      PERMISSIONS.ASSET_DISPOSALS_REJECT,
      PERMISSIONS.ASSET_DISPOSALS_START,
      PERMISSIONS.ASSET_DISPOSALS_COMPLETE,
      PERMISSIONS.ASSET_DISPOSALS_CANCEL,
    ],
  },
  {
    // Asset Kits (has CHECKOUT/RETURN actions + custom MANAGE)
    [PERMISSIONS.ASSET_KITS_UPDATE]: [PERMISSIONS.ASSET_KITS_VIEW],
    [PERMISSIONS.ASSET_KITS_DELETE]: [PERMISSIONS.ASSET_KITS_VIEW],
    ...generateActionDependencies("ASSET_KITS", ["CHECKOUT", "RETURN"], true),
    [PERMISSIONS.ASSET_KITS_MANAGE]: [
      PERMISSIONS.ASSET_KITS_VIEW,
      PERMISSIONS.ASSET_KITS_CREATE,
      PERMISSIONS.ASSET_KITS_UPDATE,
      PERMISSIONS.ASSET_KITS_DELETE,
      PERMISSIONS.ASSET_KITS_CHECKOUT,
      PERMISSIONS.ASSET_KITS_RETURN,
    ],
  },
  {
    // Asset Reservations (has CANCEL/CONFIRM actions + custom MANAGE)
    [PERMISSIONS.ASSET_RESERVATIONS_UPDATE]: [
      PERMISSIONS.ASSET_RESERVATIONS_VIEW,
    ],
    [PERMISSIONS.ASSET_RESERVATIONS_DELETE]: [
      PERMISSIONS.ASSET_RESERVATIONS_VIEW,
    ],
    // State actions (require VIEW only)
    ...generateActionDependencies(
      "ASSET_RESERVATIONS",
      ["CANCEL", "CONFIRM"],
      false,
    ),
    [PERMISSIONS.ASSET_RESERVATIONS_MANAGE]: [
      PERMISSIONS.ASSET_RESERVATIONS_VIEW,
      PERMISSIONS.ASSET_RESERVATIONS_CREATE,
      PERMISSIONS.ASSET_RESERVATIONS_UPDATE,
      PERMISSIONS.ASSET_RESERVATIONS_DELETE,
      PERMISSIONS.ASSET_RESERVATIONS_CANCEL,
      PERMISSIONS.ASSET_RESERVATIONS_CONFIRM,
    ],
  },

  // ===== CMDB (Layer 3) =====
  generateCRUDDependencies("CI_CLASSES"),
  generateCRUDDependencies("CI_CLASS_FIELDS"),
  generateCRUDDependencies("CONFIGURATION_ITEMS"),
  generateCRUDDependencies("CI_RELATIONSHIPS"),
  generateCRUDDependencies("RELATIONSHIP_TYPES"),
  generateCRUDDependencies("RELATIONSHIP_TYPE_SCOPES"),

  // ===== Contract Management (Layer 3) =====
  generateCRUDDependencies("CONTRACT_TYPES"),
  generateCRUDDependencies("CONTRACTS"),
  generateCRUDDependencies("CONTRACT_LINKED_OBJECTS"),

  // ===== License Management (Layer 3) =====
  generateCRUDDependencies("LICENSE_PRODUCTS"),
  generateCRUDDependencies("LICENSE_PRODUCT_FIELDS"),
  generateCRUDDependencies("LICENSE_ENTITLEMENTS"),
  {
    // License Allocations (has DEALLOCATE/REACTIVATE actions + custom MANAGE)
    [PERMISSIONS.LICENSE_ALLOCATIONS_UPDATE]: [
      PERMISSIONS.LICENSE_ALLOCATIONS_VIEW,
    ],
    [PERMISSIONS.LICENSE_ALLOCATIONS_DELETE]: [
      PERMISSIONS.LICENSE_ALLOCATIONS_VIEW,
    ],
    ...generateActionDependencies(
      "LICENSE_ALLOCATIONS",
      ["DEALLOCATE", "REACTIVATE"],
      true,
    ),
    [PERMISSIONS.LICENSE_ALLOCATIONS_MANAGE]: [
      PERMISSIONS.LICENSE_ALLOCATIONS_VIEW,
      PERMISSIONS.LICENSE_ALLOCATIONS_CREATE,
      PERMISSIONS.LICENSE_ALLOCATIONS_UPDATE,
      PERMISSIONS.LICENSE_ALLOCATIONS_DELETE,
      PERMISSIONS.LICENSE_ALLOCATIONS_DEALLOCATE,
      PERMISSIONS.LICENSE_ALLOCATIONS_REACTIVATE,
    ],
  },

  // ===== Governance & Compliance (Layer 3) =====
  generateCRUDDependencies("DATA_DOMAINS"),
  generateCRUDDependencies("DATA_OWNERSHIPS"),
  generateCRUDDependencies("VERIFICATION_CAMPAIGNS"),
  {
    // Verification Items (has VERIFY action)
    [PERMISSIONS.VERIFICATION_ITEMS_UPDATE]: [
      PERMISSIONS.VERIFICATION_ITEMS_VIEW,
    ],
    ...generateActionDependencies("VERIFICATION_ITEMS", ["VERIFY"], true),
    [PERMISSIONS.VERIFICATION_ITEMS_MANAGE]: [
      PERMISSIONS.VERIFICATION_ITEMS_VIEW,
      PERMISSIONS.VERIFICATION_ITEMS_UPDATE,
      PERMISSIONS.VERIFICATION_ITEMS_VERIFY,
    ],
  },

  // ===== Attachments & Documents (Layer 3) =====
  generateCRUDDependencies("ATTACHMENT_TYPES"),
  generateCRUDDependencies("ATTACHMENTS"),
  {
    // Attachment download (requires VIEW only)
    ...generateSimpleActionDependency("ATTACHMENTS", "DOWNLOAD"),
  },

  // ===== Service Management (Layer 3) =====
  generateCRUDDependencies("SERVICES"),
  generateCRUDDependencies("BUSINESS_PROCESSES"),

  // ===== Exchange Rates =====
  generateCRUDDependencies("FX_RATES"),
  {
    // Currency conversion (requires VIEW only)
    ...generateSimpleActionDependency("FX_RATES", "CONVERT"),
  },
);

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  missing: Array<{
    permission: PermissionKey;
    requiredDependencies: PermissionKey[];
  }>;
}

/**
 * Validates permission selections and returns missing dependencies
 *
 * @param selectedPermissions - Array of selected permission keys
 * @returns Object with validation status and missing dependencies
 */
export function validatePermissionDependencies(
  selectedPermissions: PermissionKey[],
): ValidationResult {
  const selected = new Set(selectedPermissions);
  const missing: Array<{
    permission: PermissionKey;
    requiredDependencies: PermissionKey[];
  }> = [];

  for (const perm of selectedPermissions) {
    const deps = PERMISSION_DEPENDENCIES[perm] ?? [];
    const missingDeps = deps.filter((dep) => !selected.has(dep));

    if (missingDeps.length > 0) {
      missing.push({
        permission: perm,
        requiredDependencies: missingDeps,
      });
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Gets dependencies for a specific permission
 *
 * @param permission - Permission key
 * @returns Array of required dependencies
 */
export function getPermissionDependencies(
  permission: PermissionKey,
): PermissionKey[] {
  return PERMISSION_DEPENDENCIES[permission] ?? [];
}

/**
 * Checks if a permission has dependencies
 *
 * @param permission - Permission key
 * @returns True if permission has dependencies
 */
export function hasPermissionDependencies(permission: PermissionKey): boolean {
  const deps = PERMISSION_DEPENDENCIES[permission];
  return deps !== undefined && deps.length > 0;
}
