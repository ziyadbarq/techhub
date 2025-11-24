/**
 * Navigation Type Definitions
 *
 * Type definitions for the navigation system.
 * Separated from implementation for better maintainability and reusability.
 */

import type { LucideIcon } from "lucide-react";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";

/**
 * Navigation Item
 * Represents a single navigation link with optional nesting support
 */
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
  /** Required feature flag to view this item */
  featureFlag?: string;
  /** Child navigation items (for nested navigation) */
  children?: NavItem[];
  /** Whether children are expanded by default */
  defaultExpanded?: boolean;
}

/**
 * Navigation Group
 * Represents a logical grouping of navigation items with optional collapse functionality
 */
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
 * Navigation Permission Checker Function Type
 * Used for custom permission checking logic
 */
export type NavigationPermissionChecker = (
  item: NavItem,
  userPermissions: PermissionKey[],
  enabledFeatures?: Set<string>,
) => boolean;

/**
 * Navigation Filter Options
 * Configuration options for filtering navigation items
 */
export interface NavigationFilterOptions {
  /** If true, shows all navigation (for unauthenticated/loading state) */
  showUnauthenticated?: boolean;
  /** Set of enabled feature names (for feature flag filtering) */
  enabledFeatures?: Set<string>;
}
