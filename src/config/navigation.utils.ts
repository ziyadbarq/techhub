/**
 * Navigation Utility Functions
 *
 * Pure functions for navigation filtering, permission checking, and state management.
 * Separated from data for better testability and reusability.
 */

import type { PermissionKey } from "@/core/domain/value-objects/permission-key";
import type {
  NavItem,
  NavGroup,
  NavigationFilterOptions,
} from "./navigation.types";

/**
 * Check if item should be visible based on permissions and feature flags
 * @param item - Navigation item to check
 * @param userPermissions - Array of user's permissions
 * @param enabledFeatures - Set of enabled feature names (optional)
 */
export function checkItemPermission(
  item: NavItem,
  userPermissions: PermissionKey[],
  enabledFeatures?: Set<string>,
): boolean {
  // Check permission (if specified)
  if (item.permission && !userPermissions.includes(item.permission)) {
    return false;
  }

  // Check feature flag (if specified and enabledFeatures provided)
  if (item.featureFlag && enabledFeatures) {
    if (!enabledFeatures.has(item.featureFlag)) {
      return false;
    }
  }

  return true;
}

/**
 * Check if group should be visible based on permissions
 * @param group - Navigation group to check
 * @param userPermissions - Array of user's permissions
 */
export function checkGroupPermission(
  group: NavGroup,
  userPermissions: PermissionKey[],
): boolean {
  if (!group.permission) return true;
  return userPermissions.includes(group.permission);
}

/**
 * Filter items recursively based on visibility, permissions, and feature flags
 * @param items - Navigation items to filter
 * @param userPermissions - Array of user's permissions
 * @param enabledFeatures - Set of enabled feature names (optional)
 */
export function filterItems(
  items: NavItem[],
  userPermissions: PermissionKey[],
  enabledFeatures?: Set<string>,
): NavItem[] {
  return items
    .filter(
      (item) =>
        item.visible !== false &&
        checkItemPermission(item, userPermissions, enabledFeatures),
    )
    .flatMap((item) => {
      if (item.children) {
        const filteredChildren = filterItems(
          item.children,
          userPermissions,
          enabledFeatures,
        );
        // Avoid a dropdown that has no visible children for this user's RBAC.
        return filteredChildren.length > 0
          ? [{ ...item, children: filteredChildren }]
          : [];
      }
      return [item];
    });
}

/**
 * Get visible navigation groups
 * Filters based on visibility, permissions, feature flags, and removes empty groups
 *
 * @param navGroups - All navigation groups
 * @param userPermissions - Array of user's permissions
 * @param options - Configuration options
 * @param options.showUnauthenticated - If true, shows all navigation (for unauthenticated/loading state)
 * @param options.enabledFeatures - Set of enabled feature names (for feature flag filtering)
 *
 * Behavior:
 * - If showUnauthenticated=true: Show all navigation (unauthenticated state)
 * - If userPermissions is empty array: Show nothing (user has no permissions)
 * - Otherwise: Filter by permissions and feature flags
 */
export function getVisibleNavGroups(
  navGroups: NavGroup[],
  userPermissions: PermissionKey[],
  options: NavigationFilterOptions = {},
): NavGroup[] {
  // If explicitly showing unauthenticated state, return all navigation
  if (options.showUnauthenticated) {
    return navGroups.filter((group) => group.visible !== false);
  }

  // If empty permissions array (user loaded but has no permissions), show nothing
  // This prevents "show everything" behavior for users with zero permissions
  if (userPermissions.length === 0) {
    return [];
  }

  // Filter by permissions and feature flags
  return navGroups
    .filter(
      (group) =>
        group.visible !== false && checkGroupPermission(group, userPermissions),
    )
    .map((group) => ({
      ...group,
      items: filterItems(group.items, userPermissions, options.enabledFeatures),
    }))
    .filter((group) => group.items.length > 0); // Remove empty groups
}

/**
 * Get all navigation items including nested children (recursive)
 */
export function getAllItemsRecursive(items: NavItem[]): NavItem[] {
  return items.flatMap((item) => {
    const { children, ...flatItem } = item;
    if (children) {
      return [flatItem, ...getAllItemsRecursive(children)];
    }
    return [flatItem];
  });
}

/**
 * Get all navigation items (flat, including nested children)
 */
export function getAllNavItems(navGroups: NavGroup[]): NavItem[] {
  return navGroups.flatMap((group) => getAllItemsRecursive(group.items));
}

/**
 * Get visible navigation items (flat)
 * Filters out items where visible is explicitly set to false
 *
 * @param navItems - All navigation items (flat)
 * @param userPermissions - Array of user's permissions
 * @param options - Configuration options
 * @param options.showUnauthenticated - If true, shows all navigation (for unauthenticated/loading state)
 */
export function getVisibleNavItems(
  navItems: NavItem[],
  userPermissions: PermissionKey[],
  options: NavigationFilterOptions = {},
): NavItem[] {
  if (options.showUnauthenticated) {
    return navItems.filter((item) => item.visible !== false);
  }

  if (userPermissions.length === 0) {
    return [];
  }

  return navItems.filter(
    (item) =>
      item.visible !== false &&
      checkItemPermission(item, userPermissions, options.enabledFeatures),
  );
}

/**
 * Find navigation item by href (including nested items)
 */
export function getNavItemByHref(
  navGroups: NavGroup[],
  href: string,
): NavItem | undefined {
  return getAllNavItems(navGroups).find((item) => item.href === href);
}

/**
 * Check if a path matches a navigation item
 * Handles both exact matches and path prefixes (e.g., /tasks matches /tasks/123)
 */
export function isNavItemActive(
  navItemHref: string,
  currentPath: string,
): boolean {
  // Exact match for home
  if (navItemHref === "/") {
    return currentPath === "/";
  }

  // Exact match
  if (currentPath === navItemHref) {
    return true;
  }

  // Check if current path is a sub-route of nav item href
  // Use path separator to avoid false matches (e.g., /admin shouldn't match /admin-tools)
  return currentPath.startsWith(navItemHref + "/");
}

/**
 * Check if a path is in the same section (parent route)
 * Used for section highlighting without exact match
 */
export function isNavItemSection(
  navItemHref: string,
  currentPath: string,
): boolean {
  // Don't highlight section for home
  if (navItemHref === "/") {
    return false;
  }

  // Check if in same section but not exact match
  return currentPath.startsWith(navItemHref) && currentPath !== navItemHref;
}

/**
 * Check if nav item has children
 */
export function hasChildren(item: NavItem): boolean {
  return !!item.children && item.children.length > 0;
}

/**
 * Get default collapsed state for a group
 */
export function getGroupDefaultState(
  navGroups: NavGroup[],
  groupId: string,
): boolean {
  const group = navGroups.find((g) => g.id === groupId);
  return group?.defaultCollapsed ?? false;
}

/**
 * Get default expanded state for an item
 */
export function getItemDefaultState(
  navGroups: NavGroup[],
  itemHref: string,
): boolean {
  const item = getNavItemByHref(navGroups, itemHref);
  return item?.defaultExpanded ?? false;
}
