/**
 * RBAC Permission Definitions
 *
 * All system permission definitions extracted from seed-rbac.ts
 * Uses factory pattern to reduce duplication and apply DRY principles
 */

import {
  PERMISSIONS,
  type PermissionKey,
} from "@/core/domain/value-objects/permission-key";

/**
 * Permission definition shape
 */
export interface PermissionDefinition {
  name: PermissionKey;
  displayName: string;
  description: string;
  resource: string;
  action: string;
}

/**
 * Permission factory - creates permission definition with consistent structure
 * Reduces duplication and ensures consistency across all permissions
 *
 * @param resource - The resource being controlled (e.g., "users", "assets")
 * @param action - The action being performed (e.g., "view", "create", "delete")
 * @param options - Optional customization for display name and description
 */
function createPermission(
  resource: string,
  action: string,
  options?: {
    displayName?: string;
    description?: string;
  },
): PermissionDefinition {
  const name = `${resource}:${action}` as PermissionKey;
  const actionLabel = action.replace(/:/g, " ");
  const resourceLabel = resource.replace(/-/g, " ");

  return {
    name,
    displayName:
      options?.displayName ??
      `${capitalize(actionLabel)} ${capitalize(resourceLabel)}`,
    description:
      options?.description ??
      `${capitalize(actionLabel)} ${resourceLabel}`.trim(),
    resource,
    action,
  };
}

/**
 * Helper to capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Create a set of CRUD permissions for a resource
 * Reduces repetition for common CRUD patterns
 */
function createCRUDPermissions(
  resource: string,
  options?: {
    viewDescription?: string;
    createDescription?: string;
    updateDescription?: string;
    deleteDescription?: string;
    manageDescription?: string;
  },
): PermissionDefinition[] {
  const resourceDisplay = capitalize(resource).replace(/-/g, " ");

  return [
    createPermission(resource, "view", {
      displayName: `View ${resourceDisplay}`,
      description:
        options?.viewDescription ??
        `View ${resource.replace(/-/g, " ")} list and details`,
    }),
    createPermission(resource, "create", {
      displayName: `Create ${resourceDisplay}`,
      description:
        options?.createDescription ??
        `Create new ${resource.replace(/-/g, " ")}`,
    }),
    createPermission(resource, "update", {
      displayName: `Update ${resourceDisplay}`,
      description:
        options?.updateDescription ??
        `Edit ${resource.replace(/-/g, " ")} information`,
    }),
    createPermission(resource, "delete", {
      displayName: `Delete ${resourceDisplay}`,
      description:
        options?.deleteDescription ?? `Remove ${resource.replace(/-/g, " ")}`,
    }),
    createPermission(resource, "manage", {
      displayName: `Manage ${resourceDisplay}`,
      description:
        options?.manageDescription ??
        `Full ${resource.replace(/-/g, " ")} management access`,
    }),
  ];
}

/**
 * Create permission definition directly from a permission key (resource:action pattern)
 * Ensures we don't miss any entries defined in PERMISSIONS.
 */
function createPermissionFromKey(key: PermissionKey): PermissionDefinition {
  const [resource, ...actionParts] = key.split(":");
  const action = actionParts.join(":");
  return createPermission(resource, action, {
    displayName: `${capitalize(action.replace(/:/g, " "))} ${capitalize(resource.replace(/-/g, " "))}`,
    description: `${capitalize(action.replace(/:/g, " "))} ${resource.replace(/-/g, " ")}`,
  });
}

/**
 * All system permissions organized by domain
 */
const BASE_PERMISSIONS: PermissionDefinition[] = [
  // ==========================================
  // Users
  // ==========================================
  ...createCRUDPermissions("users", {
    viewDescription: "View user list and details",
    createDescription: "Create new user accounts",
    updateDescription: "Edit user information",
    deleteDescription: "Remove user accounts",
  }),

  // ==========================================
  // Tasks
  // ==========================================
  ...createCRUDPermissions("tasks"),
  createPermission("tasks", "update:own", {
    displayName: "Update Own Tasks",
    description: "Edit tasks created by you",
  }),
  createPermission("tasks", "delete:own", {
    displayName: "Delete Own Tasks",
    description: "Delete tasks created by you",
  }),

  // ==========================================
  // Roles
  // ==========================================
  ...createCRUDPermissions("roles", {
    viewDescription: "View role list and details",
    createDescription: "Create new roles",
    updateDescription: "Edit role information",
    deleteDescription: "Remove roles",
  }),

  // ==========================================
  // Permissions
  // ==========================================
  ...createCRUDPermissions("permissions", {
    viewDescription: "View permission list",
    createDescription: "Create new permissions",
    updateDescription: "Edit permissions",
    deleteDescription: "Remove permissions",
    manageDescription: "Full permission management",
  }),

  // ==========================================
  // Audit Logs
  // ==========================================
  createPermission("audit-logs", "view", {
    displayName: "View Audit Logs",
    description: "Access audit trail",
  }),
  createPermission("audit-logs", "export", {
    displayName: "Export Audit Logs",
    description: "Export audit data",
  }),

  // ==========================================
  // Settings
  // ==========================================
  createPermission("settings", "view", {
    displayName: "View Settings",
    description: "View application settings",
  }),
  createPermission("settings", "manage", {
    displayName: "Manage Settings",
    description: "Modify application settings",
  }),

  // ==========================================
  // Two-Factor Authentication
  // ==========================================
  createPermission("settings", "2fa:view", {
    displayName: "View 2FA Status",
    description: "View two-factor authentication status",
  }),
  createPermission("settings", "2fa:enable", {
    displayName: "Enable 2FA",
    description: "Enable two-factor authentication for own account",
  }),
  createPermission("settings", "2fa:disable", {
    displayName: "Disable 2FA",
    description: "Disable two-factor authentication for own account",
  }),

  // ==========================================
  // Database Backups
  // ==========================================
  createPermission("database-backups", "manage", {
    displayName: "Manage Database Backups",
    description: "Create and manage database backup files",
  }),
  createPermission("database-restore", "execute", {
    displayName: "Restore Database",
    description: "Restore database from a backup file",
  }),

  // ==========================================
  // Dashboard
  // ==========================================
  createPermission("dashboard", "view", {
    displayName: "View Dashboard",
    description: "Access main dashboard",
  }),
  createPermission("dashboard", "analytics", {
    displayName: "View Analytics",
    description: "Access analytics and reports",
  }),

  // ==========================================
  // Service Management
  // ==========================================
  ...createCRUDPermissions("services", {
    viewDescription: "View service catalog entries",
    createDescription: "Create new services",
    updateDescription: "Update existing services",
    deleteDescription: "Delete services from catalog",
  }),
  createPermission("services", "retire", {
    displayName: "Retire Services",
    description: "Retire or decommission services",
  }),

  ...createCRUDPermissions("business-processes", {
    viewDescription: "View service-aligned business processes",
    createDescription: "Create new business processes",
    updateDescription: "Update business process definitions",
    deleteDescription: "Delete business processes",
  }),

  // ==========================================
  // Governance
  // ==========================================
  ...createCRUDPermissions("data-domains", {
    viewDescription: "View data domain catalog",
  }),

  ...createCRUDPermissions("data-ownerships", {
    viewDescription: "View data ownership assignments",
    createDescription: "Assign new data ownerships",
    updateDescription: "Update data ownership assignments",
    deleteDescription: "Remove data ownership assignments",
  }),

  ...createCRUDPermissions("verification-campaigns", {
    viewDescription: "View verification campaign list and details",
    createDescription: "Create new verification campaigns",
    updateDescription: "Update verification campaigns",
    deleteDescription: "Delete verification campaigns",
  }),
  createPermission("verification-campaigns", "start", {
    displayName: "Start Verification Campaigns",
    description: "Start verification campaigns",
  }),
  createPermission("verification-campaigns", "complete", {
    displayName: "Complete Verification Campaigns",
    description: "Complete verification campaigns",
  }),

  createPermission("verification-items", "view", {
    displayName: "View Verification Items",
    description: "View verification items",
  }),
  createPermission("verification-items", "update", {
    displayName: "Update Verification Items",
    description: "Update verification item assignees and metadata",
  }),
  createPermission("verification-items", "verify", {
    displayName: "Verify Verification Items",
    description: "Mark verification items as verified",
  }),
  createPermission("verification-items", "flag-exception", {
    displayName: "Flag Verification Item Exceptions",
    description: "Flag verification items as exceptions",
  }),
  createPermission("verification-items", "manage", {
    displayName: "Manage Verification Items",
    description: "Full verification item management access",
  }),

  // ==========================================
  // Attachments
  // ==========================================
  ...createCRUDPermissions("attachment-types", {
    viewDescription: "View attachment type definitions",
    createDescription: "Create new attachment types",
    updateDescription: "Update attachment type definitions",
    deleteDescription: "Delete attachment types",
  }),

  ...createCRUDPermissions("attachments", {
    viewDescription: "View attachments",
    createDescription: "Upload new attachments",
    updateDescription: "Update attachment metadata",
    deleteDescription: "Delete attachments",
  }),

  // ==========================================
  // Foundation Layer
  // ==========================================
  ...createCRUDPermissions("organization-units", {
    viewDescription: "View organization unit list and details",
    createDescription: "Create new organization units",
    updateDescription: "Edit organization unit information",
    deleteDescription: "Remove organization units",
  }),

  ...createCRUDPermissions("persons", {
    viewDescription: "View person list and details",
    createDescription: "Create new person records",
    updateDescription: "Edit person information",
    deleteDescription: "Remove person records",
  }),

  ...createCRUDPermissions("locations", {
    viewDescription: "View location list and details",
    createDescription: "Create new locations",
    updateDescription: "Edit location information",
    deleteDescription: "Remove locations",
  }),

  ...createCRUDPermissions("vendors", {
    viewDescription: "View vendor list and details",
    createDescription: "Create new vendors",
    updateDescription: "Edit vendor information",
    deleteDescription: "Remove vendors",
  }),

  ...createCRUDPermissions("vendor-contacts", {
    viewDescription: "View vendor contact list and details",
    createDescription: "Create new vendor contacts",
    updateDescription: "Edit vendor contact information",
    deleteDescription: "Remove vendor contacts",
  }),

  ...createCRUDPermissions("lifecycle-models", {
    viewDescription: "View lifecycle model list and details",
    createDescription: "Create new lifecycle models",
    updateDescription: "Edit lifecycle model information",
    deleteDescription: "Remove lifecycle models",
  }),

  ...createCRUDPermissions("lifecycle-states", {
    viewDescription: "View lifecycle state list and details",
    createDescription: "Create new lifecycle states",
    updateDescription: "Edit lifecycle state information",
    deleteDescription: "Remove lifecycle states",
  }),

  ...createCRUDPermissions("lifecycle-transitions", {
    viewDescription: "View lifecycle transition list and details",
    createDescription: "Create new lifecycle transitions",
    updateDescription: "Edit lifecycle transition information",
    deleteDescription: "Remove lifecycle transitions",
  }),

  ...createCRUDPermissions("field-definitions", {
    viewDescription: "View field definition list and details",
    createDescription: "Create new field definitions",
    updateDescription: "Edit field definition information",
    deleteDescription: "Remove field definitions",
  }),

  ...createCRUDPermissions("fx-rates", {
    viewDescription: "View foreign exchange rate list and details",
    createDescription: "Create new foreign exchange rates",
    updateDescription: "Edit foreign exchange rate values and status",
    deleteDescription: "Remove foreign exchange rates",
    manageDescription: "Full foreign exchange rate management access",
  }),
  createPermission("fx-rates", "convert", {
    displayName: "Convert Currency",
    description: "Perform currency conversion using exchange rates",
  }),

  // ==========================================
  // Asset Layer
  // ==========================================
  ...createCRUDPermissions("asset-categories"),
  ...createCRUDPermissions("asset-category-fields", {
    viewDescription: "View custom fields for asset categories",
    createDescription: "Add new custom fields to asset categories",
    updateDescription: "Edit asset category custom fields",
    deleteDescription: "Remove asset category custom fields",
    manageDescription: "Full management of asset category fields",
  }),
  ...createCRUDPermissions("asset-models"),
  ...createCRUDPermissions("assets"),
  createPermission("assets", "checkout", {
    displayName: "Checkout Assets",
    description: "Check out and return assets",
  }),
  ...createCRUDPermissions("asset-assignments"),
  ...createCRUDPermissions("warranties"),

  // ==========================================
  // Maintenance
  // ==========================================
  ...createCRUDPermissions("maintenance-schedules", {
    viewDescription: "View maintenance schedule list and details",
    createDescription: "Create new maintenance schedules",
    updateDescription: "Update existing maintenance schedules",
    deleteDescription: "Delete maintenance schedules",
  }),
  ...createCRUDPermissions("maintenance-records", {
    viewDescription: "View maintenance record list and details",
    createDescription: "Create new maintenance records",
    updateDescription: "Update existing maintenance records",
    deleteDescription: "Delete maintenance records",
  }),
  createPermission("maintenance-records", "perform", {
    displayName: "Perform Maintenance",
    description: "Start, complete, and cancel maintenance work",
  }),

  // ==========================================
  // Inventory
  // ==========================================
  ...createCRUDPermissions("stock-locations"),
  ...createCRUDPermissions("stock-movements", {
    viewDescription: "View stock movement list and details",
    createDescription: "Record new stock movements",
    deleteDescription: "Remove stock movements (corrections only)",
  }),

  // ==========================================
  // Layer 3 ITAM: Asset Disposals
  // ==========================================
  ...createCRUDPermissions("asset-disposals", {
    viewDescription: "View disposal requests and workflow",
    createDescription: "Create new disposal requests",
    updateDescription: "Edit disposal request details",
    deleteDescription: "Remove disposal requests",
    manageDescription: "Full disposal workflow management access",
  }),
  createPermission("asset-disposals", "approve", {
    displayName: "Approve Asset Disposals",
    description: "Approve disposal requests",
  }),
  createPermission("asset-disposals", "reject", {
    displayName: "Reject Asset Disposals",
    description: "Reject disposal requests",
  }),
  createPermission("asset-disposals", "start", {
    displayName: "Start Asset Disposal Process",
    description: "Begin disposal process execution",
  }),
  createPermission("asset-disposals", "complete", {
    displayName: "Complete Asset Disposals",
    description: "Mark disposal as completed",
  }),
  createPermission("asset-disposals", "cancel", {
    displayName: "Cancel Asset Disposals",
    description: "Cancel disposal requests",
  }),

  // ==========================================
  // Layer 3 ITAM: Asset Kits
  // ==========================================
  ...createCRUDPermissions("asset-kits", {
    viewDescription: "View asset kits and checkouts",
    createDescription: "Create new asset kit definitions",
    updateDescription: "Edit asset kit details",
    deleteDescription: "Remove asset kits",
  }),
  createPermission("asset-kits", "checkout", {
    displayName: "Checkout Asset Kits",
    description: "Check out kits to persons",
  }),
  createPermission("asset-kits", "return", {
    displayName: "Return Asset Kit Items",
    description: "Process kit returns (full or partial)",
  }),

  // ==========================================
  // Layer 3 ITAM: Asset Reservations
  // ==========================================
  ...createCRUDPermissions("asset-reservations", {
    viewDescription: "View asset reservation calendar",
    createDescription: "Book assets for future use",
    updateDescription: "Edit reservation details",
    deleteDescription: "Remove reservations",
  }),
  createPermission("asset-reservations", "cancel", {
    displayName: "Cancel Asset Reservations",
    description: "Cancel confirmed reservations",
  }),
  createPermission("asset-reservations", "confirm", {
    displayName: "Confirm Asset Reservations",
    description: "Approve and confirm reservations",
  }),

  // ==========================================
  // Layer 3 ITAM: CMDB
  // ==========================================
  ...createCRUDPermissions("ci-classes", {
    viewDescription: "View CI class taxonomy",
    createDescription: "Create new CI classes",
    updateDescription: "Edit CI class definitions",
    deleteDescription: "Remove CI classes",
  }),
  ...createCRUDPermissions("ci-class-fields", {
    viewDescription: "View CI class field definitions",
    createDescription: "Add new CI class fields",
    updateDescription: "Edit CI class fields",
    deleteDescription: "Remove CI class fields",
  }),
  ...createCRUDPermissions("configuration-items", {
    viewDescription: "View CI list and details",
    createDescription: "Create new configuration items",
    updateDescription: "Edit CI information",
    deleteDescription: "Remove configuration items",
  }),
  ...createCRUDPermissions("ci-relationships", {
    viewDescription: "View CI dependencies and relationships",
    createDescription: "Create new CI relationships",
    updateDescription: "Edit relationship details",
    deleteDescription: "Remove CI relationships",
  }),
  ...createCRUDPermissions("relationship-types", {
    viewDescription: "View relationship type definitions",
    createDescription: "Create new relationship types",
    updateDescription: "Edit relationship type details",
    deleteDescription: "Remove relationship types",
  }),
  ...createCRUDPermissions("relationship-type-scopes", {
    viewDescription: "View relationship type scope rules",
    createDescription: "Create new relationship type scopes",
    updateDescription: "Edit relationship type scopes",
    deleteDescription: "Remove relationship type scopes",
    manageDescription: "Full management of relationship type scopes",
  }),

  // ==========================================
  // Contracts
  // ==========================================
  ...createCRUDPermissions("contract-types", {
    viewDescription: "View contract type catalog",
  }),
  ...createCRUDPermissions("contracts", {
    viewDescription: "View contracts list and details",
  }),
  ...createCRUDPermissions("contract-linked-objects", {
    viewDescription: "View objects linked to contracts",
    createDescription: "Link objects to contracts",
    updateDescription: "Edit linked objects",
    deleteDescription: "Remove linked objects from contracts",
    manageDescription: "Full management of contract linked objects",
  }),

  // ==========================================
  // Licenses
  // ==========================================
  ...createCRUDPermissions("license-products", {
    viewDescription: "View software license products",
    createDescription: "Create new license products",
    updateDescription: "Edit license products",
    deleteDescription: "Remove license products",
    manageDescription: "Full management of license products",
  }),
  ...createCRUDPermissions("license-product-fields", {
    viewDescription: "View custom fields for license products",
    createDescription: "Add custom fields to license products",
    updateDescription: "Edit license product custom fields",
    deleteDescription: "Remove license product custom fields",
    manageDescription: "Full management of license product fields",
  }),
  ...createCRUDPermissions("license-entitlements", {
    viewDescription: "View license entitlements",
    createDescription: "Create new license entitlements",
    updateDescription: "Edit license entitlements",
    deleteDescription: "Remove license entitlements",
    manageDescription: "Full management of license entitlements",
  }),
  ...createCRUDPermissions("license-allocations", {
    viewDescription: "View license allocation records",
    createDescription: "Allocate new licenses",
    updateDescription: "Edit license allocations",
    deleteDescription: "Remove license allocations",
    manageDescription: "Full management of license allocations",
  }),
  createPermission("license-allocations", "deallocate", {
    displayName: "Deallocate Licenses",
    description: "Deallocate assigned licenses",
  }),
  createPermission("license-allocations", "reactivate", {
    displayName: "Reactivate License Allocations",
    description: "Reactivate previously deallocated licenses",
  }),

  // ==========================================
  // Intune / MDM Integration
  // ==========================================
  createPermission("intune-devices", "view", {
    displayName: "View Intune Devices",
    description: "View Intune device list and details",
  }),
  createPermission("intune-devices", "sync", {
    displayName: "Sync Intune Devices",
    description: "Trigger device sync from Microsoft Intune",
  }),
  createPermission("intune-devices", "link", {
    displayName: "Link Intune Devices",
    description: "Link or unlink Intune devices to assets and persons",
  }),
  createPermission("intune-devices", "manage", {
    displayName: "Manage Intune Devices",
    description: "Full Intune device management access",
  }),
  createPermission("intune-compliance", "view", {
    displayName: "View Intune Compliance",
    description: "View device compliance status and history",
  }),
  createPermission("intune-sync-logs", "view", {
    displayName: "View Intune Sync Logs",
    description: "View Intune sync operation logs",
  }),

  // ==========================================
  // OCI Cloud Sync
  // ==========================================
  createPermission("oci-sync", "view", {
    displayName: "View OCI Sync",
    description: "View OCI Cloud Sync dashboard and status",
  }),
  createPermission("oci-sync", "trigger", {
    displayName: "Trigger OCI Sync",
    description: "Trigger manual OCI cloud resource synchronization",
  }),
  createPermission("oci-sync-logs", "view", {
    displayName: "View OCI Sync Logs",
    description: "View OCI sync operation history and logs",
  }),
] as const;

const definedPermissionNames = new Set(
  BASE_PERMISSIONS.map((p) => p.name as string),
);

const missingPermissions = (Object.values(PERMISSIONS) as PermissionKey[])
  .filter((key) => !definedPermissionNames.has(key))
  .map((key) => createPermissionFromKey(key));

export const SYSTEM_PERMISSIONS: PermissionDefinition[] = [
  ...BASE_PERMISSIONS,
  ...missingPermissions,
];
