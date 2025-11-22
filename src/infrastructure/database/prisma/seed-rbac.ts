/**
 * RBAC Seed Data
 * Seeds roles, permissions, and role-permission assignments
 *
 * Can accept a Prisma client instance or use the singleton for standalone execution
 */

import type { PrismaClient } from "../../../generated/prisma/client.js";
import { prisma as prismaSingleton } from "./client.js";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { logSection, logStep, logSuccess, logWarning } from "./seed-utils.js";

/**
 * System roles with their permissions
 */
const SYSTEM_ROLES = {
  admin: {
    name: "admin",
    displayName: "Administrator",
    description: "Full system access with all permissions",
    permissions: Object.values(PERMISSIONS), // All permissions
  },
  manager: {
    name: "manager",
    displayName: "Manager",
    description:
      "ITAM operations manager - full asset management, approval workflows, team oversight",
    permissions: [
      // Users (read-only)
      PERMISSIONS.USERS_VIEW,

      // Foundation - Full access
      PERMISSIONS.ORGANIZATION_UNITS_VIEW,
      PERMISSIONS.ORGANIZATION_UNITS_CREATE,
      PERMISSIONS.ORGANIZATION_UNITS_UPDATE,
      PERMISSIONS.PERSONS_VIEW,
      PERMISSIONS.PERSONS_CREATE,
      PERMISSIONS.PERSONS_UPDATE,
      PERMISSIONS.PERSON_ROLE_ASSIGNMENTS_VIEW,
      PERMISSIONS.PERSON_ROLE_ASSIGNMENTS_CREATE,
      PERMISSIONS.PERSON_ROLE_ASSIGNMENTS_UPDATE,
      PERMISSIONS.LOCATIONS_VIEW,
      PERMISSIONS.LOCATIONS_CREATE,
      PERMISSIONS.LOCATIONS_UPDATE,
      PERMISSIONS.VENDORS_VIEW,
      PERMISSIONS.VENDORS_CREATE,
      PERMISSIONS.VENDORS_UPDATE,
      PERMISSIONS.VENDOR_CONTACTS_VIEW,
      PERMISSIONS.VENDOR_CONTACTS_CREATE,
      PERMISSIONS.VENDOR_CONTACTS_UPDATE,
      PERMISSIONS.LIFECYCLE_MODELS_VIEW,
      PERMISSIONS.LIFECYCLE_STATES_VIEW,
      PERMISSIONS.LIFECYCLE_TRANSITIONS_VIEW,
      PERMISSIONS.FIELD_DEFINITIONS_VIEW,
      PERMISSIONS.FIELD_DEFINITIONS_CREATE,
      PERMISSIONS.FIELD_DEFINITIONS_UPDATE,

      // Assets - Full access
      PERMISSIONS.ASSET_CATEGORIES_VIEW,
      PERMISSIONS.ASSET_CATEGORIES_CREATE,
      PERMISSIONS.ASSET_CATEGORIES_UPDATE,
      PERMISSIONS.ASSET_MODELS_VIEW,
      PERMISSIONS.ASSET_MODELS_CREATE,
      PERMISSIONS.ASSET_MODELS_UPDATE,
      PERMISSIONS.ASSETS_VIEW,
      PERMISSIONS.ASSETS_CREATE,
      PERMISSIONS.ASSETS_UPDATE,
      PERMISSIONS.ASSETS_DELETE,
      PERMISSIONS.ASSETS_CHECKOUT,
      PERMISSIONS.ASSET_ASSIGNMENTS_VIEW,
      PERMISSIONS.ASSET_ASSIGNMENTS_CREATE,
      PERMISSIONS.ASSET_ASSIGNMENTS_UPDATE,
      PERMISSIONS.ASSET_ASSIGNMENTS_DELETE,

      // Warranties - Full access
      PERMISSIONS.WARRANTIES_VIEW,
      PERMISSIONS.WARRANTIES_CREATE,
      PERMISSIONS.WARRANTIES_UPDATE,
      PERMISSIONS.WARRANTIES_DELETE,

      // Maintenance - Full access
      PERMISSIONS.MAINTENANCE_SCHEDULES_VIEW,
      PERMISSIONS.MAINTENANCE_SCHEDULES_CREATE,
      PERMISSIONS.MAINTENANCE_SCHEDULES_UPDATE,
      PERMISSIONS.MAINTENANCE_SCHEDULES_DELETE,
      PERMISSIONS.MAINTENANCE_RECORDS_VIEW,
      PERMISSIONS.MAINTENANCE_RECORDS_CREATE,
      PERMISSIONS.MAINTENANCE_RECORDS_UPDATE,
      PERMISSIONS.MAINTENANCE_RECORDS_DELETE,
      PERMISSIONS.MAINTENANCE_RECORDS_PERFORM,

      // Inventory - Full access
      PERMISSIONS.STOCK_LOCATIONS_VIEW,
      PERMISSIONS.STOCK_LOCATIONS_CREATE,
      PERMISSIONS.STOCK_LOCATIONS_UPDATE,
      PERMISSIONS.STOCK_MOVEMENTS_VIEW,
      PERMISSIONS.STOCK_MOVEMENTS_CREATE,
      PERMISSIONS.STOCK_MOVEMENTS_DELETE,

      // Asset Disposals - Approval workflow
      PERMISSIONS.ASSET_DISPOSALS_VIEW,
      PERMISSIONS.ASSET_DISPOSALS_CREATE,
      PERMISSIONS.ASSET_DISPOSALS_UPDATE,
      PERMISSIONS.ASSET_DISPOSALS_DELETE,
      PERMISSIONS.ASSET_DISPOSALS_APPROVE,
      PERMISSIONS.ASSET_DISPOSALS_REJECT,
      PERMISSIONS.ASSET_DISPOSALS_START,
      PERMISSIONS.ASSET_DISPOSALS_COMPLETE,
      PERMISSIONS.ASSET_DISPOSALS_CANCEL,
      PERMISSIONS.ASSET_DISPOSALS_MANAGE,

      // Asset Kits - Full access
      PERMISSIONS.ASSET_KITS_VIEW,
      PERMISSIONS.ASSET_KITS_CREATE,
      PERMISSIONS.ASSET_KITS_UPDATE,
      PERMISSIONS.ASSET_KITS_DELETE,
      PERMISSIONS.ASSET_KITS_CHECKOUT,
      PERMISSIONS.ASSET_KITS_RETURN,
      PERMISSIONS.ASSET_KITS_MANAGE,

      // Reservations - Confirmation workflow
      PERMISSIONS.ASSET_RESERVATIONS_VIEW,
      PERMISSIONS.ASSET_RESERVATIONS_CREATE,
      PERMISSIONS.ASSET_RESERVATIONS_UPDATE,
      PERMISSIONS.ASSET_RESERVATIONS_DELETE,
      PERMISSIONS.ASSET_RESERVATIONS_CANCEL,
      PERMISSIONS.ASSET_RESERVATIONS_CONFIRM,
      PERMISSIONS.ASSET_RESERVATIONS_MANAGE,

      // CMDB - Full access
      PERMISSIONS.CONFIGURATION_ITEMS_VIEW,
      PERMISSIONS.CONFIGURATION_ITEMS_CREATE,
      PERMISSIONS.CONFIGURATION_ITEMS_UPDATE,
      PERMISSIONS.CONFIGURATION_ITEMS_DELETE,
      PERMISSIONS.CI_RELATIONSHIPS_VIEW,
      PERMISSIONS.CI_RELATIONSHIPS_CREATE,
      PERMISSIONS.CI_RELATIONSHIPS_UPDATE,
      PERMISSIONS.CI_RELATIONSHIPS_DELETE,
      PERMISSIONS.RELATIONSHIP_TYPES_VIEW,
      PERMISSIONS.RELATIONSHIP_TYPES_CREATE,
      PERMISSIONS.RELATIONSHIP_TYPES_UPDATE,

      // Service Management - Full access
      PERMISSIONS.SERVICES_VIEW,
      PERMISSIONS.SERVICES_CREATE,
      PERMISSIONS.SERVICES_UPDATE,
      PERMISSIONS.SERVICES_DELETE,
      PERMISSIONS.SERVICES_RETIRE,
      PERMISSIONS.SERVICES_MANAGE,
      PERMISSIONS.BUSINESS_PROCESSES_VIEW,
      PERMISSIONS.BUSINESS_PROCESSES_CREATE,
      PERMISSIONS.BUSINESS_PROCESSES_UPDATE,
      PERMISSIONS.BUSINESS_PROCESSES_DELETE,
      PERMISSIONS.BUSINESS_PROCESSES_MANAGE,

      // Dashboard & Analytics
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.DASHBOARD_ANALYTICS,

      // Roles & Permissions (view-only for reference)
      PERMISSIONS.ROLES_VIEW,
      PERMISSIONS.PERMISSIONS_VIEW,

      // Settings (view only)
      PERMISSIONS.SETTINGS_VIEW,

      // Audit Logs
      PERMISSIONS.AUDIT_LOGS_VIEW,
      PERMISSIONS.AUDIT_LOGS_EXPORT,
    ],
  },
  editor: {
    name: "editor",
    displayName: "Editor",
    description:
      "ITAM operational staff - day-to-day asset operations, maintenance, checkouts, reservations",
    permissions: [
      // Foundation - Read + Create/Update (no delete)
      PERMISSIONS.ORGANIZATION_UNITS_VIEW,
      PERMISSIONS.PERSONS_VIEW,
      PERMISSIONS.PERSONS_CREATE,
      PERMISSIONS.PERSONS_UPDATE,
      PERMISSIONS.LOCATIONS_VIEW,
      PERMISSIONS.VENDORS_VIEW,
      PERMISSIONS.VENDOR_CONTACTS_VIEW,
      PERMISSIONS.LIFECYCLE_MODELS_VIEW,
      PERMISSIONS.LIFECYCLE_STATES_VIEW,
      PERMISSIONS.LIFECYCLE_TRANSITIONS_VIEW,
      PERMISSIONS.FIELD_DEFINITIONS_VIEW,

      // Assets - Full CRUD
      PERMISSIONS.ASSET_CATEGORIES_VIEW,
      PERMISSIONS.ASSET_MODELS_VIEW,
      PERMISSIONS.ASSETS_VIEW,
      PERMISSIONS.ASSETS_CREATE,
      PERMISSIONS.ASSETS_UPDATE,
      PERMISSIONS.ASSETS_CHECKOUT,
      PERMISSIONS.ASSET_ASSIGNMENTS_VIEW,
      PERMISSIONS.ASSET_ASSIGNMENTS_CREATE,
      PERMISSIONS.ASSET_ASSIGNMENTS_UPDATE,

      // Warranties - Create and update
      PERMISSIONS.WARRANTIES_VIEW,
      PERMISSIONS.WARRANTIES_CREATE,
      PERMISSIONS.WARRANTIES_UPDATE,

      // Maintenance - Full operational access
      PERMISSIONS.MAINTENANCE_SCHEDULES_VIEW,
      PERMISSIONS.MAINTENANCE_RECORDS_VIEW,
      PERMISSIONS.MAINTENANCE_RECORDS_CREATE,
      PERMISSIONS.MAINTENANCE_RECORDS_UPDATE,
      PERMISSIONS.MAINTENANCE_RECORDS_PERFORM,

      // Inventory - Create movements
      PERMISSIONS.STOCK_LOCATIONS_VIEW,
      PERMISSIONS.STOCK_MOVEMENTS_VIEW,
      PERMISSIONS.STOCK_MOVEMENTS_CREATE,

      // Asset Disposals - Create and update (no approval)
      PERMISSIONS.ASSET_DISPOSALS_VIEW,
      PERMISSIONS.ASSET_DISPOSALS_CREATE,
      PERMISSIONS.ASSET_DISPOSALS_UPDATE,

      // Asset Kits - Checkout operations
      PERMISSIONS.ASSET_KITS_VIEW,
      PERMISSIONS.ASSET_KITS_CHECKOUT,
      PERMISSIONS.ASSET_KITS_RETURN,

      // Reservations - Create and manage own
      PERMISSIONS.ASSET_RESERVATIONS_VIEW,
      PERMISSIONS.ASSET_RESERVATIONS_CREATE,
      PERMISSIONS.ASSET_RESERVATIONS_UPDATE,
      PERMISSIONS.ASSET_RESERVATIONS_CANCEL,

      // CMDB - Read + Create/Update
      PERMISSIONS.CONFIGURATION_ITEMS_VIEW,
      PERMISSIONS.CONFIGURATION_ITEMS_CREATE,
      PERMISSIONS.CONFIGURATION_ITEMS_UPDATE,
      PERMISSIONS.CI_RELATIONSHIPS_VIEW,
      PERMISSIONS.CI_RELATIONSHIPS_CREATE,
      PERMISSIONS.RELATIONSHIP_TYPES_VIEW,

      // Service Management - Read + Create/Update (no delete)
      PERMISSIONS.SERVICES_VIEW,
      PERMISSIONS.SERVICES_CREATE,
      PERMISSIONS.SERVICES_UPDATE,
      PERMISSIONS.BUSINESS_PROCESSES_VIEW,
      PERMISSIONS.BUSINESS_PROCESSES_CREATE,
      PERMISSIONS.BUSINESS_PROCESSES_UPDATE,

      // Dashboard
      PERMISSIONS.DASHBOARD_VIEW,

      // Settings (view only)
      PERMISSIONS.SETTINGS_VIEW,
    ],
  },
  viewer: {
    name: "viewer",
    displayName: "Viewer",
    description: "Read-only ITAM access with self-service reservations",
    permissions: [
      // Foundation - Read-only
      PERMISSIONS.ORGANIZATION_UNITS_VIEW,
      PERMISSIONS.PERSONS_VIEW,
      PERMISSIONS.LOCATIONS_VIEW,
      PERMISSIONS.VENDORS_VIEW,
      PERMISSIONS.LIFECYCLE_MODELS_VIEW,
      PERMISSIONS.LIFECYCLE_STATES_VIEW,
      PERMISSIONS.FIELD_DEFINITIONS_VIEW,

      // Assets - Read-only
      PERMISSIONS.ASSET_CATEGORIES_VIEW,
      PERMISSIONS.ASSET_MODELS_VIEW,
      PERMISSIONS.ASSETS_VIEW,
      PERMISSIONS.ASSET_ASSIGNMENTS_VIEW,

      // Warranties - Read-only
      PERMISSIONS.WARRANTIES_VIEW,

      // Maintenance - Read-only
      PERMISSIONS.MAINTENANCE_SCHEDULES_VIEW,
      PERMISSIONS.MAINTENANCE_RECORDS_VIEW,

      // Inventory - Read-only
      PERMISSIONS.STOCK_LOCATIONS_VIEW,
      PERMISSIONS.STOCK_MOVEMENTS_VIEW,

      // Asset Disposals - Read-only
      PERMISSIONS.ASSET_DISPOSALS_VIEW,

      // Asset Kits - Read-only
      PERMISSIONS.ASSET_KITS_VIEW,

      // Reservations - Read-only + self-service create
      PERMISSIONS.ASSET_RESERVATIONS_VIEW,
      PERMISSIONS.ASSET_RESERVATIONS_CREATE, // Self-service booking

      // CMDB - Read-only
      PERMISSIONS.CONFIGURATION_ITEMS_VIEW,
      PERMISSIONS.CI_RELATIONSHIPS_VIEW,
      PERMISSIONS.RELATIONSHIP_TYPES_VIEW,

      // Service Management - Read-only
      PERMISSIONS.SERVICES_VIEW,
      PERMISSIONS.BUSINESS_PROCESSES_VIEW,

      // Dashboard
      PERMISSIONS.DASHBOARD_VIEW,

      // Settings (view only)
      PERMISSIONS.SETTINGS_VIEW,
    ],
  },
};

/**
 * All system permissions with metadata
 */
const SYSTEM_PERMISSIONS = [
  // Users
  {
    name: PERMISSIONS.USERS_VIEW,
    displayName: "View Users",
    description: "View user list and details",
    resource: "users",
    action: "view",
  },
  {
    name: PERMISSIONS.USERS_CREATE,
    displayName: "Create Users",
    description: "Create new user accounts",
    resource: "users",
    action: "create",
  },
  {
    name: PERMISSIONS.USERS_UPDATE,
    displayName: "Update Users",
    description: "Edit user information",
    resource: "users",
    action: "update",
  },
  {
    name: PERMISSIONS.USERS_DELETE,
    displayName: "Delete Users",
    description: "Remove user accounts",
    resource: "users",
    action: "delete",
  },
  {
    name: PERMISSIONS.USERS_MANAGE,
    displayName: "Manage Users",
    description: "Full user management access",
    resource: "users",
    action: "manage",
  },

  // Tasks
  {
    name: PERMISSIONS.TASKS_VIEW,
    displayName: "View Tasks",
    description: "View all tasks",
    resource: "tasks",
    action: "view",
  },
  {
    name: PERMISSIONS.TASKS_CREATE,
    displayName: "Create Tasks",
    description: "Create new tasks",
    resource: "tasks",
    action: "create",
  },
  {
    name: PERMISSIONS.TASKS_UPDATE,
    displayName: "Update Tasks",
    description: "Edit any task",
    resource: "tasks",
    action: "update",
  },
  {
    name: PERMISSIONS.TASKS_UPDATE_OWN,
    displayName: "Update Own Tasks",
    description: "Edit tasks created by you",
    resource: "tasks",
    action: "update:own",
  },
  {
    name: PERMISSIONS.TASKS_DELETE,
    displayName: "Delete Tasks",
    description: "Delete any task",
    resource: "tasks",
    action: "delete",
  },
  {
    name: PERMISSIONS.TASKS_DELETE_OWN,
    displayName: "Delete Own Tasks",
    description: "Delete tasks created by you",
    resource: "tasks",
    action: "delete:own",
  },

  // Roles
  {
    name: PERMISSIONS.ROLES_VIEW,
    displayName: "View Roles",
    description: "View role list and details",
    resource: "roles",
    action: "view",
  },
  {
    name: PERMISSIONS.ROLES_CREATE,
    displayName: "Create Roles",
    description: "Create new roles",
    resource: "roles",
    action: "create",
  },
  {
    name: PERMISSIONS.ROLES_UPDATE,
    displayName: "Update Roles",
    description: "Edit role information",
    resource: "roles",
    action: "update",
  },
  {
    name: PERMISSIONS.ROLES_DELETE,
    displayName: "Delete Roles",
    description: "Remove roles",
    resource: "roles",
    action: "delete",
  },
  {
    name: PERMISSIONS.ROLES_MANAGE,
    displayName: "Manage Roles",
    description: "Full role management access",
    resource: "roles",
    action: "manage",
  },

  // Permissions
  {
    name: PERMISSIONS.PERMISSIONS_VIEW,
    displayName: "View Permissions",
    description: "View permission list",
    resource: "permissions",
    action: "view",
  },
  {
    name: PERMISSIONS.PERMISSIONS_CREATE,
    displayName: "Create Permissions",
    description: "Create new permissions",
    resource: "permissions",
    action: "create",
  },
  {
    name: PERMISSIONS.PERMISSIONS_UPDATE,
    displayName: "Update Permissions",
    description: "Edit permissions",
    resource: "permissions",
    action: "update",
  },
  {
    name: PERMISSIONS.PERMISSIONS_DELETE,
    displayName: "Delete Permissions",
    description: "Remove permissions",
    resource: "permissions",
    action: "delete",
  },
  {
    name: PERMISSIONS.PERMISSIONS_MANAGE,
    displayName: "Manage Permissions",
    description: "Full permission management",
    resource: "permissions",
    action: "manage",
  },

  // Audit Logs
  {
    name: PERMISSIONS.AUDIT_LOGS_VIEW,
    displayName: "View Audit Logs",
    description: "Access audit trail",
    resource: "audit-logs",
    action: "view",
  },
  {
    name: PERMISSIONS.AUDIT_LOGS_EXPORT,
    displayName: "Export Audit Logs",
    description: "Export audit data",
    resource: "audit-logs",
    action: "export",
  },

  // Settings
  {
    name: PERMISSIONS.SETTINGS_VIEW,
    displayName: "View Settings",
    description: "View application settings",
    resource: "settings",
    action: "view",
  },
  {
    name: PERMISSIONS.SETTINGS_MANAGE,
    displayName: "Manage Settings",
    description: "Modify application settings",
    resource: "settings",
    action: "manage",
  },

  // Dashboard
  {
    name: PERMISSIONS.DASHBOARD_VIEW,
    displayName: "View Dashboard",
    description: "Access main dashboard",
    resource: "dashboard",
    action: "view",
  },
  {
    name: PERMISSIONS.DASHBOARD_ANALYTICS,
    displayName: "View Analytics",
    description: "Access analytics and reports",
    resource: "dashboard",
    action: "analytics",
  },

  // Service Management - Services
  {
    name: PERMISSIONS.SERVICES_VIEW,
    displayName: "View Services",
    description: "View service catalog entries",
    resource: "services",
    action: "view",
  },
  {
    name: PERMISSIONS.SERVICES_CREATE,
    displayName: "Create Services",
    description: "Create new services",
    resource: "services",
    action: "create",
  },
  {
    name: PERMISSIONS.SERVICES_UPDATE,
    displayName: "Update Services",
    description: "Update existing services",
    resource: "services",
    action: "update",
  },
  {
    name: PERMISSIONS.SERVICES_DELETE,
    displayName: "Delete Services",
    description: "Delete services from catalog",
    resource: "services",
    action: "delete",
  },
  {
    name: PERMISSIONS.SERVICES_RETIRE,
    displayName: "Retire Services",
    description: "Retire or decommission services",
    resource: "services",
    action: "retire",
  },
  {
    name: PERMISSIONS.SERVICES_MANAGE,
    displayName: "Manage Services",
    description: "Full service management access",
    resource: "services",
    action: "manage",
  },

  // Service Management - Business Processes
  {
    name: PERMISSIONS.BUSINESS_PROCESSES_VIEW,
    displayName: "View Business Processes",
    description: "View service-aligned business processes",
    resource: "business-processes",
    action: "view",
  },
  {
    name: PERMISSIONS.BUSINESS_PROCESSES_CREATE,
    displayName: "Create Business Processes",
    description: "Create new business processes",
    resource: "business-processes",
    action: "create",
  },
  {
    name: PERMISSIONS.BUSINESS_PROCESSES_UPDATE,
    displayName: "Update Business Processes",
    description: "Update business process definitions",
    resource: "business-processes",
    action: "update",
  },
  {
    name: PERMISSIONS.BUSINESS_PROCESSES_DELETE,
    displayName: "Delete Business Processes",
    description: "Delete business processes",
    resource: "business-processes",
    action: "delete",
  },
  {
    name: PERMISSIONS.BUSINESS_PROCESSES_MANAGE,
    displayName: "Manage Business Processes",
    description: "Full business process management access",
    resource: "business-processes",
    action: "manage",
  },

  // Foundation: Organization Units
  {
    name: PERMISSIONS.ORGANIZATION_UNITS_VIEW,
    displayName: "View Organization Units",
    description: "View organization unit list and details",
    resource: "organization-units",
    action: "view",
  },
  {
    name: PERMISSIONS.ORGANIZATION_UNITS_CREATE,
    displayName: "Create Organization Units",
    description: "Create new organization units",
    resource: "organization-units",
    action: "create",
  },
  {
    name: PERMISSIONS.ORGANIZATION_UNITS_UPDATE,
    displayName: "Update Organization Units",
    description: "Edit organization unit information",
    resource: "organization-units",
    action: "update",
  },
  {
    name: PERMISSIONS.ORGANIZATION_UNITS_DELETE,
    displayName: "Delete Organization Units",
    description: "Remove organization units",
    resource: "organization-units",
    action: "delete",
  },
  {
    name: PERMISSIONS.ORGANIZATION_UNITS_MANAGE,
    displayName: "Manage Organization Units",
    description: "Full organization unit management access",
    resource: "organization-units",
    action: "manage",
  },

  // Foundation: Persons
  {
    name: PERMISSIONS.PERSONS_VIEW,
    displayName: "View Persons",
    description: "View person list and details",
    resource: "persons",
    action: "view",
  },
  {
    name: PERMISSIONS.PERSONS_CREATE,
    displayName: "Create Persons",
    description: "Create new person records",
    resource: "persons",
    action: "create",
  },
  {
    name: PERMISSIONS.PERSONS_UPDATE,
    displayName: "Update Persons",
    description: "Edit person information",
    resource: "persons",
    action: "update",
  },
  {
    name: PERMISSIONS.PERSONS_DELETE,
    displayName: "Delete Persons",
    description: "Remove person records",
    resource: "persons",
    action: "delete",
  },
  {
    name: PERMISSIONS.PERSONS_MANAGE,
    displayName: "Manage Persons",
    description: "Full person management access",
    resource: "persons",
    action: "manage",
  },

  // Foundation: Person Roles
  {
    name: PERMISSIONS.PERSON_ROLES_VIEW,
    displayName: "View Person Roles",
    description: "View person role assignments",
    resource: "person-roles",
    action: "view",
  },
  {
    name: PERMISSIONS.PERSON_ROLES_ASSIGN,
    displayName: "Assign Person Roles",
    description: "Assign roles to persons",
    resource: "person-roles",
    action: "assign",
  },
  {
    name: PERMISSIONS.PERSON_ROLES_REMOVE,
    displayName: "Remove Person Roles",
    description: "Remove role assignments from persons",
    resource: "person-roles",
    action: "remove",
  },
  {
    name: PERMISSIONS.PERSON_ROLES_MANAGE,
    displayName: "Manage Person Roles",
    description: "Full person role management access",
    resource: "person-roles",
    action: "manage",
  },

  // Foundation: Person Role Assignments
  {
    name: PERMISSIONS.PERSON_ROLE_ASSIGNMENTS_VIEW,
    displayName: "View Person Role Assignments",
    description: "View role assignment details",
    resource: "person-role-assignments",
    action: "view",
  },
  {
    name: PERMISSIONS.PERSON_ROLE_ASSIGNMENTS_CREATE,
    displayName: "Create Person Role Assignments",
    description: "Create new role assignments",
    resource: "person-role-assignments",
    action: "create",
  },
  {
    name: PERMISSIONS.PERSON_ROLE_ASSIGNMENTS_UPDATE,
    displayName: "Update Person Role Assignments",
    description: "Edit role assignment information",
    resource: "person-role-assignments",
    action: "update",
  },
  {
    name: PERMISSIONS.PERSON_ROLE_ASSIGNMENTS_DELETE,
    displayName: "Delete Person Role Assignments",
    description: "Remove role assignments",
    resource: "person-role-assignments",
    action: "delete",
  },
  {
    name: PERMISSIONS.PERSON_ROLE_ASSIGNMENTS_MANAGE,
    displayName: "Manage Person Role Assignments",
    description: "Full role assignment management access",
    resource: "person-role-assignments",
    action: "manage",
  },

  // Foundation: Locations
  {
    name: PERMISSIONS.LOCATIONS_VIEW,
    displayName: "View Locations",
    description: "View location list and details",
    resource: "locations",
    action: "view",
  },
  {
    name: PERMISSIONS.LOCATIONS_CREATE,
    displayName: "Create Locations",
    description: "Create new locations",
    resource: "locations",
    action: "create",
  },
  {
    name: PERMISSIONS.LOCATIONS_UPDATE,
    displayName: "Update Locations",
    description: "Edit location information",
    resource: "locations",
    action: "update",
  },
  {
    name: PERMISSIONS.LOCATIONS_DELETE,
    displayName: "Delete Locations",
    description: "Remove locations",
    resource: "locations",
    action: "delete",
  },
  {
    name: PERMISSIONS.LOCATIONS_MANAGE,
    displayName: "Manage Locations",
    description: "Full location management access",
    resource: "locations",
    action: "manage",
  },

  // Foundation: Vendors
  {
    name: PERMISSIONS.VENDORS_VIEW,
    displayName: "View Vendors",
    description: "View vendor list and details",
    resource: "vendors",
    action: "view",
  },
  {
    name: PERMISSIONS.VENDORS_CREATE,
    displayName: "Create Vendors",
    description: "Create new vendors",
    resource: "vendors",
    action: "create",
  },
  {
    name: PERMISSIONS.VENDORS_UPDATE,
    displayName: "Update Vendors",
    description: "Edit vendor information",
    resource: "vendors",
    action: "update",
  },
  {
    name: PERMISSIONS.VENDORS_DELETE,
    displayName: "Delete Vendors",
    description: "Remove vendors",
    resource: "vendors",
    action: "delete",
  },
  {
    name: PERMISSIONS.VENDORS_MANAGE,
    displayName: "Manage Vendors",
    description: "Full vendor management access",
    resource: "vendors",
    action: "manage",
  },

  // Foundation: Vendor Contacts
  {
    name: PERMISSIONS.VENDOR_CONTACTS_VIEW,
    displayName: "View Vendor Contacts",
    description: "View vendor contact list and details",
    resource: "vendor-contacts",
    action: "view",
  },
  {
    name: PERMISSIONS.VENDOR_CONTACTS_CREATE,
    displayName: "Create Vendor Contacts",
    description: "Create new vendor contacts",
    resource: "vendor-contacts",
    action: "create",
  },
  {
    name: PERMISSIONS.VENDOR_CONTACTS_UPDATE,
    displayName: "Update Vendor Contacts",
    description: "Edit vendor contact information",
    resource: "vendor-contacts",
    action: "update",
  },
  {
    name: PERMISSIONS.VENDOR_CONTACTS_DELETE,
    displayName: "Delete Vendor Contacts",
    description: "Remove vendor contacts",
    resource: "vendor-contacts",
    action: "delete",
  },

  // Foundation: Lifecycle Models
  {
    name: PERMISSIONS.LIFECYCLE_MODELS_VIEW,
    displayName: "View Lifecycle Models",
    description: "View lifecycle model list and details",
    resource: "lifecycle-models",
    action: "view",
  },
  {
    name: PERMISSIONS.LIFECYCLE_MODELS_CREATE,
    displayName: "Create Lifecycle Models",
    description: "Create new lifecycle models",
    resource: "lifecycle-models",
    action: "create",
  },
  {
    name: PERMISSIONS.LIFECYCLE_MODELS_UPDATE,
    displayName: "Update Lifecycle Models",
    description: "Edit lifecycle model information",
    resource: "lifecycle-models",
    action: "update",
  },
  {
    name: PERMISSIONS.LIFECYCLE_MODELS_DELETE,
    displayName: "Delete Lifecycle Models",
    description: "Remove lifecycle models",
    resource: "lifecycle-models",
    action: "delete",
  },
  {
    name: PERMISSIONS.LIFECYCLE_MODELS_MANAGE,
    displayName: "Manage Lifecycle Models",
    description: "Full lifecycle model management access",
    resource: "lifecycle-models",
    action: "manage",
  },

  // Foundation: Lifecycle States
  {
    name: PERMISSIONS.LIFECYCLE_STATES_VIEW,
    displayName: "View Lifecycle States",
    description: "View lifecycle state list and details",
    resource: "lifecycle-states",
    action: "view",
  },
  {
    name: PERMISSIONS.LIFECYCLE_STATES_CREATE,
    displayName: "Create Lifecycle States",
    description: "Create new lifecycle states",
    resource: "lifecycle-states",
    action: "create",
  },
  {
    name: PERMISSIONS.LIFECYCLE_STATES_UPDATE,
    displayName: "Update Lifecycle States",
    description: "Edit lifecycle state information",
    resource: "lifecycle-states",
    action: "update",
  },
  {
    name: PERMISSIONS.LIFECYCLE_STATES_DELETE,
    displayName: "Delete Lifecycle States",
    description: "Remove lifecycle states",
    resource: "lifecycle-states",
    action: "delete",
  },

  // Foundation: Lifecycle Transitions
  {
    name: PERMISSIONS.LIFECYCLE_TRANSITIONS_VIEW,
    displayName: "View Lifecycle Transitions",
    description: "View lifecycle transition list and details",
    resource: "lifecycle-transitions",
    action: "view",
  },
  {
    name: PERMISSIONS.LIFECYCLE_TRANSITIONS_CREATE,
    displayName: "Create Lifecycle Transitions",
    description: "Create new lifecycle transitions",
    resource: "lifecycle-transitions",
    action: "create",
  },
  {
    name: PERMISSIONS.LIFECYCLE_TRANSITIONS_UPDATE,
    displayName: "Update Lifecycle Transitions",
    description: "Edit lifecycle transition information",
    resource: "lifecycle-transitions",
    action: "update",
  },
  {
    name: PERMISSIONS.LIFECYCLE_TRANSITIONS_DELETE,
    displayName: "Delete Lifecycle Transitions",
    description: "Remove lifecycle transitions",
    resource: "lifecycle-transitions",
    action: "delete",
  },

  // Foundation: Field Definitions
  {
    name: PERMISSIONS.FIELD_DEFINITIONS_VIEW,
    displayName: "View Field Definitions",
    description: "View field definition list and details",
    resource: "field-definitions",
    action: "view",
  },
  {
    name: PERMISSIONS.FIELD_DEFINITIONS_CREATE,
    displayName: "Create Field Definitions",
    description: "Create new field definitions",
    resource: "field-definitions",
    action: "create",
  },
  {
    name: PERMISSIONS.FIELD_DEFINITIONS_UPDATE,
    displayName: "Update Field Definitions",
    description: "Edit field definition information",
    resource: "field-definitions",
    action: "update",
  },
  {
    name: PERMISSIONS.FIELD_DEFINITIONS_DELETE,
    displayName: "Delete Field Definitions",
    description: "Remove field definitions",
    resource: "field-definitions",
    action: "delete",
  },
  {
    name: PERMISSIONS.FIELD_DEFINITIONS_MANAGE,
    displayName: "Manage Field Definitions",
    description: "Full field definition management access",
    resource: "field-definitions",
    action: "manage",
  },

  // Assets: Asset Categories
  {
    name: PERMISSIONS.ASSET_CATEGORIES_VIEW,
    displayName: "View Asset Categories",
    description: "View asset category list and details",
    resource: "asset-categories",
    action: "view",
  },
  {
    name: PERMISSIONS.ASSET_CATEGORIES_CREATE,
    displayName: "Create Asset Categories",
    description: "Create new asset categories",
    resource: "asset-categories",
    action: "create",
  },
  {
    name: PERMISSIONS.ASSET_CATEGORIES_UPDATE,
    displayName: "Update Asset Categories",
    description: "Edit asset category information",
    resource: "asset-categories",
    action: "update",
  },
  {
    name: PERMISSIONS.ASSET_CATEGORIES_DELETE,
    displayName: "Delete Asset Categories",
    description: "Remove asset categories",
    resource: "asset-categories",
    action: "delete",
  },
  {
    name: PERMISSIONS.ASSET_CATEGORIES_MANAGE,
    displayName: "Manage Asset Categories",
    description: "Full asset category management access",
    resource: "asset-categories",
    action: "manage",
  },

  // Assets: Asset Category Fields
  {
    name: PERMISSIONS.ASSET_CATEGORY_FIELDS_VIEW,
    displayName: "View Asset Category Fields",
    description: "View custom fields for asset categories",
    resource: "asset-category-fields",
    action: "view",
  },
  {
    name: PERMISSIONS.ASSET_CATEGORY_FIELDS_CREATE,
    displayName: "Create Asset Category Fields",
    description: "Add new custom fields to asset categories",
    resource: "asset-category-fields",
    action: "create",
  },
  {
    name: PERMISSIONS.ASSET_CATEGORY_FIELDS_UPDATE,
    displayName: "Update Asset Category Fields",
    description: "Edit asset category custom fields",
    resource: "asset-category-fields",
    action: "update",
  },
  {
    name: PERMISSIONS.ASSET_CATEGORY_FIELDS_DELETE,
    displayName: "Delete Asset Category Fields",
    description: "Remove asset category custom fields",
    resource: "asset-category-fields",
    action: "delete",
  },
  {
    name: PERMISSIONS.ASSET_CATEGORY_FIELDS_MANAGE,
    displayName: "Manage Asset Category Fields",
    description: "Full management of asset category fields",
    resource: "asset-category-fields",
    action: "manage",
  },

  // Assets: Asset Models
  {
    name: PERMISSIONS.ASSET_MODELS_VIEW,
    displayName: "View Asset Models",
    description: "View asset model list and details",
    resource: "asset-models",
    action: "view",
  },
  {
    name: PERMISSIONS.ASSET_MODELS_CREATE,
    displayName: "Create Asset Models",
    description: "Create new asset models",
    resource: "asset-models",
    action: "create",
  },
  {
    name: PERMISSIONS.ASSET_MODELS_UPDATE,
    displayName: "Update Asset Models",
    description: "Edit asset model information",
    resource: "asset-models",
    action: "update",
  },
  {
    name: PERMISSIONS.ASSET_MODELS_DELETE,
    displayName: "Delete Asset Models",
    description: "Remove asset models",
    resource: "asset-models",
    action: "delete",
  },
  {
    name: PERMISSIONS.ASSET_MODELS_MANAGE,
    displayName: "Manage Asset Models",
    description: "Full asset model management access",
    resource: "asset-models",
    action: "manage",
  },

  // Assets: Assets
  {
    name: PERMISSIONS.ASSETS_VIEW,
    displayName: "View Assets",
    description: "View asset list and details",
    resource: "assets",
    action: "view",
  },
  {
    name: PERMISSIONS.ASSETS_CREATE,
    displayName: "Create Assets",
    description: "Create new assets",
    resource: "assets",
    action: "create",
  },
  {
    name: PERMISSIONS.ASSETS_UPDATE,
    displayName: "Update Assets",
    description: "Edit asset information",
    resource: "assets",
    action: "update",
  },
  {
    name: PERMISSIONS.ASSETS_DELETE,
    displayName: "Delete Assets",
    description: "Remove assets",
    resource: "assets",
    action: "delete",
  },
  {
    name: PERMISSIONS.ASSETS_CHECKOUT,
    displayName: "Checkout Assets",
    description: "Check out and return assets",
    resource: "assets",
    action: "checkout",
  },
  {
    name: PERMISSIONS.ASSETS_MANAGE,
    displayName: "Manage Assets",
    description: "Full asset management access",
    resource: "assets",
    action: "manage",
  },

  // Assets: Asset Assignments
  {
    name: PERMISSIONS.ASSET_ASSIGNMENTS_VIEW,
    displayName: "View Asset Assignments",
    description: "View asset assignment list and details",
    resource: "asset-assignments",
    action: "view",
  },
  {
    name: PERMISSIONS.ASSET_ASSIGNMENTS_CREATE,
    displayName: "Create Asset Assignments",
    description: "Create new asset assignments",
    resource: "asset-assignments",
    action: "create",
  },
  {
    name: PERMISSIONS.ASSET_ASSIGNMENTS_UPDATE,
    displayName: "Update Asset Assignments",
    description: "Edit asset assignment information",
    resource: "asset-assignments",
    action: "update",
  },
  {
    name: PERMISSIONS.ASSET_ASSIGNMENTS_DELETE,
    displayName: "Delete Asset Assignments",
    description: "Remove asset assignments",
    resource: "asset-assignments",
    action: "delete",
  },
  {
    name: PERMISSIONS.ASSET_ASSIGNMENTS_MANAGE,
    displayName: "Manage Asset Assignments",
    description: "Full asset assignment management access",
    resource: "asset-assignments",
    action: "manage",
  },

  // Assets: Warranties
  {
    name: PERMISSIONS.WARRANTIES_VIEW,
    displayName: "View Warranties",
    description: "View warranty list and details",
    resource: "warranties",
    action: "view",
  },
  {
    name: PERMISSIONS.WARRANTIES_CREATE,
    displayName: "Create Warranties",
    description: "Create new warranties",
    resource: "warranties",
    action: "create",
  },
  {
    name: PERMISSIONS.WARRANTIES_UPDATE,
    displayName: "Update Warranties",
    description: "Edit warranty information",
    resource: "warranties",
    action: "update",
  },
  {
    name: PERMISSIONS.WARRANTIES_DELETE,
    displayName: "Delete Warranties",
    description: "Remove warranties",
    resource: "warranties",
    action: "delete",
  },
  {
    name: PERMISSIONS.WARRANTIES_MANAGE,
    displayName: "Manage Warranties",
    description: "Full warranty management access",
    resource: "warranties",
    action: "manage",
  },

  // Maintenance: Schedules
  {
    name: PERMISSIONS.MAINTENANCE_SCHEDULES_VIEW,
    displayName: "View Maintenance Schedules",
    description: "View maintenance schedule list and details",
    resource: "maintenance-schedules",
    action: "view",
  },
  {
    name: PERMISSIONS.MAINTENANCE_SCHEDULES_CREATE,
    displayName: "Create Maintenance Schedules",
    description: "Create new maintenance schedules",
    resource: "maintenance-schedules",
    action: "create",
  },
  {
    name: PERMISSIONS.MAINTENANCE_SCHEDULES_UPDATE,
    displayName: "Update Maintenance Schedules",
    description: "Update existing maintenance schedules",
    resource: "maintenance-schedules",
    action: "update",
  },
  {
    name: PERMISSIONS.MAINTENANCE_SCHEDULES_DELETE,
    displayName: "Delete Maintenance Schedules",
    description: "Delete maintenance schedules",
    resource: "maintenance-schedules",
    action: "delete",
  },
  {
    name: PERMISSIONS.MAINTENANCE_SCHEDULES_MANAGE,
    displayName: "Manage Maintenance Schedules",
    description: "Full maintenance schedule management access",
    resource: "maintenance-schedules",
    action: "manage",
  },

  // Maintenance: Records
  {
    name: PERMISSIONS.MAINTENANCE_RECORDS_VIEW,
    displayName: "View Maintenance Records",
    description: "View maintenance record list and details",
    resource: "maintenance-records",
    action: "view",
  },
  {
    name: PERMISSIONS.MAINTENANCE_RECORDS_CREATE,
    displayName: "Create Maintenance Records",
    description: "Create new maintenance records",
    resource: "maintenance-records",
    action: "create",
  },
  {
    name: PERMISSIONS.MAINTENANCE_RECORDS_UPDATE,
    displayName: "Update Maintenance Records",
    description: "Update existing maintenance records",
    resource: "maintenance-records",
    action: "update",
  },
  {
    name: PERMISSIONS.MAINTENANCE_RECORDS_DELETE,
    displayName: "Delete Maintenance Records",
    description: "Delete maintenance records",
    resource: "maintenance-records",
    action: "delete",
  },
  {
    name: PERMISSIONS.MAINTENANCE_RECORDS_PERFORM,
    displayName: "Perform Maintenance",
    description: "Start, complete, and cancel maintenance work",
    resource: "maintenance-records",
    action: "perform",
  },
  {
    name: PERMISSIONS.MAINTENANCE_RECORDS_MANAGE,
    displayName: "Manage Maintenance Records",
    description: "Full maintenance record management access",
    resource: "maintenance-records",
    action: "manage",
  },

  // Inventory: Stock Locations
  {
    name: PERMISSIONS.STOCK_LOCATIONS_VIEW,
    displayName: "View Stock Locations",
    description: "View stock location list and details",
    resource: "stock-locations",
    action: "view",
  },
  {
    name: PERMISSIONS.STOCK_LOCATIONS_CREATE,
    displayName: "Create Stock Locations",
    description: "Create new stock locations",
    resource: "stock-locations",
    action: "create",
  },
  {
    name: PERMISSIONS.STOCK_LOCATIONS_UPDATE,
    displayName: "Update Stock Locations",
    description: "Edit stock location information",
    resource: "stock-locations",
    action: "update",
  },
  {
    name: PERMISSIONS.STOCK_LOCATIONS_DELETE,
    displayName: "Delete Stock Locations",
    description: "Remove stock locations",
    resource: "stock-locations",
    action: "delete",
  },
  {
    name: PERMISSIONS.STOCK_LOCATIONS_MANAGE,
    displayName: "Manage Stock Locations",
    description: "Full stock location management access",
    resource: "stock-locations",
    action: "manage",
  },

  // Inventory: Stock Movements
  {
    name: PERMISSIONS.STOCK_MOVEMENTS_VIEW,
    displayName: "View Stock Movements",
    description: "View stock movement list and details",
    resource: "stock-movements",
    action: "view",
  },
  {
    name: PERMISSIONS.STOCK_MOVEMENTS_CREATE,
    displayName: "Create Stock Movements",
    description: "Record new stock movements",
    resource: "stock-movements",
    action: "create",
  },
  {
    name: PERMISSIONS.STOCK_MOVEMENTS_DELETE,
    displayName: "Delete Stock Movements",
    description: "Remove stock movements (corrections only)",
    resource: "stock-movements",
    action: "delete",
  },
  {
    name: PERMISSIONS.STOCK_MOVEMENTS_MANAGE,
    displayName: "Manage Stock Movements",
    description: "Full stock movement management access",
    resource: "stock-movements",
    action: "manage",
  },

  // Layer 3 ITAM: Asset Disposals
  {
    name: PERMISSIONS.ASSET_DISPOSALS_VIEW,
    displayName: "View Asset Disposals",
    description: "View disposal requests and workflow",
    resource: "asset-disposals",
    action: "view",
  },
  {
    name: PERMISSIONS.ASSET_DISPOSALS_CREATE,
    displayName: "Create Asset Disposals",
    description: "Create new disposal requests",
    resource: "asset-disposals",
    action: "create",
  },
  {
    name: PERMISSIONS.ASSET_DISPOSALS_UPDATE,
    displayName: "Update Asset Disposals",
    description: "Edit disposal request details",
    resource: "asset-disposals",
    action: "update",
  },
  {
    name: PERMISSIONS.ASSET_DISPOSALS_DELETE,
    displayName: "Delete Asset Disposals",
    description: "Remove disposal requests",
    resource: "asset-disposals",
    action: "delete",
  },
  {
    name: PERMISSIONS.ASSET_DISPOSALS_APPROVE,
    displayName: "Approve Asset Disposals",
    description: "Approve disposal requests",
    resource: "asset-disposals",
    action: "approve",
  },
  {
    name: PERMISSIONS.ASSET_DISPOSALS_REJECT,
    displayName: "Reject Asset Disposals",
    description: "Reject disposal requests",
    resource: "asset-disposals",
    action: "reject",
  },
  {
    name: PERMISSIONS.ASSET_DISPOSALS_START,
    displayName: "Start Asset Disposal Process",
    description: "Begin disposal process execution",
    resource: "asset-disposals",
    action: "start",
  },
  {
    name: PERMISSIONS.ASSET_DISPOSALS_COMPLETE,
    displayName: "Complete Asset Disposals",
    description: "Mark disposal as completed",
    resource: "asset-disposals",
    action: "complete",
  },
  {
    name: PERMISSIONS.ASSET_DISPOSALS_CANCEL,
    displayName: "Cancel Asset Disposals",
    description: "Cancel disposal requests",
    resource: "asset-disposals",
    action: "cancel",
  },
  {
    name: PERMISSIONS.ASSET_DISPOSALS_MANAGE,
    displayName: "Manage Asset Disposals",
    description: "Full disposal workflow management access",
    resource: "asset-disposals",
    action: "manage",
  },

  // Layer 3 ITAM: Asset Kits
  {
    name: PERMISSIONS.ASSET_KITS_VIEW,
    displayName: "View Asset Kits",
    description: "View asset kits and checkouts",
    resource: "asset-kits",
    action: "view",
  },
  {
    name: PERMISSIONS.ASSET_KITS_CREATE,
    displayName: "Create Asset Kits",
    description: "Create new asset kit definitions",
    resource: "asset-kits",
    action: "create",
  },
  {
    name: PERMISSIONS.ASSET_KITS_UPDATE,
    displayName: "Update Asset Kits",
    description: "Edit asset kit details",
    resource: "asset-kits",
    action: "update",
  },
  {
    name: PERMISSIONS.ASSET_KITS_DELETE,
    displayName: "Delete Asset Kits",
    description: "Remove asset kits",
    resource: "asset-kits",
    action: "delete",
  },
  {
    name: PERMISSIONS.ASSET_KITS_CHECKOUT,
    displayName: "Checkout Asset Kits",
    description: "Check out kits to persons",
    resource: "asset-kits",
    action: "checkout",
  },
  {
    name: PERMISSIONS.ASSET_KITS_RETURN,
    displayName: "Return Asset Kit Items",
    description: "Process kit returns (full or partial)",
    resource: "asset-kits",
    action: "return",
  },
  {
    name: PERMISSIONS.ASSET_KITS_MANAGE,
    displayName: "Manage Asset Kits",
    description: "Full asset kit management access",
    resource: "asset-kits",
    action: "manage",
  },

  // Layer 3 ITAM: Asset Reservations
  {
    name: PERMISSIONS.ASSET_RESERVATIONS_VIEW,
    displayName: "View Asset Reservations",
    description: "View asset reservation calendar",
    resource: "asset-reservations",
    action: "view",
  },
  {
    name: PERMISSIONS.ASSET_RESERVATIONS_CREATE,
    displayName: "Create Asset Reservations",
    description: "Book assets for future use",
    resource: "asset-reservations",
    action: "create",
  },
  {
    name: PERMISSIONS.ASSET_RESERVATIONS_UPDATE,
    displayName: "Update Asset Reservations",
    description: "Edit reservation details",
    resource: "asset-reservations",
    action: "update",
  },
  {
    name: PERMISSIONS.ASSET_RESERVATIONS_DELETE,
    displayName: "Delete Asset Reservations",
    description: "Remove reservations",
    resource: "asset-reservations",
    action: "delete",
  },
  {
    name: PERMISSIONS.ASSET_RESERVATIONS_CANCEL,
    displayName: "Cancel Asset Reservations",
    description: "Cancel confirmed reservations",
    resource: "asset-reservations",
    action: "cancel",
  },
  {
    name: PERMISSIONS.ASSET_RESERVATIONS_CONFIRM,
    displayName: "Confirm Asset Reservations",
    description: "Approve and confirm reservations",
    resource: "asset-reservations",
    action: "confirm",
  },
  {
    name: PERMISSIONS.ASSET_RESERVATIONS_MANAGE,
    displayName: "Manage Asset Reservations",
    description: "Full reservation management access",
    resource: "asset-reservations",
    action: "manage",
  },

  // Layer 3 ITAM: CMDB - Configuration Items
  {
    name: PERMISSIONS.CI_CLASSES_VIEW,
    displayName: "View CI Classes",
    description: "View CI class taxonomy",
    resource: "ci-classes",
    action: "view",
  },
  {
    name: PERMISSIONS.CI_CLASSES_CREATE,
    displayName: "Create CI Classes",
    description: "Create new CI classes",
    resource: "ci-classes",
    action: "create",
  },
  {
    name: PERMISSIONS.CI_CLASSES_UPDATE,
    displayName: "Update CI Classes",
    description: "Edit CI class definitions",
    resource: "ci-classes",
    action: "update",
  },
  {
    name: PERMISSIONS.CI_CLASSES_DELETE,
    displayName: "Delete CI Classes",
    description: "Remove CI classes",
    resource: "ci-classes",
    action: "delete",
  },
  {
    name: PERMISSIONS.CI_CLASSES_MANAGE,
    displayName: "Manage CI Classes",
    description: "Full CI class management access",
    resource: "ci-classes",
    action: "manage",
  },
  {
    name: PERMISSIONS.CI_CLASS_FIELDS_VIEW,
    displayName: "View CI Class Fields",
    description: "View CI class field definitions",
    resource: "ci-class-fields",
    action: "view",
  },
  {
    name: PERMISSIONS.CI_CLASS_FIELDS_CREATE,
    displayName: "Create CI Class Fields",
    description: "Add new CI class fields",
    resource: "ci-class-fields",
    action: "create",
  },
  {
    name: PERMISSIONS.CI_CLASS_FIELDS_UPDATE,
    displayName: "Update CI Class Fields",
    description: "Edit CI class fields",
    resource: "ci-class-fields",
    action: "update",
  },
  {
    name: PERMISSIONS.CI_CLASS_FIELDS_DELETE,
    displayName: "Delete CI Class Fields",
    description: "Remove CI class fields",
    resource: "ci-class-fields",
    action: "delete",
  },
  {
    name: PERMISSIONS.CI_CLASS_FIELDS_MANAGE,
    displayName: "Manage CI Class Fields",
    description: "Full CI class field management access",
    resource: "ci-class-fields",
    action: "manage",
  },
  {
    name: PERMISSIONS.CONFIGURATION_ITEMS_VIEW,
    displayName: "View Configuration Items",
    description: "View CI list and details",
    resource: "configuration-items",
    action: "view",
  },
  {
    name: PERMISSIONS.CONFIGURATION_ITEMS_CREATE,
    displayName: "Create Configuration Items",
    description: "Create new configuration items",
    resource: "configuration-items",
    action: "create",
  },
  {
    name: PERMISSIONS.CONFIGURATION_ITEMS_UPDATE,
    displayName: "Update Configuration Items",
    description: "Edit CI information",
    resource: "configuration-items",
    action: "update",
  },
  {
    name: PERMISSIONS.CONFIGURATION_ITEMS_DELETE,
    displayName: "Delete Configuration Items",
    description: "Remove configuration items",
    resource: "configuration-items",
    action: "delete",
  },
  {
    name: PERMISSIONS.CONFIGURATION_ITEMS_MANAGE,
    displayName: "Manage Configuration Items",
    description: "Full CI management access",
    resource: "configuration-items",
    action: "manage",
  },

  // Layer 3 ITAM: CMDB - CI Relationships
  {
    name: PERMISSIONS.CI_RELATIONSHIPS_VIEW,
    displayName: "View CI Relationships",
    description: "View CI dependencies and relationships",
    resource: "ci-relationships",
    action: "view",
  },
  {
    name: PERMISSIONS.CI_RELATIONSHIPS_CREATE,
    displayName: "Create CI Relationships",
    description: "Create new CI relationships",
    resource: "ci-relationships",
    action: "create",
  },
  {
    name: PERMISSIONS.CI_RELATIONSHIPS_UPDATE,
    displayName: "Update CI Relationships",
    description: "Edit relationship details",
    resource: "ci-relationships",
    action: "update",
  },
  {
    name: PERMISSIONS.CI_RELATIONSHIPS_DELETE,
    displayName: "Delete CI Relationships",
    description: "Remove CI relationships",
    resource: "ci-relationships",
    action: "delete",
  },
  {
    name: PERMISSIONS.CI_RELATIONSHIPS_MANAGE,
    displayName: "Manage CI Relationships",
    description: "Full CI relationship management access",
    resource: "ci-relationships",
    action: "manage",
  },
  {
    name: PERMISSIONS.RELATIONSHIP_TYPE_SCOPES_VIEW,
    displayName: "View Relationship Type Scopes",
    description: "View relationship type scope rules",
    resource: "relationship-type-scopes",
    action: "view",
  },
  {
    name: PERMISSIONS.RELATIONSHIP_TYPE_SCOPES_CREATE,
    displayName: "Create Relationship Type Scopes",
    description: "Create new relationship type scopes",
    resource: "relationship-type-scopes",
    action: "create",
  },
  {
    name: PERMISSIONS.RELATIONSHIP_TYPE_SCOPES_UPDATE,
    displayName: "Update Relationship Type Scopes",
    description: "Edit relationship type scopes",
    resource: "relationship-type-scopes",
    action: "update",
  },
  {
    name: PERMISSIONS.RELATIONSHIP_TYPE_SCOPES_DELETE,
    displayName: "Delete Relationship Type Scopes",
    description: "Remove relationship type scopes",
    resource: "relationship-type-scopes",
    action: "delete",
  },
  {
    name: PERMISSIONS.RELATIONSHIP_TYPE_SCOPES_MANAGE,
    displayName: "Manage Relationship Type Scopes",
    description: "Full management of relationship type scopes",
    resource: "relationship-type-scopes",
    action: "manage",
  },

  // Layer 3 ITAM: CMDB - Relationship Types
  {
    name: PERMISSIONS.RELATIONSHIP_TYPES_VIEW,
    displayName: "View Relationship Types",
    description: "View relationship type definitions",
    resource: "relationship-types",
    action: "view",
  },
  {
    name: PERMISSIONS.RELATIONSHIP_TYPES_CREATE,
    displayName: "Create Relationship Types",
    description: "Create new relationship types",
    resource: "relationship-types",
    action: "create",
  },
  {
    name: PERMISSIONS.RELATIONSHIP_TYPES_UPDATE,
    displayName: "Update Relationship Types",
    description: "Edit relationship type details",
    resource: "relationship-types",
    action: "update",
  },
  {
    name: PERMISSIONS.RELATIONSHIP_TYPES_DELETE,
    displayName: "Delete Relationship Types",
    description: "Remove relationship types",
    resource: "relationship-types",
    action: "delete",
  },
  {
    name: PERMISSIONS.RELATIONSHIP_TYPES_MANAGE,
    displayName: "Manage Relationship Types",
    description: "Full relationship type management access",
    resource: "relationship-types",
    action: "manage",
  },

  // Contracts
  {
    name: PERMISSIONS.CONTRACT_TYPES_VIEW,
    displayName: "View Contract Types",
    description: "View contract type catalog",
    resource: "contract-types",
    action: "view",
  },
  {
    name: PERMISSIONS.CONTRACT_TYPES_CREATE,
    displayName: "Create Contract Types",
    description: "Create new contract types",
    resource: "contract-types",
    action: "create",
  },
  {
    name: PERMISSIONS.CONTRACT_TYPES_UPDATE,
    displayName: "Update Contract Types",
    description: "Edit contract types",
    resource: "contract-types",
    action: "update",
  },
  {
    name: PERMISSIONS.CONTRACT_TYPES_DELETE,
    displayName: "Delete Contract Types",
    description: "Remove contract types",
    resource: "contract-types",
    action: "delete",
  },
  {
    name: PERMISSIONS.CONTRACT_TYPES_MANAGE,
    displayName: "Manage Contract Types",
    description: "Full contract type management access",
    resource: "contract-types",
    action: "manage",
  },
  {
    name: PERMISSIONS.CONTRACTS_VIEW,
    displayName: "View Contracts",
    description: "View contracts list and details",
    resource: "contracts",
    action: "view",
  },
  {
    name: PERMISSIONS.CONTRACTS_CREATE,
    displayName: "Create Contracts",
    description: "Create new contracts",
    resource: "contracts",
    action: "create",
  },
  {
    name: PERMISSIONS.CONTRACTS_UPDATE,
    displayName: "Update Contracts",
    description: "Edit contracts",
    resource: "contracts",
    action: "update",
  },
  {
    name: PERMISSIONS.CONTRACTS_DELETE,
    displayName: "Delete Contracts",
    description: "Remove contracts",
    resource: "contracts",
    action: "delete",
  },
  {
    name: PERMISSIONS.CONTRACTS_MANAGE,
    displayName: "Manage Contracts",
    description: "Full contract management access",
    resource: "contracts",
    action: "manage",
  },
  {
    name: PERMISSIONS.CONTRACT_LINKED_OBJECTS_VIEW,
    displayName: "View Contract Linked Objects",
    description: "View objects linked to contracts",
    resource: "contract-linked-objects",
    action: "view",
  },
  {
    name: PERMISSIONS.CONTRACT_LINKED_OBJECTS_CREATE,
    displayName: "Create Contract Linked Objects",
    description: "Link objects to contracts",
    resource: "contract-linked-objects",
    action: "create",
  },
  {
    name: PERMISSIONS.CONTRACT_LINKED_OBJECTS_UPDATE,
    displayName: "Update Contract Linked Objects",
    description: "Edit linked objects",
    resource: "contract-linked-objects",
    action: "update",
  },
  {
    name: PERMISSIONS.CONTRACT_LINKED_OBJECTS_DELETE,
    displayName: "Delete Contract Linked Objects",
    description: "Remove linked objects from contracts",
    resource: "contract-linked-objects",
    action: "delete",
  },
  {
    name: PERMISSIONS.CONTRACT_LINKED_OBJECTS_MANAGE,
    displayName: "Manage Contract Linked Objects",
    description: "Full management of contract linked objects",
    resource: "contract-linked-objects",
    action: "manage",
  },

  // Licenses
  {
    name: PERMISSIONS.LICENSE_PRODUCTS_VIEW,
    displayName: "View License Products",
    description: "View software license products",
    resource: "license-products",
    action: "view",
  },
  {
    name: PERMISSIONS.LICENSE_PRODUCTS_CREATE,
    displayName: "Create License Products",
    description: "Create new license products",
    resource: "license-products",
    action: "create",
  },
  {
    name: PERMISSIONS.LICENSE_PRODUCTS_UPDATE,
    displayName: "Update License Products",
    description: "Edit license products",
    resource: "license-products",
    action: "update",
  },
  {
    name: PERMISSIONS.LICENSE_PRODUCTS_DELETE,
    displayName: "Delete License Products",
    description: "Remove license products",
    resource: "license-products",
    action: "delete",
  },
  {
    name: PERMISSIONS.LICENSE_PRODUCTS_MANAGE,
    displayName: "Manage License Products",
    description: "Full management of license products",
    resource: "license-products",
    action: "manage",
  },
  {
    name: PERMISSIONS.LICENSE_PRODUCT_FIELDS_VIEW,
    displayName: "View License Product Fields",
    description: "View custom fields for license products",
    resource: "license-product-fields",
    action: "view",
  },
  {
    name: PERMISSIONS.LICENSE_PRODUCT_FIELDS_CREATE,
    displayName: "Create License Product Fields",
    description: "Add custom fields to license products",
    resource: "license-product-fields",
    action: "create",
  },
  {
    name: PERMISSIONS.LICENSE_PRODUCT_FIELDS_UPDATE,
    displayName: "Update License Product Fields",
    description: "Edit license product custom fields",
    resource: "license-product-fields",
    action: "update",
  },
  {
    name: PERMISSIONS.LICENSE_PRODUCT_FIELDS_DELETE,
    displayName: "Delete License Product Fields",
    description: "Remove license product custom fields",
    resource: "license-product-fields",
    action: "delete",
  },
  {
    name: PERMISSIONS.LICENSE_PRODUCT_FIELDS_MANAGE,
    displayName: "Manage License Product Fields",
    description: "Full management of license product fields",
    resource: "license-product-fields",
    action: "manage",
  },
  {
    name: PERMISSIONS.LICENSE_ENTITLEMENTS_VIEW,
    displayName: "View License Entitlements",
    description: "View license entitlements",
    resource: "license-entitlements",
    action: "view",
  },
  {
    name: PERMISSIONS.LICENSE_ENTITLEMENTS_CREATE,
    displayName: "Create License Entitlements",
    description: "Create new license entitlements",
    resource: "license-entitlements",
    action: "create",
  },
  {
    name: PERMISSIONS.LICENSE_ENTITLEMENTS_UPDATE,
    displayName: "Update License Entitlements",
    description: "Edit license entitlements",
    resource: "license-entitlements",
    action: "update",
  },
  {
    name: PERMISSIONS.LICENSE_ENTITLEMENTS_DELETE,
    displayName: "Delete License Entitlements",
    description: "Remove license entitlements",
    resource: "license-entitlements",
    action: "delete",
  },
  {
    name: PERMISSIONS.LICENSE_ENTITLEMENTS_MANAGE,
    displayName: "Manage License Entitlements",
    description: "Full management of license entitlements",
    resource: "license-entitlements",
    action: "manage",
  },
  {
    name: PERMISSIONS.LICENSE_ALLOCATIONS_VIEW,
    displayName: "View License Allocations",
    description: "View license allocation records",
    resource: "license-allocations",
    action: "view",
  },
  {
    name: PERMISSIONS.LICENSE_ALLOCATIONS_CREATE,
    displayName: "Create License Allocations",
    description: "Allocate new licenses",
    resource: "license-allocations",
    action: "create",
  },
  {
    name: PERMISSIONS.LICENSE_ALLOCATIONS_UPDATE,
    displayName: "Update License Allocations",
    description: "Edit license allocations",
    resource: "license-allocations",
    action: "update",
  },
  {
    name: PERMISSIONS.LICENSE_ALLOCATIONS_DELETE,
    displayName: "Delete License Allocations",
    description: "Remove license allocations",
    resource: "license-allocations",
    action: "delete",
  },
  {
    name: PERMISSIONS.LICENSE_ALLOCATIONS_DEALLOCATE,
    displayName: "Deallocate Licenses",
    description: "Deallocate assigned licenses",
    resource: "license-allocations",
    action: "deallocate",
  },
  {
    name: PERMISSIONS.LICENSE_ALLOCATIONS_REACTIVATE,
    displayName: "Reactivate License Allocations",
    description: "Reactivate previously deallocated licenses",
    resource: "license-allocations",
    action: "reactivate",
  },
  {
    name: PERMISSIONS.LICENSE_ALLOCATIONS_MANAGE,
    displayName: "Manage License Allocations",
    description: "Full management of license allocations",
    resource: "license-allocations",
    action: "manage",
  },
] as const;

/**
 * Main seed function
 */
async function seedRBAC(prismaClient?: PrismaClient) {
  const prisma = prismaClient ?? prismaSingleton;
  logSection("RBAC System");

  try {
    // 1. Create all permissions
    logStep("📋", "Creating permissions...");
    const createdPermissions = new Map<string, string>();

    for (const permData of SYSTEM_PERMISSIONS) {
      const permission = await prisma.permission.upsert({
        where: { name: permData.name },
        update: {
          displayName: permData.displayName,
          description: permData.description,
          resource: permData.resource,
          action: permData.action,
          isSystem: true,
          isActive: true,
        },
        create: {
          name: permData.name,
          displayName: permData.displayName,
          description: permData.description,
          resource: permData.resource,
          action: permData.action,
          isSystem: true,
          isActive: true,
        },
      });

      createdPermissions.set(permission.name, permission.id);
    }

    logSuccess(`Created ${createdPermissions.size} permissions`);

    // 2. Create roles and assign permissions
    logStep("👥", "Creating roles and assigning permissions...");

    for (const [_roleName, roleData] of Object.entries(SYSTEM_ROLES)) {
      // Create role
      const role = await prisma.role.upsert({
        where: { name: roleData.name },
        update: {
          displayName: roleData.displayName,
          description: roleData.description,
          isSystem: true,
          isActive: true,
        },
        create: {
          name: roleData.name,
          displayName: roleData.displayName,
          description: roleData.description,
          isSystem: true,
          isActive: true,
        },
      });

      // Delete existing permissions for role (clean slate)
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id },
      });

      // Assign permissions to role
      const permissionAssignments = roleData.permissions
        .map((permName) => {
          const permId = createdPermissions.get(permName);
          if (!permId) {
            logWarning(`Permission not found: ${permName}`);
            return null;
          }
          return {
            roleId: role.id,
            permissionId: permId,
          };
        })
        .filter(
          (p): p is { roleId: string; permissionId: string } => p !== null,
        );

      if (permissionAssignments.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionAssignments,
          skipDuplicates: true,
        });
      }

      logSuccess(
        `Role "${roleData.displayName}" created with ${permissionAssignments.length} permissions`,
      );
    }

    logSuccess("RBAC seed completed successfully!");
    console.log("\nSummary:");
    console.log(`   - ${SYSTEM_PERMISSIONS.length} permissions created`);
    console.log(`   - ${Object.keys(SYSTEM_ROLES).length} roles created`);
    console.log("\nAutomatic Admin Assignment:");
    console.log(
      "   - The first user to sign in will automatically receive the admin role",
    );
    console.log(
      "   - To manually assign admin to first user: npm run db:assign-admin",
    );
    console.log("\nNext steps:");
    console.log(
      "   1. Sign in with Microsoft OAuth - first user gets admin automatically",
    );
    console.log("   2. Assign additional roles via admin UI (/admin/users)");
    console.log("   3. Test permission-based access control");
  } catch (error) {
    console.error("❌ RBAC seed failed:", error);
    throw error;
  }
}

/**
 * Run seed if called directly
 */
// ES module check: if this file is being run directly (not imported)
const isMainModule = process.argv[1] === new URL(import.meta.url).pathname;

if (isMainModule) {
  seedRBAC()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prismaSingleton.$disconnect();
    });
}

export { seedRBAC };
