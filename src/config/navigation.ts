/**
 * Centralized Navigation Configuration
 *
 * This file aggregates all navigation groups and exports utility functions.
 * Navigation groups are organized by domain in separate files for better maintainability.
 *
 * Architecture:
 * - Types: ./navigation.types.ts
 * - Groups: ./navigation-groups/*.ts (7 files, 8 groups total)
 * - Utils: ./navigation.utils.ts (filtering, permission checking, state management)
 *
 * Advanced features:
 * - ✅ Navigation groups with headers
 * - ✅ Collapsible groups
 * - ✅ Multi-level nested navigation
 * - ✅ Role-based permissions
 * - ✅ Real-time badge updates
 * - ✅ Dynamic visibility
 *
 * Usage:
 * ```tsx
 * import { navGroups, getVisibleNavGroups } from "@/config/navigation";
 * const visibleGroups = getVisibleNavGroups(navGroups, userPermissions, { enabledFeatures });
 * ```
 */

// ============================================================================
// Re-export Types
// ============================================================================

export type {
  NavItem,
  NavGroup,
  NavigationFilterOptions,
  NavigationPermissionChecker,
} from "./navigation.types";

// ============================================================================
// Import Navigation Groups (Auto-Generated)
// ============================================================================

import { mainNavGroup } from "./navigation-groups/main";
import { foundationNavGroup } from "./navigation-groups/foundation";
import { assetcatalogNavGroup } from "./navigation-groups/asset-catalog";
import { assetsNavGroup } from "./navigation-groups/assets";
import { servicescmdbNavGroup } from "./navigation-groups/services-cmdb";
import { workflowsNavGroup } from "./navigation-groups/workflows";
import { ClipboardList, FileText } from "lucide-react";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { NavGroup, NavItem } from "./navigation.types";
import { complianceNavGroup } from "./navigation-groups/compliance";
import { systemNavGroup } from "./navigation-groups/system";
import { rbacNavGroup } from "./navigation-groups/rbac";

// ============================================================================
// Aggregate Navigation Groups
// ============================================================================

/**
 * All navigation groups in display order
 * Organized into logical sections for better user experience
 *
 * Groups are arranged to keep data entry and key workflows near the top:
 * 1. Main (Dashboard, Intune devices, Data Import)
 * 2. Foundation (org data, lifecycle, configuration)
 * 3. Assets & Inventory
 * 4. Asset Catalog (categories, models, stock locations)
 * 5. Services & CMDB
 * 6. Compliance & Governance (licenses, contracts, governance, attachments)
 * 7. System & Operations
 * 8. RBAC & Access Control
 */
// Only published, active form names appear as Requests children.
// The list is hydrated from the authenticated API inside useSidebarNavigation;
// generated navigation groups and route manifests remain untouched.
const excludedWorkflowLinks = new Set(["/workflows/forms", "/workflows/requests"]);

export type RequestMenuStatus = "loading" | "ready" | "error";
export type RequestFormNav = {
  id: string;
  name: string;
  description: string | null;
};

export function buildRequestMenuChildren(
  forms: readonly RequestFormNav[],
  status: RequestMenuStatus,
): NavItem[] {
  if (status === "ready" && forms.length > 0) {
    return forms.map((form) => ({
      title: form.name,
      href: "/workflows/requests/new/" + encodeURIComponent(form.id),
      description: form.description ?? undefined,
      icon: FileText,
      permission: PERMISSIONS.WORKFLOWS_REQUESTS_SUBMIT,
      featureFlag: "WORKFLOW_ENGINE",
    }));
  }

  return [
    {
      title: status === "loading"
        ? "Loading forms…"
        : status === "error"
          ? "Forms unavailable"
          : "No published forms",
      href: "/workflows/forms",
      description: status === "error"
        ? "Open the forms page to retry"
        : "Only active published forms can be submitted",
      icon: FileText,
      permission: PERMISSIONS.WORKFLOWS_REQUESTS_SUBMIT,
      featureFlag: "WORKFLOW_ENGINE",
    },
  ];
}

const workflowsWithRequestMenu: NavGroup = {
  ...workflowsNavGroup,
  // Different workflow pages have different permissions: let items decide.
  permission: undefined,
  items: [
    ...workflowsNavGroup.items.filter((item) => item.href === "/workflows/inbox"),
    {
      title: "Requests",
      href: "/workflows/forms",
      icon: ClipboardList,
      description: "Open a published request form directly",
      permission: PERMISSIONS.WORKFLOWS_REQUESTS_SUBMIT,
      featureFlag: "WORKFLOW_ENGINE",
      children: buildRequestMenuChildren([], "loading"),
    },
    ...workflowsNavGroup.items.filter((item) =>
      item.href !== "/workflows/inbox" && !excludedWorkflowLinks.has(item.href)
    ),
  ],
};

export const navGroups = [
  // Core navigation (always visible)
  mainNavGroup,

  // Foundation data entry
  foundationNavGroup,

  // Assets & inventory workflows
  assetsNavGroup,

  // Asset catalog setup
  assetcatalogNavGroup,

  // Services, CMDB, and maintenance
  servicescmdbNavGroup,

  // Workflows (forms, requests, inbox, admin)
  workflowsWithRequestMenu,

  // Compliance, licensing, contracts, governance, and attachments
  complianceNavGroup,

  // System operations and platform settings
  systemNavGroup,

  // RBAC and access control (feature flag gated)
  rbacNavGroup,
];

// ============================================================================
// Re-export Utility Functions
// ============================================================================

import {
  checkItemPermission,
  checkGroupPermission,
  filterItems,
  getVisibleNavGroups as getVisibleNavGroupsUtil,
  getAllNavItems as getAllNavItemsUtil,
  getVisibleNavItems as getVisibleNavItemsUtil,
  getNavItemByHref as getNavItemByHrefUtil,
  isNavItemActive,
  isNavItemSection,
  hasChildren,
  getGroupDefaultState as getGroupDefaultStateUtil,
  getItemDefaultState as getItemDefaultStateUtil,
} from "./navigation.utils";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";
import type { NavigationFilterOptions } from "./navigation.types";

// Export utility functions with navGroups pre-applied for backward compatibility
export {
  checkItemPermission,
  checkGroupPermission,
  filterItems,
  isNavItemActive,
  isNavItemSection,
  hasChildren,
};

/**
 * Get visible navigation groups
 * @param userPermissions - Array of user's permissions
 * @param options - Configuration options
 */
export const getVisibleNavGroups = (
  userPermissions: PermissionKey[],
  options?: NavigationFilterOptions,
) => getVisibleNavGroupsUtil(navGroups, userPermissions, options);

/**
 * Legacy flat navigation items (for backward compatibility)
 * Flattens all groups into a single array, excluding children
 */
export const navItems = navGroups.flatMap((group) =>
  group.items.map((item) => {
    // Remove children to keep flat structure
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { children, ...flatItem } = item;
    return flatItem;
  }),
);

/**
 * Get all navigation items (flat, including nested children)
 */
export const getAllNavItems = () => getAllNavItemsUtil(navGroups);

/**
 * Get visible navigation items (flat)
 * @param userPermissions - Array of user's permissions
 * @param options - Configuration options
 */
export const getVisibleNavItems = (
  userPermissions: PermissionKey[],
  options?: NavigationFilterOptions,
) => getVisibleNavItemsUtil(navItems, userPermissions, options);

/**
 * Find navigation item by href (including nested items)
 */
export const getNavItemByHref = (href: string) =>
  getNavItemByHrefUtil(navGroups, href);

/**
 * Get default collapsed state for a group
 */
export const getGroupDefaultState = (groupId: string) =>
  getGroupDefaultStateUtil(navGroups, groupId);

/**
 * Get default expanded state for an item
 */
export const getItemDefaultState = (itemHref: string) =>
  getItemDefaultStateUtil(navGroups, itemHref);
