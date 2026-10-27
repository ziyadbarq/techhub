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

/**
 * Context for providing scroll functionality to nested nav items
 */
interface ScrollAreaContextValue {
  scrollToActiveItem: (element: HTMLElement) => void;
  isManualToggling: boolean;
}

const ScrollAreaContext = React.createContext<ScrollAreaContextValue | null>(
  null,
);

export const useScrollArea = () => {
  const context = React.useContext(ScrollAreaContext);
  return context;
};

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
  /** Flag indicating if user is manually toggling groups/items */
  isManualToggling?: boolean;
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
  isManualToggling = false,
}: NavigationContentProps) {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const isManualTogglingRef = React.useRef(isManualToggling);

  // Keep ref in sync with prop
  React.useEffect(() => {
    isManualTogglingRef.current = isManualToggling;
  }, [isManualToggling]);

  // Expose scroll area ref to child components via context
  const scrollToActiveItem = React.useCallback((element: HTMLElement) => {
    // Check the ref to get current value
    if (isManualTogglingRef.current) {
      return;
    }

    if (!scrollAreaRef.current) return;

    // Find the viewport element (Radix ScrollArea structure)
    const viewport = scrollAreaRef.current.querySelector(
      "[data-radix-scroll-area-viewport]",
    );
    if (!viewport) return;

    // Calculate positions
    const viewportRect = viewport.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const scrollTop = viewport.scrollTop;

    // Already fully visible (e.g. the item the user just clicked): leave the
    // scroll position alone, otherwise the menu jumps under the cursor.
    if (
      elementRect.top >= viewportRect.top &&
      elementRect.bottom <= viewportRect.bottom
    ) {
      return;
    }

    // Calculate the center position
    const elementCenter = elementRect.top - viewportRect.top + scrollTop;
    const viewportCenter = viewport.clientHeight / 2;
    const scrollPosition =
      elementCenter - viewportCenter + elementRect.height / 2;

    // Smooth scroll to position
    viewport.scrollTo({
      top: Math.max(0, scrollPosition),
      behavior: "smooth",
    });
  }, []);

  const contextValue = React.useMemo(
    () => ({ scrollToActiveItem, isManualToggling }),
    [scrollToActiveItem, isManualToggling],
  );

  return (
    <ScrollAreaContext.Provider value={contextValue}>
      <ScrollArea
        ref={scrollAreaRef}
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
    </ScrollAreaContext.Provider>
  );
});

NavigationContent.displayName = "NavigationContent";
