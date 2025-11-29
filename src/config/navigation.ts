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
import { itamGroup } from "./navigation-groups/setup";

// Asset-related groups
import { assetsInventoryGroup } from "./navigation-groups/assets";

// Services, CMDB, and maintenance
import { servicesCmdbGroup } from "./navigation-groups/itam";

// Compliance & extensions
import {
  licensesContractsGroup,
  governanceAttachmentsGroup,
} from "./navigation-groups/compliance";

// System & administration groups
import { adminSettingsGroup } from "./navigation-groups/system";

// ============================================================================
// Aggregate Navigation Groups
// ============================================================================

/**
 * All navigation groups in display order
 * Organized into logical sections for better user experience
 *
 * Groups are arranged to keep data entry and key workflows near the top:
 * 1. Main (Dashboard, Intune devices, Data Import)
 * 2. ITAM (foundation data entry)
 * 3. Assets & Inventory
 * 4. Services & CMDB
 * 5. Licenses & Contracts
 * 6. Governance & Attachments
 * 7. Admin & Settings
 */
export const navGroups = [
  // Core navigation (always visible)
  mainNavGroup,

  // ITAM data entry
  itamGroup,

  // Assets & inventory workflows
  assetsInventoryGroup,

  // Services, CMDB, and maintenance
  servicesCmdbGroup,

  // Licensing and contracts
  licensesContractsGroup,

  // Governance and attachments
  governanceAttachmentsGroup,

  // Administration and platform settings
  adminSettingsGroup,
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
