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

  // Data Import
  DATA_IMPORT_MANAGE: "data-import:manage",

  // Dashboard
  DASHBOARD_VIEW: "dashboard:view",
  DASHBOARD_ANALYTICS: "dashboard:analytics",

  // Foundation: Organization Units
  ORGANIZATION_UNITS_VIEW: "organization-units:view",
  ORGANIZATION_UNITS_CREATE: "organization-units:create",
  ORGANIZATION_UNITS_UPDATE: "organization-units:update",
  ORGANIZATION_UNITS_DELETE: "organization-units:delete",
  ORGANIZATION_UNITS_MANAGE: "organization-units:manage",

  // Foundation: Persons
  PERSONS_VIEW: "persons:view",
  PERSONS_CREATE: "persons:create",
  PERSONS_UPDATE: "persons:update",
  PERSONS_DELETE: "persons:delete",
  PERSONS_MANAGE: "persons:manage",

  // Foundation: Person Role Assignments
  PERSON_ROLES_VIEW: "person-roles:view",
  PERSON_ROLES_ASSIGN: "person-roles:assign",
  PERSON_ROLES_REMOVE: "person-roles:remove",
  PERSON_ROLES_MANAGE: "person-roles:manage",

  PERSON_ROLE_ASSIGNMENTS_VIEW: "person-role-assignments:view",
  PERSON_ROLE_ASSIGNMENTS_CREATE: "person-role-assignments:create",
  PERSON_ROLE_ASSIGNMENTS_UPDATE: "person-role-assignments:update",
  PERSON_ROLE_ASSIGNMENTS_DELETE: "person-role-assignments:delete",
  PERSON_ROLE_ASSIGNMENTS_MANAGE: "person-role-assignments:manage",

  // Foundation: Locations
  LOCATIONS_VIEW: "locations:view",
  LOCATIONS_CREATE: "locations:create",
  LOCATIONS_UPDATE: "locations:update",
  LOCATIONS_DELETE: "locations:delete",
  LOCATIONS_MANAGE: "locations:manage",

  // Foundation: Vendors
  VENDORS_VIEW: "vendors:view",
  VENDORS_CREATE: "vendors:create",
  VENDORS_UPDATE: "vendors:update",
  VENDORS_DELETE: "vendors:delete",
  VENDORS_MANAGE: "vendors:manage",

  // Foundation: Vendor Contacts
  VENDOR_CONTACTS_VIEW: "vendor-contacts:view",
  VENDOR_CONTACTS_CREATE: "vendor-contacts:create",
  VENDOR_CONTACTS_UPDATE: "vendor-contacts:update",
  VENDOR_CONTACTS_DELETE: "vendor-contacts:delete",

  // Foundation: Lifecycle Models
  LIFECYCLE_MODELS_VIEW: "lifecycle-models:view",
  LIFECYCLE_MODELS_CREATE: "lifecycle-models:create",
  LIFECYCLE_MODELS_UPDATE: "lifecycle-models:update",
  LIFECYCLE_MODELS_DELETE: "lifecycle-models:delete",
  LIFECYCLE_MODELS_MANAGE: "lifecycle-models:manage",

  // Foundation: Lifecycle States
  LIFECYCLE_STATES_VIEW: "lifecycle-states:view",
  LIFECYCLE_STATES_CREATE: "lifecycle-states:create",
  LIFECYCLE_STATES_UPDATE: "lifecycle-states:update",
  LIFECYCLE_STATES_DELETE: "lifecycle-states:delete",

  // Foundation: Lifecycle Transitions
  LIFECYCLE_TRANSITIONS_VIEW: "lifecycle-transitions:view",
  LIFECYCLE_TRANSITIONS_CREATE: "lifecycle-transitions:create",
  LIFECYCLE_TRANSITIONS_UPDATE: "lifecycle-transitions:update",
  LIFECYCLE_TRANSITIONS_DELETE: "lifecycle-transitions:delete",

  // Foundation: Field Definitions
  FIELD_DEFINITIONS_VIEW: "field-definitions:view",
  FIELD_DEFINITIONS_CREATE: "field-definitions:create",
  FIELD_DEFINITIONS_UPDATE: "field-definitions:update",
  FIELD_DEFINITIONS_DELETE: "field-definitions:delete",
  FIELD_DEFINITIONS_MANAGE: "field-definitions:manage",

  // Foundation: Exchange Rates (FX Rates)
  FX_RATES_VIEW: "fx-rates:view",
  FX_RATES_CREATE: "fx-rates:create",
  FX_RATES_UPDATE: "fx-rates:update",
  FX_RATES_DELETE: "fx-rates:delete",
  FX_RATES_MANAGE: "fx-rates:manage",
  FX_RATES_CONVERT: "fx-rates:convert",

  // Assets: Asset Categories
  ASSET_CATEGORIES_VIEW: "asset-categories:view",
  ASSET_CATEGORIES_CREATE: "asset-categories:create",
  ASSET_CATEGORIES_UPDATE: "asset-categories:update",
  ASSET_CATEGORIES_DELETE: "asset-categories:delete",
  ASSET_CATEGORIES_MANAGE: "asset-categories:manage",

  // Assets: Asset Category Fields
  ASSET_CATEGORY_FIELDS_VIEW: "asset-category-fields:view",
  ASSET_CATEGORY_FIELDS_CREATE: "asset-category-fields:create",
  ASSET_CATEGORY_FIELDS_UPDATE: "asset-category-fields:update",
  ASSET_CATEGORY_FIELDS_DELETE: "asset-category-fields:delete",
  ASSET_CATEGORY_FIELDS_MANAGE: "asset-category-fields:manage",

  // Assets: Asset Models
  ASSET_MODELS_VIEW: "asset-models:view",
  ASSET_MODELS_CREATE: "asset-models:create",
  ASSET_MODELS_UPDATE: "asset-models:update",
  ASSET_MODELS_DELETE: "asset-models:delete",
  ASSET_MODELS_MANAGE: "asset-models:manage",

  // Assets: Assets
  ASSETS_VIEW: "assets:view",
  ASSETS_CREATE: "assets:create",
  ASSETS_UPDATE: "assets:update",
  ASSETS_DELETE: "assets:delete",
  ASSETS_CHECKOUT: "assets:checkout",
  ASSETS_MANAGE: "assets:manage",

  // Assets: Asset Assignments
  ASSET_ASSIGNMENTS_VIEW: "asset-assignments:view",
  ASSET_ASSIGNMENTS_CREATE: "asset-assignments:create",
  ASSET_ASSIGNMENTS_UPDATE: "asset-assignments:update",
  ASSET_ASSIGNMENTS_DELETE: "asset-assignments:delete",
  ASSET_ASSIGNMENTS_MANAGE: "asset-assignments:manage",

  // Assets: Warranties
  WARRANTIES_VIEW: "warranties:view",
  WARRANTIES_CREATE: "warranties:create",
  WARRANTIES_UPDATE: "warranties:update",
  WARRANTIES_DELETE: "warranties:delete",
  WARRANTIES_MANAGE: "warranties:manage",

  // Maintenance: Schedules
  MAINTENANCE_SCHEDULES_VIEW: "maintenance-schedules:view",
  MAINTENANCE_SCHEDULES_CREATE: "maintenance-schedules:create",
  MAINTENANCE_SCHEDULES_UPDATE: "maintenance-schedules:update",
  MAINTENANCE_SCHEDULES_DELETE: "maintenance-schedules:delete",
  MAINTENANCE_SCHEDULES_MANAGE: "maintenance-schedules:manage",

  // Maintenance: Records
  MAINTENANCE_RECORDS_VIEW: "maintenance-records:view",
  MAINTENANCE_RECORDS_CREATE: "maintenance-records:create",
  MAINTENANCE_RECORDS_UPDATE: "maintenance-records:update",
  MAINTENANCE_RECORDS_DELETE: "maintenance-records:delete",
  MAINTENANCE_RECORDS_PERFORM: "maintenance-records:perform",
  MAINTENANCE_RECORDS_MANAGE: "maintenance-records:manage",

  // Inventory: Stock Locations
  STOCK_LOCATIONS_VIEW: "stock-locations:view",
  STOCK_LOCATIONS_CREATE: "stock-locations:create",
  STOCK_LOCATIONS_UPDATE: "stock-locations:update",
  STOCK_LOCATIONS_DELETE: "stock-locations:delete",
  STOCK_LOCATIONS_MANAGE: "stock-locations:manage",

  // Inventory: Stock Movements
  STOCK_MOVEMENTS_VIEW: "stock-movements:view",
  STOCK_MOVEMENTS_CREATE: "stock-movements:create",
  STOCK_MOVEMENTS_DELETE: "stock-movements:delete",
  STOCK_MOVEMENTS_MANAGE: "stock-movements:manage",

  // Asset Disposals
  ASSET_DISPOSALS_VIEW: "asset-disposals:view",
  ASSET_DISPOSALS_CREATE: "asset-disposals:create",
  ASSET_DISPOSALS_UPDATE: "asset-disposals:update",
  ASSET_DISPOSALS_DELETE: "asset-disposals:delete",
  ASSET_DISPOSALS_APPROVE: "asset-disposals:approve",
  ASSET_DISPOSALS_REJECT: "asset-disposals:reject",
  ASSET_DISPOSALS_START: "asset-disposals:start",
  ASSET_DISPOSALS_COMPLETE: "asset-disposals:complete",
  ASSET_DISPOSALS_CANCEL: "asset-disposals:cancel",
  ASSET_DISPOSALS_MANAGE: "asset-disposals:manage",

  // Asset Kits
  ASSET_KITS_VIEW: "asset-kits:view",
  ASSET_KITS_CREATE: "asset-kits:create",
  ASSET_KITS_UPDATE: "asset-kits:update",
  ASSET_KITS_DELETE: "asset-kits:delete",
  ASSET_KITS_CHECKOUT: "asset-kits:checkout",
  ASSET_KITS_RETURN: "asset-kits:return",
  ASSET_KITS_MANAGE: "asset-kits:manage",

  // Asset Reservations
  ASSET_RESERVATIONS_VIEW: "asset-reservations:view",
  ASSET_RESERVATIONS_CREATE: "asset-reservations:create",
  ASSET_RESERVATIONS_UPDATE: "asset-reservations:update",
  ASSET_RESERVATIONS_DELETE: "asset-reservations:delete",
  ASSET_RESERVATIONS_CANCEL: "asset-reservations:cancel",
  ASSET_RESERVATIONS_CONFIRM: "asset-reservations:confirm",
  ASSET_RESERVATIONS_MANAGE: "asset-reservations:manage",

  // CMDB: CI Classes
  CI_CLASSES_VIEW: "ci-classes:view",
  CI_CLASSES_CREATE: "ci-classes:create",
  CI_CLASSES_UPDATE: "ci-classes:update",
  CI_CLASSES_DELETE: "ci-classes:delete",
  CI_CLASSES_MANAGE: "ci-classes:manage",

  // CMDB: CI Class Fields
  CI_CLASS_FIELDS_VIEW: "ci-class-fields:view",
  CI_CLASS_FIELDS_CREATE: "ci-class-fields:create",
  CI_CLASS_FIELDS_UPDATE: "ci-class-fields:update",
  CI_CLASS_FIELDS_DELETE: "ci-class-fields:delete",
  CI_CLASS_FIELDS_MANAGE: "ci-class-fields:manage",

  // CMDB: Configuration Items
  CONFIGURATION_ITEMS_VIEW: "configuration-items:view",
  CONFIGURATION_ITEMS_CREATE: "configuration-items:create",
  CONFIGURATION_ITEMS_UPDATE: "configuration-items:update",
  CONFIGURATION_ITEMS_DELETE: "configuration-items:delete",
  CONFIGURATION_ITEMS_MANAGE: "configuration-items:manage",

  // CMDB: CI Relationships
  CI_RELATIONSHIPS_VIEW: "ci-relationships:view",
  CI_RELATIONSHIPS_CREATE: "ci-relationships:create",
  CI_RELATIONSHIPS_UPDATE: "ci-relationships:update",
  CI_RELATIONSHIPS_DELETE: "ci-relationships:delete",
  CI_RELATIONSHIPS_MANAGE: "ci-relationships:manage",

  // CMDB: Relationship Types
  RELATIONSHIP_TYPES_VIEW: "relationship-types:view",
  RELATIONSHIP_TYPES_CREATE: "relationship-types:create",
  RELATIONSHIP_TYPES_UPDATE: "relationship-types:update",
  RELATIONSHIP_TYPES_DELETE: "relationship-types:delete",
  RELATIONSHIP_TYPES_MANAGE: "relationship-types:manage",

  // CMDB: Relationship Type Scopes
  RELATIONSHIP_TYPE_SCOPES_VIEW: "relationship-type-scopes:view",
  RELATIONSHIP_TYPE_SCOPES_CREATE: "relationship-type-scopes:create",
  RELATIONSHIP_TYPE_SCOPES_UPDATE: "relationship-type-scopes:update",
  RELATIONSHIP_TYPE_SCOPES_DELETE: "relationship-type-scopes:delete",
  RELATIONSHIP_TYPE_SCOPES_MANAGE: "relationship-type-scopes:manage",

  // Contracts: Contract Types
  CONTRACT_TYPES_VIEW: "contract-types:view",
  CONTRACT_TYPES_CREATE: "contract-types:create",
  CONTRACT_TYPES_UPDATE: "contract-types:update",
  CONTRACT_TYPES_DELETE: "contract-types:delete",
  CONTRACT_TYPES_MANAGE: "contract-types:manage",

  // Contracts: Contracts
  CONTRACTS_VIEW: "contracts:view",
  CONTRACTS_CREATE: "contracts:create",
  CONTRACTS_UPDATE: "contracts:update",
  CONTRACTS_DELETE: "contracts:delete",
  CONTRACTS_MANAGE: "contracts:manage",

  // Contracts: Contract Linked Objects
  CONTRACT_LINKED_OBJECTS_VIEW: "contract-linked-objects:view",
  CONTRACT_LINKED_OBJECTS_CREATE: "contract-linked-objects:create",
  CONTRACT_LINKED_OBJECTS_UPDATE: "contract-linked-objects:update",
  CONTRACT_LINKED_OBJECTS_DELETE: "contract-linked-objects:delete",
  CONTRACT_LINKED_OBJECTS_MANAGE: "contract-linked-objects:manage",

  // Licenses: License Products
  LICENSE_PRODUCTS_VIEW: "license-products:view",
  LICENSE_PRODUCTS_CREATE: "license-products:create",
  LICENSE_PRODUCTS_UPDATE: "license-products:update",
  LICENSE_PRODUCTS_DELETE: "license-products:delete",
  LICENSE_PRODUCTS_MANAGE: "license-products:manage",

  // Licenses: License Product Fields
  LICENSE_PRODUCT_FIELDS_VIEW: "license-product-fields:view",
  LICENSE_PRODUCT_FIELDS_CREATE: "license-product-fields:create",
  LICENSE_PRODUCT_FIELDS_UPDATE: "license-product-fields:update",
  LICENSE_PRODUCT_FIELDS_DELETE: "license-product-fields:delete",
  LICENSE_PRODUCT_FIELDS_MANAGE: "license-product-fields:manage",

  // Licenses: License Entitlements
  LICENSE_ENTITLEMENTS_VIEW: "license-entitlements:view",
  LICENSE_ENTITLEMENTS_CREATE: "license-entitlements:create",
  LICENSE_ENTITLEMENTS_UPDATE: "license-entitlements:update",
  LICENSE_ENTITLEMENTS_DELETE: "license-entitlements:delete",
  LICENSE_ENTITLEMENTS_MANAGE: "license-entitlements:manage",

  // Licenses: License Allocations
  LICENSE_ALLOCATIONS_VIEW: "license-allocations:view",
  LICENSE_ALLOCATIONS_CREATE: "license-allocations:create",
  LICENSE_ALLOCATIONS_UPDATE: "license-allocations:update",
  LICENSE_ALLOCATIONS_DELETE: "license-allocations:delete",
  LICENSE_ALLOCATIONS_DEALLOCATE: "license-allocations:deallocate",
  LICENSE_ALLOCATIONS_REACTIVATE: "license-allocations:reactivate",
  LICENSE_ALLOCATIONS_MANAGE: "license-allocations:manage",

  // Governance: Data Domains
  DATA_DOMAINS_VIEW: "data-domains:view",
  DATA_DOMAINS_CREATE: "data-domains:create",
  DATA_DOMAINS_UPDATE: "data-domains:update",
  DATA_DOMAINS_DELETE: "data-domains:delete",
  DATA_DOMAINS_MANAGE: "data-domains:manage",

  // Governance: Data Ownerships
  DATA_OWNERSHIPS_VIEW: "data-ownerships:view",
  DATA_OWNERSHIPS_CREATE: "data-ownerships:create",
  DATA_OWNERSHIPS_UPDATE: "data-ownerships:update",
  DATA_OWNERSHIPS_DELETE: "data-ownerships:delete",
  DATA_OWNERSHIPS_MANAGE: "data-ownerships:manage",

  // Governance: Verification Campaigns
  VERIFICATION_CAMPAIGNS_VIEW: "verification-campaigns:view",
  VERIFICATION_CAMPAIGNS_CREATE: "verification-campaigns:create",
  VERIFICATION_CAMPAIGNS_UPDATE: "verification-campaigns:update",
  VERIFICATION_CAMPAIGNS_DELETE: "verification-campaigns:delete",
  VERIFICATION_CAMPAIGNS_START: "verification-campaigns:start",
  VERIFICATION_CAMPAIGNS_COMPLETE: "verification-campaigns:complete",
  VERIFICATION_CAMPAIGNS_MANAGE: "verification-campaigns:manage",

  // Governance: Verification Items
  VERIFICATION_ITEMS_VIEW: "verification-items:view",
  VERIFICATION_ITEMS_UPDATE: "verification-items:update",
  VERIFICATION_ITEMS_VERIFY: "verification-items:verify",
  VERIFICATION_ITEMS_FLAG_EXCEPTION: "verification-items:flag-exception",
  VERIFICATION_ITEMS_MANAGE: "verification-items:manage",

  // Attachments: Attachment Types
  ATTACHMENT_TYPES_VIEW: "attachment-types:view",
  ATTACHMENT_TYPES_CREATE: "attachment-types:create",
  ATTACHMENT_TYPES_UPDATE: "attachment-types:update",
  ATTACHMENT_TYPES_DELETE: "attachment-types:delete",
  ATTACHMENT_TYPES_MANAGE: "attachment-types:manage",

  // Attachments
  ATTACHMENTS_VIEW: "attachments:view",
  ATTACHMENTS_CREATE: "attachments:create",
  ATTACHMENTS_UPDATE: "attachments:update",
  ATTACHMENTS_DELETE: "attachments:delete",
  ATTACHMENTS_MANAGE: "attachments:manage",
  // Services: Service Management
  SERVICES_VIEW: "services:view",
  SERVICES_CREATE: "services:create",
  SERVICES_UPDATE: "services:update",
  SERVICES_DELETE: "services:delete",
  SERVICES_RETIRE: "services:retire",
  SERVICES_MANAGE: "services:manage",

  // Services: Business Processes
  BUSINESS_PROCESSES_VIEW: "business-processes:view",
  BUSINESS_PROCESSES_CREATE: "business-processes:create",
  BUSINESS_PROCESSES_UPDATE: "business-processes:update",
  BUSINESS_PROCESSES_DELETE: "business-processes:delete",
  BUSINESS_PROCESSES_MANAGE: "business-processes:manage",
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
