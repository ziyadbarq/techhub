/**
 * Navigation Item State Hook
 *
 * Provides navigation item state utilities:
 * - Active route detection
 * - Section highlighting detection
 * - Badge value resolution
 * - Children detection
 *
 * Extracted from Sidebar.tsx NestedNavItem component for reusability.
 */

"use client";

import { useMemo } from "react";
import type { NavItem } from "@/config/navigation";
import {
  isNavItemActive,
  isNavItemSection,
  hasChildren,
} from "@/config/navigation";

interface UseNavItemStateProps {
  /** The navigation item */
  item: NavItem;
  /** Current pathname */
  pathname: string;
  /** Function to get badge value for an item */
  getBadgeValue: (item: NavItem) => string | undefined;
}

interface UseNavItemStateReturn {
  /** Whether this item is the active route */
  isActive: boolean;
  /** Whether this item is in the active section */
  isSection: boolean;
  /** Whether this item has children */
  itemHasChildren: boolean;
  /** Badge value for this item (if any) */
  badgeValue: string | undefined;
}

/**
 * Hook to determine navigation item state
 *
 * Features:
 * - Detects if item is the active route
 * - Detects if item is in the active section (parent of active route)
 * - Checks if item has children
 * - Resolves badge value from getBadgeValue function
 *
 * @param props - Configuration options
 * @returns Navigation item state
 */
export function useNavItemState({
  item,
  pathname,
  getBadgeValue,
}: UseNavItemStateProps): UseNavItemStateReturn {
  const isActive = useMemo(
    () => isNavItemActive(item.href, pathname),
    [item.href, pathname],
  );

  const isSection = useMemo(
    () => isNavItemSection(item.href, pathname),
    [item.href, pathname],
  );

  const itemHasChildren = useMemo(() => hasChildren(item), [item]);

  const badgeValue = useMemo(() => getBadgeValue(item), [item, getBadgeValue]);

  return {
    isActive,
    isSection,
    itemHasChildren,
    badgeValue,
  };
}
