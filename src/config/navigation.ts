/**
 * Centralized Navigation Configuration
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
 * import { getVisibleNavGroups } from "@/config/navigation";
 * const navGroups = getVisibleNavGroups();
 * ```
 */

import {
  Home,
  CheckSquare,
  FileText,
  Users,
  Shield,
  Key,
  type LucideIcon,
} from "lucide-react";
import {
  PERMISSIONS,
  type PermissionKey,
} from "@/core/domain/value-objects/permission-key";

export interface NavItem {
  /** Display title for the navigation item */
  title: string;
  /** Route path */
  href: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Optional badge text (e.g., "New", "Beta", count) - use "dynamic" for real-time updates */
  badge?: string | "dynamic";
  /** Optional description for tooltips or accessibility */
  description?: string;
  /** Whether the item should be shown (feature flag) */
  visible?: boolean;
  /** Required permission to view this item */
  permission?: PermissionKey;
  /** Child navigation items (for nested navigation) */
  children?: NavItem[];
  /** Whether children are expanded by default */
  defaultExpanded?: boolean;
}

export interface NavGroup {
  /** Group identifier (required for managing state) */
  id: string;
  /** Group title/header */
  title: string;
  /** Navigation items in this group */
  items: NavItem[];
  /** Whether the group should be shown */
  visible?: boolean;
  /** Whether the group is collapsible */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
  /** Required permission to view this group */
  permission?: PermissionKey;
}

/**
 * Navigation groups configuration
 * Organize navigation items into logical sections with advanced features
 */
export const navGroups: NavGroup[] = [
  // Main navigation - Always visible
  {
    id: "main",
    title: "Main",
    items: [
      {
        title: "Dashboard",
        href: "/",
        icon: Home,
        description: "Overview and statistics",
        permission: PERMISSIONS.DASHBOARD_VIEW,
      },
      {
        title: "Tasks",
        href: "/tasks",
        icon: CheckSquare,
        description: "Manage your tasks",
        permission: PERMISSIONS.TASKS_VIEW,
      },
    ],
    visible: true,
    collapsible: false, // Always visible
  },

  // Admin Section - Permission-based, collapsible
  {
    id: "admin",
    title: "Administration",
    items: [
      {
        title: "Admin Dashboard",
        href: "/admin",
        icon: Shield,
        description: "Admin dashboard and settings",
        permission: PERMISSIONS.USERS_MANAGE,
        children: [
          {
            title: "Roles",
            href: "/admin/roles",
            icon: Shield,
            description: "Manage user roles",
            permission: PERMISSIONS.ROLES_VIEW,
          },
          {
            title: "Permissions",
            href: "/admin/permissions",
            icon: Key,
            description: "Manage permissions",
            permission: PERMISSIONS.PERMISSIONS_VIEW,
          },
          {
            title: "Users",
            href: "/admin/users",
            icon: Users,
            description: "Manage users",
            permission: PERMISSIONS.USERS_VIEW,
          },
          {
            title: "Audit Logs",
            href: "/admin/audit-logs",
            icon: FileText,
            description: "View audit logs",
            permission: PERMISSIONS.AUDIT_LOGS_VIEW,
          },
        ],
        defaultExpanded: false,
      },
    ],
    visible: true,
    collapsible: true,
    defaultCollapsed: false,
    permission: PERMISSIONS.USERS_MANAGE,
  },
];

/**
 * Check if item should be visible based on permissions
 * @param item - Navigation item to check
 * @param userPermissions - Array of user's permissions
 */
function checkItemPermission(
  item: NavItem,
  userPermissions: PermissionKey[],
): boolean {
  if (!item.permission) return true;
  return userPermissions.includes(item.permission);
}

/**
 * Check if group should be visible based on permissions
 * @param group - Navigation group to check
 * @param userPermissions - Array of user's permissions
 */
function checkGroupPermission(
  group: NavGroup,
  userPermissions: PermissionKey[],
): boolean {
  if (!group.permission) return true;
  return userPermissions.includes(group.permission);
}

/**
 * Filter items recursively based on visibility and permissions
 * @param items - Navigation items to filter
 * @param userPermissions - Array of user's permissions
 */
function filterItems(
  items: NavItem[],
  userPermissions: PermissionKey[],
): NavItem[] {
  return items
    .filter(
      (item) =>
        item.visible !== false && checkItemPermission(item, userPermissions),
    )
    .map((item) => {
      if (item.children) {
        const filteredChildren = filterItems(item.children, userPermissions);
        return {
          ...item,
          children: filteredChildren.length > 0 ? filteredChildren : undefined,
        };
      }
      return item;
    });
}

/**
 * Get visible navigation groups
 * Filters based on visibility, permissions, and removes empty groups
 * @param userPermissions - Array of user's permissions (optional - shows all if not provided)
 */
export const getVisibleNavGroups = (
  userPermissions: PermissionKey[] = [],
): NavGroup[] => {
  // If no permissions provided, show all navigation (for initial render or logged out state)
  if (userPermissions.length === 0) {
    return navGroups.filter((group) => group.visible !== false);
  }

  return navGroups
    .filter(
      (group) =>
        group.visible !== false && checkGroupPermission(group, userPermissions),
    )
    .map((group) => ({
      ...group,
      items: filterItems(group.items, userPermissions),
    }))
    .filter((group) => group.items.length > 0); // Remove empty groups
};

/**
 * Legacy flat navigation items (for backward compatibility)
 * Flattens all groups into a single array, excluding children
 */
export const navItems: NavItem[] = navGroups.flatMap((group) =>
  group.items.map((item) => {
    // Remove children to keep flat structure
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { children, ...flatItem } = item;
    return flatItem;
  }),
);

/**
 * Get all navigation items including nested children (recursive)
 */
function getAllItemsRecursive(items: NavItem[]): NavItem[] {
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
export const getAllNavItems = (): NavItem[] => {
  return navGroups.flatMap((group) => getAllItemsRecursive(group.items));
};

/**
 * Get visible navigation items (flat)
 * Filters out items where visible is explicitly set to false
 * @param userPermissions - Array of user's permissions (optional)
 */
export const getVisibleNavItems = (
  userPermissions: PermissionKey[] = [],
): NavItem[] => {
  if (userPermissions.length === 0) {
    return navItems.filter((item) => item.visible !== false);
  }
  return navItems.filter(
    (item) =>
      item.visible !== false && checkItemPermission(item, userPermissions),
  );
};

/**
 * Find navigation item by href (including nested items)
 */
export const getNavItemByHref = (href: string): NavItem | undefined => {
  return getAllNavItems().find((item) => item.href === href);
};

/**
 * Check if a path matches a navigation item
 * Handles both exact matches and path prefixes (e.g., /tasks matches /tasks/123)
 */
export const isNavItemActive = (
  navItemHref: string,
  currentPath: string,
): boolean => {
  // Exact match for home
  if (navItemHref === "/") {
    return currentPath === "/";
  }

  // For other routes, check if current path starts with nav item href
  return currentPath.startsWith(navItemHref);
};

/**
 * Check if a path is in the same section (parent route)
 * Used for section highlighting without exact match
 */
export const isNavItemSection = (
  navItemHref: string,
  currentPath: string,
): boolean => {
  // Don't highlight section for home
  if (navItemHref === "/") {
    return false;
  }

  // Check if in same section but not exact match
  return currentPath.startsWith(navItemHref) && currentPath !== navItemHref;
};

/**
 * Check if nav item has children
 */
export const hasChildren = (item: NavItem): boolean => {
  return !!item.children && item.children.length > 0;
};

/**
 * Get default collapsed state for a group
 */
export const getGroupDefaultState = (groupId: string): boolean => {
  const group = navGroups.find((g) => g.id === groupId);
  return group?.defaultCollapsed ?? false;
};

/**
 * Get default expanded state for an item
 */
export const getItemDefaultState = (itemHref: string): boolean => {
  const item = getNavItemByHref(itemHref);
  return item?.defaultExpanded ?? false;
};
