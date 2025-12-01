/**
 * Navigation Content Component
 *
 * Renders the main navigation content with loading, error, and empty states.
 * Delegates rendering of individual groups to NavigationGroup component.
 *
 * Extracted from Sidebar.tsx (lines 286-330).
 */

"use client";

import * as React from "react";
import type { NavGroup, NavItem } from "@/config/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider } from "@/components/ui/tooltip";

interface NavigationContentProps {
  /** Navigation groups to render */
  navGroups: NavGroup[];
  /** Whether permissions are loading */
  permissionsLoading: boolean;
  /** Whether there was a permissions error */
  permissionsError: boolean;
  /** Whether user has no permissions */
  hasNoPermissions: boolean;
  /** Whether sidebar is collapsed */
  isCollapsed: boolean;
  /** Collapsed state of groups */
  collapsedGroups: Record<string, boolean>;
  /** Expanded state of items */
  expandedItems: Record<string, boolean>;
  /** Current pathname */
  pathname: string;
  /** Callback to toggle group collapse */
  onToggleGroup: (groupId: string) => void;
  /** Callback to toggle item expand */
  onToggleItem: (itemHref: string) => void;
  /** Function to get badge value */
  getBadgeValue: (item: NavItem) => string | undefined;
  /** Callback when item is clicked (for mobile) */
  onItemClick: () => void;
  /** Navigation group component to render */
  NavigationGroupComponent: React.ComponentType<{
    group: NavGroup;
    isCollapsed: boolean;
    isGroupCollapsed: boolean;
    expandedItems: Record<string, boolean>;
    pathname: string;
    onToggleGroup: (groupId: string) => void;
    onToggleItem: (itemHref: string) => void;
    getBadgeValue: (item: NavItem) => string | undefined;
    onItemClick: () => void;
  }>;
  /** Optional content rendered above navigation groups */
  topContent?: React.ReactNode;
}

export const NavigationContent = React.memo(function NavigationContent({
  navGroups,
  permissionsLoading,
  permissionsError,
  hasNoPermissions,
  isCollapsed,
  collapsedGroups,
  expandedItems,
  pathname,
  onToggleGroup,
  onToggleItem,
  getBadgeValue,
  onItemClick,
  NavigationGroupComponent,
  topContent,
}: NavigationContentProps) {
  return (
    <ScrollArea
      className="flex-1 px-3 py-4"
      role="region"
      aria-label="Navigation menu"
    >
      <nav className="flex flex-col gap-6">
        {permissionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground text-sm">
              Loading navigation...
            </div>
          </div>
        ) : permissionsError ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground text-sm">
              Navigation unavailable. Please refresh or contact an admin.
            </div>
          </div>
        ) : hasNoPermissions ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground text-sm">
              No permissions assigned to your account yet.
            </div>
          </div>
        ) : (
          <TooltipProvider delayDuration={100}>
            {topContent}
            {navGroups.map((group) => (
              <NavigationGroupComponent
                key={group.id}
                group={group}
                isCollapsed={isCollapsed}
                isGroupCollapsed={collapsedGroups[group.id] ?? false}
                expandedItems={expandedItems}
                pathname={pathname}
                onToggleGroup={onToggleGroup}
                onToggleItem={onToggleItem}
                getBadgeValue={getBadgeValue}
                onItemClick={onItemClick}
              />
            ))}
          </TooltipProvider>
        )}
      </nav>
    </ScrollArea>
  );
});

NavigationContent.displayName = "NavigationContent";
