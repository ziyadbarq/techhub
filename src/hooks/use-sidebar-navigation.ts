"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  getGroupDefaultState,
  getItemDefaultState,
  getVisibleNavGroups,
  hasChildren,
  isNavItemActive,
  type NavGroup,
  type NavItem,
} from "@/config/navigation";
import { useBadgeUpdates } from "./use-badge-updates";
import { useLocalStorage } from "./use-local-storage";
import { usePermissions } from "./use-permissions";
import { useFeatureFlagsContext } from "@/contexts/feature-flags-context";

type SidebarGroupState = Record<string, boolean>;
type SidebarItemState = Record<string, boolean>;

function buildGroupStates(
  groups: NavGroup[],
  prev: SidebarGroupState = {},
): SidebarGroupState {
  const next: SidebarGroupState = {};

  groups.forEach((group) => {
    if (!group.collapsible) return;

    if (typeof prev[group.id] === "boolean") {
      next[group.id] = prev[group.id];
    } else {
      next[group.id] = getGroupDefaultState(group.id);
    }
  });

  return next;
}

function collectExpandableItems(groups: NavGroup[]): NavItem[] {
  const items: NavItem[] = [];

  const visit = (navItems: NavItem[]) => {
    navItems.forEach((item) => {
      if (hasChildren(item) && item.children) {
        items.push(item);
        visit(item.children);
      }
    });
  };

  groups.forEach((group) => visit(group.items));
  return items;
}

function buildItemStates(
  groups: NavGroup[],
  prev: SidebarItemState = {},
): SidebarItemState {
  const next: SidebarItemState = {};
  const expandableItems = collectExpandableItems(groups);

  expandableItems.forEach((item) => {
    if (typeof prev[item.href] === "boolean") {
      next[item.href] = prev[item.href];
    } else {
      next[item.href] = getItemDefaultState(item.href);
    }
  });

  return next;
}

/**
 * Helper to find which group contains an active item
 */
function findGroupWithActiveItem(
  groups: NavGroup[],
  pathname: string,
): string | null {
  for (const group of groups) {
    const hasActiveItem = (items: NavItem[]): boolean => {
      return items.some((item) => {
        if (isNavItemActive(item.href, pathname)) return true;
        if (item.children) return hasActiveItem(item.children);
        return false;
      });
    };

    if (hasActiveItem(group.items)) {
      return group.id;
    }
  }
  return null;
}

export function useSidebarNavigation() {
  const pathname = usePathname();
  const {
    permissions,
    isLoading: permissionsLoading,
    isError: permissionsError,
    hasNoPermissions,
  } = usePermissions();

  const { enabledFeatures, isLoading: featuresLoading } =
    useFeatureFlagsContext();

  // Track if user is manually toggling (to disable auto-scroll)
  const [isManualToggling, setIsManualToggling] = React.useState(false);

  // Determine navigation visibility
  const navGroups = React.useMemo(() => {
    // If still loading permissions/features or error fetching, show nothing (keep loading state in UI)
    if (permissionsLoading || featuresLoading || permissionsError) {
      return [];
    }

    // If user has no permissions, show nothing (empty navigation)
    if (hasNoPermissions) {
      return [];
    }

    // Filter navigation by both permissions AND feature flags
    return getVisibleNavGroups(permissions, { enabledFeatures });
  }, [
    permissions,
    enabledFeatures,
    permissionsLoading,
    featuresLoading,
    permissionsError,
    hasNoPermissions,
  ]);

  const [collapsedGroups, setCollapsedGroups] =
    useLocalStorage<SidebarGroupState>(
      "sidebar-groups-collapsed",
      buildGroupStates(navGroups),
    );

  const [expandedItems, setExpandedItems] = React.useState<SidebarItemState>(
    () => buildItemStates(navGroups),
  );

  const badges = useBadgeUpdates();

  // Sync group/item state when navigation changes (e.g., permissions update)
  React.useEffect(() => {
    setCollapsedGroups((prev) => buildGroupStates(navGroups, prev));
    setExpandedItems((prev) => buildItemStates(navGroups, prev));
  }, [navGroups, setCollapsedGroups, setExpandedItems]);

  // Auto-expand group containing active page
  React.useEffect(() => {
    if (!pathname || navGroups.length === 0) return;

    const activeGroupId = findGroupWithActiveItem(navGroups, pathname);
    if (activeGroupId && collapsedGroups[activeGroupId]) {
      setCollapsedGroups((prev) => ({
        ...prev,
        [activeGroupId]: false,
      }));
    }
  }, [pathname, navGroups, collapsedGroups, setCollapsedGroups]);

  const toggleGroup = React.useCallback(
    (groupId: string) => {
      setIsManualToggling(true);
      setCollapsedGroups((prev) => ({
        ...prev,
        [groupId]: !prev[groupId],
      }));
      // Reset manual toggling flag after animation completes (500ms to be safe)
      setTimeout(() => setIsManualToggling(false), 500);
    },
    [setCollapsedGroups],
  );

  const toggleItem = React.useCallback(
    (itemHref: string) => {
      setIsManualToggling(true);
      setExpandedItems((prev) => ({
        ...buildItemStates(navGroups, prev),
        [itemHref]: !prev[itemHref],
      }));
      // Reset manual toggling flag after animation completes (500ms to be safe)
      setTimeout(() => setIsManualToggling(false), 500);
    },
    [navGroups],
  );

  const getBadgeValue = React.useCallback(
    (item: NavItem): string | undefined => {
      if (!item.badge) return undefined;
      if (item.badge === "dynamic") {
        return badges[item.href];
      }
      return item.badge;
    },
    [badges],
  );

  return {
    navGroups,
    permissionsLoading,
    permissionsError,
    hasNoPermissions,
    collapsedGroups,
    expandedItems,
    toggleGroup,
    toggleItem,
    getBadgeValue,
    isManualToggling,
  };
}
