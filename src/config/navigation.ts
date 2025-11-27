/**
 * Centralized Navigation Configuration
 *
 * This file aggregates all navigation groups and exports utility functions.
 * Navigation groups are organized by domain in separate files for better maintainability.
 *
 * Architecture:
 * - Types: ./navigation.types.ts
 * - Groups: ./navigation-groups/*.ts (6 files, 14 groups total)
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
// Import Navigation Groups
// ============================================================================

// Main navigation
import { mainNavGroup } from "./navigation-groups/main";

// Setup group (consolidated for initial deployment)
import { setupGroup } from "./navigation-groups/setup";

// Asset-related groups (hidden for initial deployment)
import {
  assetManagementGroup,
  assetOperationsGroup,
  inventoryGroup,
} from "./navigation-groups/assets";

// ITAM groups (hidden for initial deployment)
import {
  cmdbGroup,
  serviceManagementGroup,
  maintenanceGroup,
} from "./navigation-groups/itam";

// Compliance & documentation groups (hidden for initial deployment)
import {
  contractsGroup,
  licensesGroup,
  governanceGroup,
  attachmentsGroup,
} from "./navigation-groups/compliance";

// Foundation layer groups (hidden for initial deployment)
import {
  lifecycleGroup,
  organizationGroup,
  configurationGroup,
} from "./navigation-groups/foundation";

// System & administration groups
import {
  systemSettingsGroup,
  adminGroup,
  documentationGroup,
} from "./navigation-groups/system";

// ============================================================================
// Aggregate Navigation Groups
// ============================================================================

/**
 * All navigation groups in display order
 * Organized into logical sections for better user experience
 *
 * For initial deployment, simplified to 3 active groups:
 * 1. Main (Dashboard, Data Import)
 * 2. Setup (entities in dependency order)
 * 3. Admin (Stock Movements, Admin Dashboard, Feature Flags)
 *
 * Other groups remain in array for future use but are hidden via visible: false
 */
export const navGroups = [
  // Core navigation (always visible)
  mainNavGroup,

  // Setup - consolidated group for initial deployment
  setupGroup,

  // Admin group
  adminGroup,

  // Hidden groups (visible: false) - kept for future use
  assetManagementGroup,
  assetOperationsGroup,
  inventoryGroup,
  maintenanceGroup,
  cmdbGroup,
  serviceManagementGroup,
  contractsGroup,
  licensesGroup,
  governanceGroup,
  attachmentsGroup,
  lifecycleGroup,
  organizationGroup,
  configurationGroup,
  systemSettingsGroup,
  documentationGroup,
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
