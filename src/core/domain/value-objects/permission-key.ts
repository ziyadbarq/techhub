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

  // Assets: Asset Categories
  ASSET_CATEGORIES_VIEW: "asset-categories:view",
  ASSET_CATEGORIES_CREATE: "asset-categories:create",
  ASSET_CATEGORIES_UPDATE: "asset-categories:update",
  ASSET_CATEGORIES_DELETE: "asset-categories:delete",
  ASSET_CATEGORIES_MANAGE: "asset-categories:manage",

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
