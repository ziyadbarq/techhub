/**
 * Technical & Operations Roles
 *
 * Hands-on IT support and asset management roles:
 * - it-help-desk: Front-line IT support, user assistance
 * - maintenance-technician: Repairs, preventive maintenance
 * - asset-coordinator: Asset lifecycle specialist
 */

import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { RoleDefinition } from "./types";

export const TECHNICAL_ROLES: Record<string, RoleDefinition> = {
  /**
   * IT Help Desk - Front-line IT support
   * User support, asset checkouts, reservations
   */
  "it-help-desk": {
    name: "it-help-desk",
    displayName: "IT Help Desk",
    description:
      "Front-line IT support - user assistance, checkouts, reservations",
    permissions: [
      // Foundation - Read-only
      PERMISSIONS.ORGANIZATION_UNITS_VIEW,
      PERMISSIONS.PERSONS_VIEW,
      PERMISSIONS.LOCATIONS_VIEW,
      PERMISSIONS.VENDORS_VIEW,
      PERMISSIONS.LIFECYCLE_MODELS_VIEW,
      PERMISSIONS.LIFECYCLE_STATES_VIEW,
      PERMISSIONS.FX_RATES_VIEW,
      PERMISSIONS.FX_RATES_CONVERT,

      // Assets - View + limited updates
      PERMISSIONS.ASSET_CATEGORIES_VIEW,
      PERMISSIONS.ASSET_MODELS_VIEW,
      PERMISSIONS.ASSETS_VIEW,
      PERMISSIONS.ASSETS_UPDATE, // Status changes, assignment updates

      // Asset Assignments - Full operational access
      PERMISSIONS.ASSET_ASSIGNMENTS_VIEW,
      PERMISSIONS.ASSET_ASSIGNMENTS_CREATE,
      PERMISSIONS.ASSET_ASSIGNMENTS_UPDATE,

      // Asset Reservations - Full access
      PERMISSIONS.ASSET_RESERVATIONS_VIEW,
      PERMISSIONS.ASSET_RESERVATIONS_CREATE,
      PERMISSIONS.ASSET_RESERVATIONS_UPDATE,
      PERMISSIONS.ASSET_RESERVATIONS_DELETE,
      PERMISSIONS.ASSET_RESERVATIONS_CANCEL,

      // Asset Kits - Checkout operations
      PERMISSIONS.ASSET_KITS_VIEW,
      PERMISSIONS.ASSET_KITS_CHECKOUT,
      PERMISSIONS.ASSET_KITS_RETURN,

      // Maintenance - Log user-reported issues
      PERMISSIONS.MAINTENANCE_RECORDS_VIEW,
      PERMISSIONS.MAINTENANCE_RECORDS_CREATE,

      // Stock - Read-only
      PERMISSIONS.STOCK_LOCATIONS_VIEW,
      PERMISSIONS.STOCK_MOVEMENTS_VIEW,

      // Attachments - View + Create (upload tickets/docs)
      PERMISSIONS.ATTACHMENTS_VIEW,
      PERMISSIONS.ATTACHMENTS_CREATE,

      // Services - Read-only (reference)
      PERMISSIONS.SERVICES_VIEW,
      PERMISSIONS.BUSINESS_PROCESSES_VIEW,

      // Configuration Items - Read-only (lookup user equipment)
      PERMISSIONS.CONFIGURATION_ITEMS_VIEW,
      PERMISSIONS.CI_RELATIONSHIPS_VIEW,

      // Dashboard
      PERMISSIONS.DASHBOARD_VIEW,

      // Settings
      PERMISSIONS.SETTINGS_VIEW,
    ],
  },

  /**
   * Maintenance Technician - Hands-on technical support
   * Repairs, preventive maintenance, servicing
   */
  "maintenance-technician": {
    name: "maintenance-technician",
    displayName: "Maintenance Technician",
    description:
      "Hands-on technical support - repairs, preventive maintenance, servicing",
    permissions: [
      // Maintenance Records - Full access + PERFORM
      PERMISSIONS.MAINTENANCE_RECORDS_VIEW,
      PERMISSIONS.MAINTENANCE_RECORDS_CREATE,
      PERMISSIONS.MAINTENANCE_RECORDS_UPDATE,
      PERMISSIONS.MAINTENANCE_RECORDS_DELETE,
      PERMISSIONS.MAINTENANCE_RECORDS_PERFORM,

      // Maintenance Schedules - Read + Update (mark completed)
      PERMISSIONS.MAINTENANCE_SCHEDULES_VIEW,
      PERMISSIONS.MAINTENANCE_SCHEDULES_UPDATE,

      // Assets - Read + Update (status changes during maintenance)
      PERMISSIONS.ASSETS_VIEW,
      PERMISSIONS.ASSETS_UPDATE,
      PERMISSIONS.ASSET_CATEGORIES_VIEW,
      PERMISSIONS.ASSET_MODELS_VIEW,

      // Warranties - Read-only (check warranty status)
      PERMISSIONS.WARRANTIES_VIEW,

      // Vendors - Read-only (contact for repairs)
      PERMISSIONS.VENDORS_VIEW,
      PERMISSIONS.VENDOR_CONTACTS_VIEW,

      // Attachments - View + Create (repair docs, photos)
      PERMISSIONS.ATTACHMENTS_VIEW,
      PERMISSIONS.ATTACHMENTS_CREATE,

      // Stock Movements - Read-only (parts usage)
      PERMISSIONS.STOCK_MOVEMENTS_VIEW,
      PERMISSIONS.STOCK_LOCATIONS_VIEW,

      // Locations
      PERMISSIONS.LOCATIONS_VIEW,

      // Persons - Read-only (asset assignees)
      PERMISSIONS.PERSONS_VIEW,

      // Configuration Items - Read-only (CI maintenance)
      PERMISSIONS.CONFIGURATION_ITEMS_VIEW,

      // Dashboard
      PERMISSIONS.DASHBOARD_VIEW,

      // Settings
      PERMISSIONS.SETTINGS_VIEW,
    ],
  },

  /**
   * Asset Coordinator - Asset lifecycle specialist
   * Asset management, depreciation, lifecycle tracking
   */
  "asset-coordinator": {
    name: "asset-coordinator",
    displayName: "Asset Coordinator",
    description:
      "Asset lifecycle specialist - asset management, depreciation, lifecycle tracking",
    permissions: [
      // Assets - Full access
      PERMISSIONS.ASSETS_VIEW,
      PERMISSIONS.ASSETS_CREATE,
      PERMISSIONS.ASSETS_UPDATE,
      PERMISSIONS.ASSETS_DELETE,
      PERMISSIONS.ASSETS_CHECKOUT,
      PERMISSIONS.ASSETS_MANAGE,

      // Asset Categories - Full access
      PERMISSIONS.ASSET_CATEGORIES_VIEW,
      PERMISSIONS.ASSET_CATEGORIES_CREATE,
      PERMISSIONS.ASSET_CATEGORIES_UPDATE,
      PERMISSIONS.ASSET_CATEGORIES_DELETE,
      PERMISSIONS.ASSET_CATEGORIES_MANAGE,
      PERMISSIONS.ASSET_CATEGORY_FIELDS_VIEW,
      PERMISSIONS.ASSET_CATEGORY_FIELDS_CREATE,
      PERMISSIONS.ASSET_CATEGORY_FIELDS_UPDATE,
      PERMISSIONS.ASSET_CATEGORY_FIELDS_DELETE,
      PERMISSIONS.ASSET_CATEGORY_FIELDS_MANAGE,

      // Asset Models - Full access
      PERMISSIONS.ASSET_MODELS_VIEW,
      PERMISSIONS.ASSET_MODELS_CREATE,
      PERMISSIONS.ASSET_MODELS_UPDATE,
      PERMISSIONS.ASSET_MODELS_DELETE,
      PERMISSIONS.ASSET_MODELS_MANAGE,

      // Asset Assignments - Full access
      PERMISSIONS.ASSET_ASSIGNMENTS_VIEW,
      PERMISSIONS.ASSET_ASSIGNMENTS_CREATE,
      PERMISSIONS.ASSET_ASSIGNMENTS_UPDATE,
      PERMISSIONS.ASSET_ASSIGNMENTS_DELETE,
      PERMISSIONS.ASSET_ASSIGNMENTS_MANAGE,

      // Warranties - Full access
      PERMISSIONS.WARRANTIES_VIEW,
      PERMISSIONS.WARRANTIES_CREATE,
      PERMISSIONS.WARRANTIES_UPDATE,
      PERMISSIONS.WARRANTIES_DELETE,
      PERMISSIONS.WARRANTIES_MANAGE,

      // Lifecycle - Full access
      PERMISSIONS.LIFECYCLE_MODELS_VIEW,
      PERMISSIONS.LIFECYCLE_MODELS_CREATE,
      PERMISSIONS.LIFECYCLE_MODELS_UPDATE,
      PERMISSIONS.LIFECYCLE_MODELS_DELETE,
      PERMISSIONS.LIFECYCLE_MODELS_MANAGE,
      PERMISSIONS.LIFECYCLE_STATES_VIEW,
      PERMISSIONS.LIFECYCLE_STATES_CREATE,
      PERMISSIONS.LIFECYCLE_STATES_UPDATE,
      PERMISSIONS.LIFECYCLE_STATES_DELETE,
      PERMISSIONS.LIFECYCLE_TRANSITIONS_VIEW,
      PERMISSIONS.LIFECYCLE_TRANSITIONS_CREATE,
      PERMISSIONS.LIFECYCLE_TRANSITIONS_UPDATE,
      PERMISSIONS.LIFECYCLE_TRANSITIONS_DELETE,

      // Asset Disposals - Create + Update (initiate, not approve)
      PERMISSIONS.ASSET_DISPOSALS_VIEW,
      PERMISSIONS.ASSET_DISPOSALS_CREATE,
      PERMISSIONS.ASSET_DISPOSALS_UPDATE,

      // Asset Kits - Full access
      PERMISSIONS.ASSET_KITS_VIEW,
      PERMISSIONS.ASSET_KITS_CREATE,
      PERMISSIONS.ASSET_KITS_UPDATE,
      PERMISSIONS.ASSET_KITS_DELETE,
      PERMISSIONS.ASSET_KITS_CHECKOUT,
      PERMISSIONS.ASSET_KITS_RETURN,
      PERMISSIONS.ASSET_KITS_MANAGE,

      // Asset Reservations - Approve reservations
      PERMISSIONS.ASSET_RESERVATIONS_VIEW,
      PERMISSIONS.ASSET_RESERVATIONS_CONFIRM,

      // Vendors - Create + Update
      PERMISSIONS.VENDORS_VIEW,
      PERMISSIONS.VENDORS_CREATE,
      PERMISSIONS.VENDORS_UPDATE,
      PERMISSIONS.VENDOR_CONTACTS_VIEW,
      PERMISSIONS.VENDOR_CONTACTS_CREATE,
      PERMISSIONS.VENDOR_CONTACTS_UPDATE,

      // Locations
      PERMISSIONS.LOCATIONS_VIEW,

      // Stock Movements - Read-only
      PERMISSIONS.STOCK_MOVEMENTS_VIEW,
      PERMISSIONS.STOCK_LOCATIONS_VIEW,

      // Attachments - Full access
      PERMISSIONS.ATTACHMENTS_VIEW,
      PERMISSIONS.ATTACHMENTS_CREATE,
      PERMISSIONS.ATTACHMENTS_UPDATE,
      PERMISSIONS.ATTACHMENTS_DELETE,

      // Configuration Items - Read-only (asset-CI linking)
      PERMISSIONS.CONFIGURATION_ITEMS_VIEW,

      // Dashboard & Analytics
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.DASHBOARD_ANALYTICS,

      // Settings
      PERMISSIONS.SETTINGS_VIEW,
    ],
  },
} as const;
