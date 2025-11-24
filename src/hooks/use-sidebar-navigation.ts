import * as React from "react";
import {
  getGroupDefaultState,
  getItemDefaultState,
  getVisibleNavGroups,
  hasChildren,
  type NavGroup,
  type NavItem,
} from "@/config/navigation";
import { useBadgeUpdates } from "./use-badge-updates";
import { useLocalStorage } from "./use-local-storage";
import { usePermissions } from "./use-permissions";
import { useFeatureFlags } from "./use-feature-flags";

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

export function useSidebarNavigation() {
  const {
    permissions,
    isLoading: permissionsLoading,
    isError: permissionsError,
    hasNoPermissions,
  } = usePermissions();

  const { enabledFeatures, isLoading: featuresLoading } = useFeatureFlags();

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

  const toggleGroup = React.useCallback(
    (groupId: string) => {
      setCollapsedGroups((prev) => ({
        ...prev,
        [groupId]: !prev[groupId],
      }));
    },
    [setCollapsedGroups],
  );

  const toggleItem = React.useCallback(
    (itemHref: string) => {
      setExpandedItems((prev) => ({
        ...buildItemStates(navGroups, prev),
        [itemHref]: !prev[itemHref],
      }));
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
  };
}
