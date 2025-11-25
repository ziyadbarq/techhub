/**
 * Admin & System Roles
 *
 * System administration, auditing, and basic access roles:
 * - system-administrator: Full system access
 * - viewer: Minimal read-only access (dashboard + docs)
 * - auditor: SAMA compliance and internal audit
 */

import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { SYSTEM_PERMISSIONS } from "../seed-rbac-permissions";
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
   * Viewer - Minimal read-only access
   * Dashboard and documentation only - no entity access
   */
  viewer: {
    name: "viewer",
    displayName: "Viewer",
    description: "Minimal access - dashboard and documentation only",
    permissions: [
      // Dashboard only
      PERMISSIONS.DASHBOARD_VIEW,

      // Settings (view only - for accessing docs)
      PERMISSIONS.SETTINGS_VIEW,
    ],
  },

  /**
   * Auditor - SAMA compliance and internal audit
   * Comprehensive read access + verification workflows
   */
  auditor: {
    name: "auditor",
    displayName: "Auditor",
    description:
      "SAMA compliance officer - audit, verification, regulatory reporting",
    permissions: [
      // Users - Read-only
      PERMISSIONS.USERS_VIEW,

      // Audit Logs - Full access
      PERMISSIONS.AUDIT_LOGS_VIEW,
      PERMISSIONS.AUDIT_LOGS_EXPORT,

      // Governance - Verification workflows
      PERMISSIONS.DATA_DOMAINS_VIEW,
      PERMISSIONS.DATA_OWNERSHIPS_VIEW,
      PERMISSIONS.VERIFICATION_CAMPAIGNS_VIEW,
      PERMISSIONS.VERIFICATION_CAMPAIGNS_CREATE,
      PERMISSIONS.VERIFICATION_CAMPAIGNS_UPDATE,
      PERMISSIONS.VERIFICATION_CAMPAIGNS_START,
      PERMISSIONS.VERIFICATION_CAMPAIGNS_COMPLETE,
      PERMISSIONS.VERIFICATION_ITEMS_VIEW,
      PERMISSIONS.VERIFICATION_ITEMS_UPDATE,
      PERMISSIONS.VERIFICATION_ITEMS_VERIFY,
      PERMISSIONS.VERIFICATION_ITEMS_FLAG_EXCEPTION,

      // Foundation - Read-only + User Sync
      PERMISSIONS.ORGANIZATION_UNITS_VIEW,
      PERMISSIONS.PERSONS_VIEW,
      PERMISSIONS.PERSONS_SYNC, // Trigger Microsoft Graph user sync for compliance
      PERMISSIONS.PERSON_ROLE_ASSIGNMENTS_VIEW,
      PERMISSIONS.LOCATIONS_VIEW,
      PERMISSIONS.VENDORS_VIEW,
      PERMISSIONS.VENDOR_CONTACTS_VIEW,
      PERMISSIONS.LIFECYCLE_MODELS_VIEW,
      PERMISSIONS.LIFECYCLE_STATES_VIEW,
      PERMISSIONS.LIFECYCLE_TRANSITIONS_VIEW,
      PERMISSIONS.FIELD_DEFINITIONS_VIEW,
      PERMISSIONS.FX_RATES_VIEW,
      PERMISSIONS.FX_RATES_CONVERT,

      // Assets - Read-only
      PERMISSIONS.ASSET_CATEGORIES_VIEW,
      PERMISSIONS.ASSET_CATEGORY_FIELDS_VIEW,
      PERMISSIONS.ASSET_MODELS_VIEW,
      PERMISSIONS.ASSETS_VIEW,
      PERMISSIONS.ASSET_ASSIGNMENTS_VIEW,
      PERMISSIONS.WARRANTIES_VIEW,

      // Maintenance - Read-only
      PERMISSIONS.MAINTENANCE_SCHEDULES_VIEW,
      PERMISSIONS.MAINTENANCE_RECORDS_VIEW,

      // Inventory - Read-only
      PERMISSIONS.STOCK_LOCATIONS_VIEW,
      PERMISSIONS.STOCK_MOVEMENTS_VIEW,

      // Asset Operations - Read-only
      PERMISSIONS.ASSET_DISPOSALS_VIEW,
      PERMISSIONS.ASSET_KITS_VIEW,
      PERMISSIONS.ASSET_RESERVATIONS_VIEW,

      // CMDB - Read-only
      PERMISSIONS.CI_CLASSES_VIEW,
      PERMISSIONS.CI_CLASS_FIELDS_VIEW,
      PERMISSIONS.CONFIGURATION_ITEMS_VIEW,
      PERMISSIONS.CI_RELATIONSHIPS_VIEW,
      PERMISSIONS.RELATIONSHIP_TYPES_VIEW,
      PERMISSIONS.RELATIONSHIP_TYPE_SCOPES_VIEW,

      // Contracts - Read-only
      PERMISSIONS.CONTRACT_TYPES_VIEW,
      PERMISSIONS.CONTRACTS_VIEW,
      PERMISSIONS.CONTRACT_LINKED_OBJECTS_VIEW,

      // Licenses - Read-only
      PERMISSIONS.LICENSE_PRODUCTS_VIEW,
      PERMISSIONS.LICENSE_PRODUCT_FIELDS_VIEW,
      PERMISSIONS.LICENSE_ENTITLEMENTS_VIEW,
      PERMISSIONS.LICENSE_ALLOCATIONS_VIEW,

      // Services - Read-only
      PERMISSIONS.SERVICES_VIEW,
      PERMISSIONS.BUSINESS_PROCESSES_VIEW,

      // Attachments - Read-only
      PERMISSIONS.ATTACHMENT_TYPES_VIEW,
      PERMISSIONS.ATTACHMENTS_VIEW,

      // Dashboard & Analytics
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.DASHBOARD_ANALYTICS,

      // Roles & Permissions (read-only for compliance review)
      PERMISSIONS.ROLES_VIEW,
      PERMISSIONS.PERMISSIONS_VIEW,

      // Settings
      PERMISSIONS.SETTINGS_VIEW,
    ],
  },
} as const;
