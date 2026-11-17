/**
 * Base roles (besides System Administrator and Viewer):
 *
 * - asset-manager:    full control of assets, inventory, licenses, contracts,
 *                     vendors and locations, their settings, approvals and reports
 * - asset-officer:    day-to-day asset work; no delete, approvals or settings
 * - cmdb-manager:     the CMDB (CIs, classes, relationships, services, business
 *                     processes, data ownership) plus read access to assets
 * - workflow-officer: everything in Workflows
 *
 * Every role also carries the employee baseline (EMPLOYEE_PERMISSIONS), so a
 * person holding only one of these roles can still use self-service.
 *
 * Permissions are derived from the permission catalog by resource and action,
 * so a new action on one of these resources lands in the right roles.
 */

import {
  PERMISSIONS,
  type PermissionKey,
} from "@/core/domain/value-objects/permission-key";
import { SYSTEM_PERMISSIONS } from "../seed-rbac-permissions";
import type { RoleDefinition } from "./types";

/** What every employee can do: dashboard, own requests, approvals assigned to them, knowledge base. */
export const EMPLOYEE_PERMISSIONS: PermissionKey[] = [
  PERMISSIONS.DASHBOARD_VIEW,
  PERMISSIONS.SETTINGS_VIEW,
  PERMISSIONS.KNOWLEDGE_BASE_VIEW,
  PERMISSIONS.WORKFLOWS_REQUESTS_SUBMIT,
  PERMISSIONS.WORKFLOWS_REQUESTS_VIEW_OWN,
  PERMISSIONS.WORKFLOWS_REQUESTS_CANCEL_OWN,
  PERMISSIONS.WORKFLOWS_REQUESTS_COMMENT,
  PERMISSIONS.WORKFLOWS_REQUESTS_ATTACH,
  // Acting is still limited to the step's assignees by the engine.
  PERMISSIONS.WORKFLOWS_REQUESTS_ACT,
  PERMISSIONS.WORKFLOWS_INBOX_VIEW,
  PERMISSIONS.WORKFLOWS_NOTIFICATIONS_VIEW,
];

/** Assets, inventory, licenses, contracts and what they hang off. */
const ASSET_OPERATIONS = [
  "assets",
  "asset-assignments",
  "asset-disposals",
  "asset-kits",
  "asset-reservations",
  "attachments",
  "contracts",
  "contract-linked-objects",
  "intune-devices",
  "license-allocations",
  "license-entitlements",
  "license-products",
  "locations",
  "maintenance-records",
  "maintenance-schedules",
  "stock-locations",
  "stock-movements",
  "tasks",
  "vendors",
  "vendor-contacts",
  "verification-campaigns",
  "verification-items",
  "warranties",
] as const;

/** Asset configuration: officers can read it, managers change it. */
const ASSET_SETTINGS = [
  "asset-categories",
  "asset-category-fields",
  "asset-models",
  "attachment-types",
  "contract-types",
  "field-definitions",
  "fx-rates",
  "license-product-fields",
  "lifecycle-models",
  "lifecycle-states",
  "lifecycle-transitions",
] as const;

const ASSET_READ_ONLY_EXTRAS = [
  "intune-compliance",
  "intune-sync-logs",
] as const;

const CMDB = [
  "business-processes",
  "ci-class-fields",
  "ci-classes",
  "ci-relationships",
  "configuration-items",
  "data-domains",
  "data-ownerships",
  "relationship-type-scopes",
  "relationship-types",
  "services",
] as const;

/** Actions an asset officer may NOT perform on operational resources. */
const OFFICER_EXCLUDED_ACTIONS = new Set([
  "delete",
  "manage",
  "approve",
  "reject",
  "complete",
  "start",
  "void",
]);

function catalog(
  resources: readonly string[],
  keep: (action: string) => boolean = () => true,
): PermissionKey[] {
  const wanted = new Set(resources);
  return SYSTEM_PERMISSIONS.filter(
    (perm) => wanted.has(perm.resource) && keep(perm.action),
  ).map((perm) => perm.name);
}

const view = (action: string) => action === "view";

function role(
  name: string,
  displayName: string,
  description: string,
  permissions: PermissionKey[],
): RoleDefinition {
  return {
    name,
    displayName,
    description,
    permissions: [...new Set([...EMPLOYEE_PERMISSIONS, ...permissions])],
  };
}

const PEOPLE_LOOKUPS: PermissionKey[] = [
  PERMISSIONS.PERSONS_VIEW,
  PERMISSIONS.ORGANIZATION_UNITS_VIEW,
];

export const BASE_ROLES: Record<string, RoleDefinition> = {
  "asset-manager": role(
    "asset-manager",
    "Asset Manager",
    "Full control of assets, inventory, licenses, contracts, vendors and locations, including approvals, settings and reports",
    [
      ...catalog(ASSET_OPERATIONS),
      ...catalog(ASSET_SETTINGS),
      ...catalog(ASSET_READ_ONLY_EXTRAS),
      ...catalog(["reports"], (a) => a !== "manage"),
      PERMISSIONS.DASHBOARD_ANALYTICS,
      PERMISSIONS.CONFIGURATION_ITEMS_VIEW,
      PERMISSIONS.SERVICES_VIEW,
      ...PEOPLE_LOOKUPS,
    ],
  ),

  "asset-officer": role(
    "asset-officer",
    "Asset Officer",
    "Day-to-day asset work: add, update, assign, check out and return, stock, maintenance and verification. No delete, approvals or settings",
    [
      ...catalog(ASSET_OPERATIONS, (a) => !OFFICER_EXCLUDED_ACTIONS.has(a)),
      ...catalog(ASSET_SETTINGS, view),
      ...catalog(ASSET_READ_ONLY_EXTRAS),
      PERMISSIONS.REPORTS_VIEW,
      ...PEOPLE_LOOKUPS,
    ],
  ),

  "cmdb-manager": role(
    "cmdb-manager",
    "CMDB Manager",
    "Manages the CMDB: configuration items, CI classes and relationships, services, business processes and data ownership. Read access to assets",
    [
      ...catalog(CMDB),
      ...catalog(["oci-sync", "oci-sync-logs"]),
      ...catalog([...ASSET_OPERATIONS, ...ASSET_SETTINGS], view),
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_EXPORT,
      PERMISSIONS.DASHBOARD_ANALYTICS,
      ...PEOPLE_LOOKUPS,
    ],
  ),

  "workflow-officer": role(
    "workflow-officer",
    "Workflow Officer",
    "Everything in Workflows: inbox and requests, forms and approval paths, access services, calendars, delegations and settings",
    [
      ...SYSTEM_PERMISSIONS.filter((perm) =>
        perm.resource.startsWith("workflows-"),
      ).map((perm) => perm.name),
      ...PEOPLE_LOOKUPS,
    ],
  ),
};
