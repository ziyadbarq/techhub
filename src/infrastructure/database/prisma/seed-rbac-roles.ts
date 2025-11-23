/**
 * RBAC Role Definitions
 *
 * All system role definitions with their assigned permissions
 * Extracted from seed-rbac.ts for better maintainability
 */

import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
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

/**
 * System roles with their permissions
 * Organized by function: system admin + functional roles
 */
export const SYSTEM_ROLES: Record<string, RoleDefinition> = {
  /**
   * System Administrator - Full system access
   * Has all available permissions in the system
   */
  "system-administrator": {
    name: "system-administrator",
    displayName: "System Administrator",
    description: "Full system access with all permissions",
    permissions: Object.values(PERMISSIONS), // All permissions
  },

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

      // Foundation - Read-only
      PERMISSIONS.ORGANIZATION_UNITS_VIEW,
      PERMISSIONS.PERSONS_VIEW,
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

  /**
   * Finance Manager - Financial oversight
   * Contracts, licenses, procurement, exchange rates
   */
  "finance-manager": {
    name: "finance-manager",
    displayName: "Finance Manager",
    description:
      "Financial oversight - contracts, licenses, procurement, exchange rates",
    permissions: [
      // Contracts - Full access
      PERMISSIONS.CONTRACT_TYPES_VIEW,
      PERMISSIONS.CONTRACT_TYPES_CREATE,
      PERMISSIONS.CONTRACT_TYPES_UPDATE,
      PERMISSIONS.CONTRACT_TYPES_DELETE,
      PERMISSIONS.CONTRACT_TYPES_MANAGE,
      PERMISSIONS.CONTRACTS_VIEW,
      PERMISSIONS.CONTRACTS_CREATE,
      PERMISSIONS.CONTRACTS_UPDATE,
      PERMISSIONS.CONTRACTS_DELETE,
      PERMISSIONS.CONTRACTS_MANAGE,
      PERMISSIONS.CONTRACT_LINKED_OBJECTS_VIEW,
      PERMISSIONS.CONTRACT_LINKED_OBJECTS_CREATE,
      PERMISSIONS.CONTRACT_LINKED_OBJECTS_UPDATE,
      PERMISSIONS.CONTRACT_LINKED_OBJECTS_DELETE,
      PERMISSIONS.CONTRACT_LINKED_OBJECTS_MANAGE,

      // Licenses - Full access
      PERMISSIONS.LICENSE_PRODUCTS_VIEW,
      PERMISSIONS.LICENSE_PRODUCTS_CREATE,
      PERMISSIONS.LICENSE_PRODUCTS_UPDATE,
      PERMISSIONS.LICENSE_PRODUCTS_DELETE,
      PERMISSIONS.LICENSE_PRODUCTS_MANAGE,
      PERMISSIONS.LICENSE_PRODUCT_FIELDS_VIEW,
      PERMISSIONS.LICENSE_PRODUCT_FIELDS_CREATE,
      PERMISSIONS.LICENSE_PRODUCT_FIELDS_UPDATE,
      PERMISSIONS.LICENSE_PRODUCT_FIELDS_DELETE,
      PERMISSIONS.LICENSE_PRODUCT_FIELDS_MANAGE,
      PERMISSIONS.LICENSE_ENTITLEMENTS_VIEW,
      PERMISSIONS.LICENSE_ENTITLEMENTS_CREATE,
      PERMISSIONS.LICENSE_ENTITLEMENTS_UPDATE,
      PERMISSIONS.LICENSE_ENTITLEMENTS_DELETE,
      PERMISSIONS.LICENSE_ENTITLEMENTS_MANAGE,
      PERMISSIONS.LICENSE_ALLOCATIONS_VIEW,
      PERMISSIONS.LICENSE_ALLOCATIONS_CREATE,
      PERMISSIONS.LICENSE_ALLOCATIONS_UPDATE,
      PERMISSIONS.LICENSE_ALLOCATIONS_DELETE,
      PERMISSIONS.LICENSE_ALLOCATIONS_DEALLOCATE,
      PERMISSIONS.LICENSE_ALLOCATIONS_REACTIVATE,
      PERMISSIONS.LICENSE_ALLOCATIONS_MANAGE,

      // Exchange Rates - Full access
      PERMISSIONS.FX_RATES_VIEW,
      PERMISSIONS.FX_RATES_CREATE,
      PERMISSIONS.FX_RATES_UPDATE,
      PERMISSIONS.FX_RATES_DELETE,
      PERMISSIONS.FX_RATES_MANAGE,
      PERMISSIONS.FX_RATES_CONVERT,

      // Vendors - Full access
      PERMISSIONS.VENDORS_VIEW,
      PERMISSIONS.VENDORS_CREATE,
      PERMISSIONS.VENDORS_UPDATE,
      PERMISSIONS.VENDORS_DELETE,
      PERMISSIONS.VENDORS_MANAGE,
      PERMISSIONS.VENDOR_CONTACTS_VIEW,
      PERMISSIONS.VENDOR_CONTACTS_CREATE,
      PERMISSIONS.VENDOR_CONTACTS_UPDATE,
      PERMISSIONS.VENDOR_CONTACTS_DELETE,

      // Asset Disposals - Financial approval
      PERMISSIONS.ASSET_DISPOSALS_VIEW,
      PERMISSIONS.ASSET_DISPOSALS_APPROVE,
      PERMISSIONS.ASSET_DISPOSALS_REJECT,

      // Assets - Read-only (for contract linking, cost tracking)
      PERMISSIONS.ASSETS_VIEW,
      PERMISSIONS.ASSET_CATEGORIES_VIEW,
      PERMISSIONS.ASSET_MODELS_VIEW,
      PERMISSIONS.WARRANTIES_VIEW,

      // Configuration Items - Read-only (for license allocation)
      PERMISSIONS.CONFIGURATION_ITEMS_VIEW,

      // Persons - Read-only (for license allocation)
      PERMISSIONS.PERSONS_VIEW,

      // Attachments - View + Create (invoices, POs)
      PERMISSIONS.ATTACHMENTS_VIEW,
      PERMISSIONS.ATTACHMENTS_CREATE,

      // Dashboard
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.DASHBOARD_ANALYTICS,

      // Settings
      PERMISSIONS.SETTINGS_VIEW,
    ],
  },

  /**
   * Security Officer - Information security and governance
   * Data governance, security compliance, InfoSec
   */
  "security-officer": {
    name: "security-officer",
    displayName: "Security Officer",
    description:
      "Information security - governance, data domains, security compliance",
    permissions: [
      // Governance - Full access
      PERMISSIONS.DATA_DOMAINS_VIEW,
      PERMISSIONS.DATA_DOMAINS_CREATE,
      PERMISSIONS.DATA_DOMAINS_UPDATE,
      PERMISSIONS.DATA_DOMAINS_DELETE,
      PERMISSIONS.DATA_DOMAINS_MANAGE,
      PERMISSIONS.DATA_OWNERSHIPS_VIEW,
      PERMISSIONS.DATA_OWNERSHIPS_CREATE,
      PERMISSIONS.DATA_OWNERSHIPS_UPDATE,
      PERMISSIONS.DATA_OWNERSHIPS_DELETE,
      PERMISSIONS.DATA_OWNERSHIPS_MANAGE,
      PERMISSIONS.VERIFICATION_CAMPAIGNS_VIEW,
      PERMISSIONS.VERIFICATION_CAMPAIGNS_CREATE,
      PERMISSIONS.VERIFICATION_CAMPAIGNS_UPDATE,
      PERMISSIONS.VERIFICATION_CAMPAIGNS_DELETE,
      PERMISSIONS.VERIFICATION_CAMPAIGNS_START,
      PERMISSIONS.VERIFICATION_CAMPAIGNS_COMPLETE,
      PERMISSIONS.VERIFICATION_CAMPAIGNS_MANAGE,
      PERMISSIONS.VERIFICATION_ITEMS_VIEW,
      PERMISSIONS.VERIFICATION_ITEMS_UPDATE,
      PERMISSIONS.VERIFICATION_ITEMS_VERIFY,
      PERMISSIONS.VERIFICATION_ITEMS_FLAG_EXCEPTION,
      PERMISSIONS.VERIFICATION_ITEMS_MANAGE,

      // Configuration Items - Create + Update (security assets)
      PERMISSIONS.CI_CLASSES_VIEW,
      PERMISSIONS.CONFIGURATION_ITEMS_VIEW,
      PERMISSIONS.CONFIGURATION_ITEMS_CREATE,
      PERMISSIONS.CONFIGURATION_ITEMS_UPDATE,
      PERMISSIONS.CI_RELATIONSHIPS_VIEW,
      PERMISSIONS.CI_RELATIONSHIPS_CREATE,
      PERMISSIONS.CI_RELATIONSHIPS_UPDATE,
      PERMISSIONS.RELATIONSHIP_TYPES_VIEW,

      // Services - Read-only (identify critical services)
      PERMISSIONS.SERVICES_VIEW,
      PERMISSIONS.BUSINESS_PROCESSES_VIEW,

      // Assets - Read-only (security inventory)
      PERMISSIONS.ASSETS_VIEW,
      PERMISSIONS.ASSET_CATEGORIES_VIEW,
      PERMISSIONS.ASSET_MODELS_VIEW,

      // Licenses - Read-only (software compliance)
      PERMISSIONS.LICENSE_PRODUCTS_VIEW,
      PERMISSIONS.LICENSE_ENTITLEMENTS_VIEW,
      PERMISSIONS.LICENSE_ALLOCATIONS_VIEW,

      // Attachments - Full access (security documentation)
      PERMISSIONS.ATTACHMENT_TYPES_VIEW,
      PERMISSIONS.ATTACHMENT_TYPES_CREATE,
      PERMISSIONS.ATTACHMENT_TYPES_UPDATE,
      PERMISSIONS.ATTACHMENT_TYPES_DELETE,
      PERMISSIONS.ATTACHMENT_TYPES_MANAGE,
      PERMISSIONS.ATTACHMENTS_VIEW,
      PERMISSIONS.ATTACHMENTS_CREATE,
      PERMISSIONS.ATTACHMENTS_UPDATE,
      PERMISSIONS.ATTACHMENTS_DELETE,
      PERMISSIONS.ATTACHMENTS_MANAGE,

      // Audit Logs - Read + Export
      PERMISSIONS.AUDIT_LOGS_VIEW,
      PERMISSIONS.AUDIT_LOGS_EXPORT,

      // Users & Roles - Read-only (security review)
      PERMISSIONS.USERS_VIEW,
      PERMISSIONS.ROLES_VIEW,
      PERMISSIONS.PERMISSIONS_VIEW,

      // Organization Units & Persons
      PERMISSIONS.ORGANIZATION_UNITS_VIEW,
      PERMISSIONS.PERSONS_VIEW,

      // Dashboard
      PERMISSIONS.DASHBOARD_VIEW,

      // Settings
      PERMISSIONS.SETTINGS_VIEW,
    ],
  },

  /**
   * Service Owner - IT service catalog management
   * Service management, CMDB, business alignment
   */
  "service-owner": {
    name: "service-owner",
    displayName: "Service Owner",
    description:
      "IT service management - service catalog, CMDB, business alignment",
    permissions: [
      // Services - Full access
      PERMISSIONS.SERVICES_VIEW,
      PERMISSIONS.SERVICES_CREATE,
      PERMISSIONS.SERVICES_UPDATE,
      PERMISSIONS.SERVICES_DELETE,
      PERMISSIONS.SERVICES_RETIRE,
      PERMISSIONS.SERVICES_MANAGE,

      // Business Processes - Full access
      PERMISSIONS.BUSINESS_PROCESSES_VIEW,
      PERMISSIONS.BUSINESS_PROCESSES_CREATE,
      PERMISSIONS.BUSINESS_PROCESSES_UPDATE,
      PERMISSIONS.BUSINESS_PROCESSES_DELETE,
      PERMISSIONS.BUSINESS_PROCESSES_MANAGE,

      // Configuration Items - Full access
      PERMISSIONS.CI_CLASSES_VIEW,
      PERMISSIONS.CI_CLASS_FIELDS_VIEW,
      PERMISSIONS.CONFIGURATION_ITEMS_VIEW,
      PERMISSIONS.CONFIGURATION_ITEMS_CREATE,
      PERMISSIONS.CONFIGURATION_ITEMS_UPDATE,
      PERMISSIONS.CONFIGURATION_ITEMS_DELETE,
      PERMISSIONS.CONFIGURATION_ITEMS_MANAGE,

      // CI Relationships - Full access
      PERMISSIONS.CI_RELATIONSHIPS_VIEW,
      PERMISSIONS.CI_RELATIONSHIPS_CREATE,
      PERMISSIONS.CI_RELATIONSHIPS_UPDATE,
      PERMISSIONS.CI_RELATIONSHIPS_DELETE,
      PERMISSIONS.CI_RELATIONSHIPS_MANAGE,
      PERMISSIONS.RELATIONSHIP_TYPES_VIEW,
      PERMISSIONS.RELATIONSHIP_TYPES_CREATE,
      PERMISSIONS.RELATIONSHIP_TYPES_UPDATE,
      PERMISSIONS.RELATIONSHIP_TYPE_SCOPES_VIEW,

      // Assets - Read-only (infrastructure supporting services)
      PERMISSIONS.ASSETS_VIEW,
      PERMISSIONS.ASSET_CATEGORIES_VIEW,
      PERMISSIONS.ASSET_MODELS_VIEW,

      // Contracts - Read-only (service contracts)
      PERMISSIONS.CONTRACTS_VIEW,
      PERMISSIONS.CONTRACT_TYPES_VIEW,

      // Licenses - Read-only (software licenses for services)
      PERMISSIONS.LICENSE_PRODUCTS_VIEW,
      PERMISSIONS.LICENSE_ENTITLEMENTS_VIEW,
      PERMISSIONS.LICENSE_ALLOCATIONS_VIEW,

      // Attachments - Full access (service documentation)
      PERMISSIONS.ATTACHMENTS_VIEW,
      PERMISSIONS.ATTACHMENTS_CREATE,
      PERMISSIONS.ATTACHMENTS_UPDATE,
      PERMISSIONS.ATTACHMENTS_DELETE,

      // Data Ownerships - Read-only (understand data ownership)
      PERMISSIONS.DATA_OWNERSHIPS_VIEW,

      // Organization Units & Persons
      PERMISSIONS.ORGANIZATION_UNITS_VIEW,
      PERMISSIONS.PERSONS_VIEW,
      PERMISSIONS.LOCATIONS_VIEW,

      // Dashboard
      PERMISSIONS.DASHBOARD_VIEW,

      // Settings
      PERMISSIONS.SETTINGS_VIEW,
    ],
  },

  /**
   * Inventory Manager - Stock and warehouse management
   * Stock control, receiving, shipping
   */
  "inventory-manager": {
    name: "inventory-manager",
    displayName: "Inventory Manager",
    description:
      "Stock and warehouse management - inventory tracking, receiving, shipping",
    permissions: [
      // Stock Locations - Full access
      PERMISSIONS.STOCK_LOCATIONS_VIEW,
      PERMISSIONS.STOCK_LOCATIONS_CREATE,
      PERMISSIONS.STOCK_LOCATIONS_UPDATE,
      PERMISSIONS.STOCK_LOCATIONS_DELETE,
      PERMISSIONS.STOCK_LOCATIONS_MANAGE,

      // Stock Movements - Full access
      PERMISSIONS.STOCK_MOVEMENTS_VIEW,
      PERMISSIONS.STOCK_MOVEMENTS_CREATE,
      PERMISSIONS.STOCK_MOVEMENTS_DELETE,
      PERMISSIONS.STOCK_MOVEMENTS_MANAGE,

      // Assets - Create + Update (receiving stock, status changes)
      PERMISSIONS.ASSETS_VIEW,
      PERMISSIONS.ASSETS_CREATE,
      PERMISSIONS.ASSETS_UPDATE,
      PERMISSIONS.ASSET_CATEGORIES_VIEW,
      PERMISSIONS.ASSET_MODELS_VIEW,

      // Vendors - Read-only (receiving shipments)
      PERMISSIONS.VENDORS_VIEW,
      PERMISSIONS.VENDOR_CONTACTS_VIEW,

      // Locations
      PERMISSIONS.LOCATIONS_VIEW,

      // Warranties - Create (register warranties on receipt)
      PERMISSIONS.WARRANTIES_VIEW,
      PERMISSIONS.WARRANTIES_CREATE,

      // Attachments - Create (packing slips, receipts)
      PERMISSIONS.ATTACHMENTS_VIEW,
      PERMISSIONS.ATTACHMENTS_CREATE,

      // Asset Disposals - Read-only (coordinate logistics)
      PERMISSIONS.ASSET_DISPOSALS_VIEW,

      // Lifecycle - Read-only
      PERMISSIONS.LIFECYCLE_MODELS_VIEW,
      PERMISSIONS.LIFECYCLE_STATES_VIEW,

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
   * Data Steward - Data quality and classification
   * Data governance specialist (SAMA compliance)
   */
  "data-steward": {
    name: "data-steward",
    displayName: "Data Steward",
    description:
      "Data quality specialist - data classification, ownership tracking (SAMA)",
    permissions: [
      // Data Domains - Full access
      PERMISSIONS.DATA_DOMAINS_VIEW,
      PERMISSIONS.DATA_DOMAINS_CREATE,
      PERMISSIONS.DATA_DOMAINS_UPDATE,
      PERMISSIONS.DATA_DOMAINS_DELETE,
      PERMISSIONS.DATA_DOMAINS_MANAGE,

      // Data Ownerships - Full access
      PERMISSIONS.DATA_OWNERSHIPS_VIEW,
      PERMISSIONS.DATA_OWNERSHIPS_CREATE,
      PERMISSIONS.DATA_OWNERSHIPS_UPDATE,
      PERMISSIONS.DATA_OWNERSHIPS_DELETE,
      PERMISSIONS.DATA_OWNERSHIPS_MANAGE,

      // Verification Campaigns - Create + Update
      PERMISSIONS.VERIFICATION_CAMPAIGNS_VIEW,
      PERMISSIONS.VERIFICATION_CAMPAIGNS_CREATE,
      PERMISSIONS.VERIFICATION_CAMPAIGNS_UPDATE,

      // Verification Items - Update + Verify
      PERMISSIONS.VERIFICATION_ITEMS_VIEW,
      PERMISSIONS.VERIFICATION_ITEMS_UPDATE,
      PERMISSIONS.VERIFICATION_ITEMS_VERIFY,

      // Organization Units & Persons - Read-only
      PERMISSIONS.ORGANIZATION_UNITS_VIEW,
      PERMISSIONS.PERSONS_VIEW,

      // CI Classes - Read-only (data classification mapping)
      PERMISSIONS.CI_CLASSES_VIEW,

      // Asset Categories - Read-only (data classification mapping)
      PERMISSIONS.ASSET_CATEGORIES_VIEW,

      // Attachments - View + Create (governance docs)
      PERMISSIONS.ATTACHMENTS_VIEW,
      PERMISSIONS.ATTACHMENTS_CREATE,

      // Audit Logs - Read-only
      PERMISSIONS.AUDIT_LOGS_VIEW,

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
};
