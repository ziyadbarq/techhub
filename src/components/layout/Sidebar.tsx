/**
 * Enhanced Professional Sidebar Navigation Component for Barq App
 *
 * Features:
 * - ✅ Responsive design (mobile hamburger, tablet auto-collapse, desktop full)
 * - ✅ Accessibility (ARIA landmarks, focus trap, keyboard navigation)
 * - ✅ Navigation groups with headers
 * - ✅ Collapsible navigation groups with state persistence
 * - ✅ Multi-level nested navigation (expandable children)
 * - ✅ Framer Motion animations (smooth, performant)
 * - ✅ Real-time badge updates (using useBadgeUpdates hook)
 * - ✅ Active route highlighting with barq yellow accent
 * - ✅ Section highlighting for nested routes
 * - ✅ Tooltips in collapsed state
 * - ✅ Badge indicators (visible in all states)
 * - ✅ Dark mode support
 * - ✅ State persistence with safe localStorage
 * - ✅ Keyboard shortcuts (Ctrl/Cmd+B to toggle, ESC to close mobile)
 * - ✅ Performance optimized (debounced resize, memoized navigation)
 * - ✅ Barq theme integration
 *
 * Refactored Architecture:
 * - Main component: Pure composition (~150 lines)
 * - Extracted hooks: use-sidebar-state, use-sidebar-keyboard, use-nav-item-state
 * - Extracted components: SidebarHeader, SidebarFooter, MobileControls, NavigationContent, SidebarSpacer
 * - Sub-components: NavigationGroup, CollapsibleGroupHeader, NestedNavItem, BadgePill (kept inline)
 *
 * Usage:
 * ```tsx
 * import { Sidebar } from "@/components/layout/Sidebar";
 *
 * export default function Layout({ children }) {
 *   return (
 *     <div className="flex h-screen">
 *       <Sidebar />
 *       <main className="flex-1 overflow-auto">{children}</main>
 *     </div>
 *   );
 * }
 * ```
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  isNavItemActive,
  isNavItemSection,
  hasChildren,
  type NavItem,
  type NavGroup,
} from "@/config/navigation";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { usePlatform, getModifierKey } from "@/hooks/use-platform";
import { useSidebarNavigation } from "@/hooks/use-sidebar-navigation";
import { useSidebarState } from "@/hooks/use-sidebar-state";
import { useSidebarKeyboard } from "@/hooks/use-sidebar-keyboard";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { SidebarFooter } from "./sidebar/SidebarFooter";
import { MobileControls } from "./sidebar/MobileControls";
import { NavigationContent, useScrollArea } from "./sidebar/NavigationContent";
import { SidebarSpacer } from "./sidebar/SidebarSpacer";
import { RolePreviewSwitcher } from "./sidebar/RolePreviewSwitcher";

interface SidebarProps {
  className?: string;
}

function SidebarComponent({ className }: SidebarProps) {
  const pathname = usePathname();
  const sidebarRef = React.useRef<HTMLElement>(null);
  const [mounted, setMounted] = React.useState(false);

  // Hooks for state management
  const {
    isCollapsed,
    isMobileOpen,
    toggleCollapse,
    toggleMobile,
    setIsMobileOpen,
  } = useSidebarState();

  const {
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
  } = useSidebarNavigation();

  // Detect client-side hydration for theme-dependent rendering
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Focus trap for mobile menu accessibility
  useFocusTrap(sidebarRef, isMobileOpen);

  // Platform detection for keyboard shortcuts (SSR-safe)
  const platform = usePlatform();
  const shortcutKey = getModifierKey(platform);

  // Keyboard shortcuts
  useSidebarKeyboard({
    isMobileOpen,
    onToggleCollapse: toggleCollapse,
    onCloseMobile: () => setIsMobileOpen(false),
  });

  return (
    <>
      {/* Mobile Controls: Button + Overlay */}
      <MobileControls
        isMobileOpen={isMobileOpen}
        onToggleMobile={toggleMobile}
      />

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        role="navigation"
        aria-label="Main navigation"
        className={cn(
          "bg-sidebar fixed top-0 left-0 z-40 flex h-screen flex-col border-r transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          className,
        )}
      >
        {/* Header: Logo + Collapse Button */}
        <SidebarHeader
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
          shortcutKey={shortcutKey}
          mounted={mounted}
        />

        {/* Navigation: Groups + Items */}
        <NavigationContent
          navGroups={navGroups}
          permissionsLoading={permissionsLoading}
          permissionsError={permissionsError}
          hasNoPermissions={hasNoPermissions}
          isCollapsed={isCollapsed}
          collapsedGroups={collapsedGroups}
          expandedItems={expandedItems}
          pathname={pathname ?? "/"}
          onToggleGroup={toggleGroup}
          onToggleItem={toggleItem}
          getBadgeValue={getBadgeValue}
          onItemClick={() => setIsMobileOpen(false)}
          NavigationGroupComponent={NavigationGroup}
          topContent={<RolePreviewSwitcher isCollapsed={isCollapsed} />}
          isManualToggling={isManualToggling}
        />

        {/* Footer: AI Branding */}
        <SidebarFooter isCollapsed={isCollapsed} />
      </aside>

      {/* Spacer for main content */}
      <SidebarSpacer isCollapsed={isCollapsed} />
    </>
  );
}

// Export memoized version for performance optimization
export const Sidebar = React.memo(SidebarComponent);
Sidebar.displayName = "Sidebar";

/**
 * ============================================================================
 * Sub-Components (Kept inline for now - can be extracted if needed)
 * ============================================================================
 */

/**
 * Collapsible Navigation Group Component
 */
interface NavigationGroupProps {
  group: NavGroup;
  isCollapsed: boolean;
  isGroupCollapsed: boolean;
  expandedItems: Record<string, boolean>;
  pathname: string;
  onToggleGroup: (groupId: string) => void;
  onToggleItem: (itemHref: string) => void;
  getBadgeValue: (item: NavItem) => string | undefined;
  onItemClick: () => void;
}

const NavigationGroup = React.memo(function NavigationGroup({
  group,
  isCollapsed,
  isGroupCollapsed,
  expandedItems,
  pathname,
  onToggleGroup,
  onToggleItem,
  getBadgeValue,
  onItemClick,
}: NavigationGroupProps) {
  const isExpanded = !isGroupCollapsed;

  return (
    <div className="space-y-1">
      {/* Group Header */}
      {!isCollapsed && (
        <CollapsibleGroupHeader
          group={group}
          isExpanded={isExpanded}
          onToggle={() => onToggleGroup(group.id)}
        />
      )}

      {/* Group Items */}
      <AnimatePresence initial={false}>
        {(isExpanded || !group.collapsible) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="space-y-1 overflow-hidden"
          >
            {group.items.map((item) => (
              <NestedNavItem
                key={item.href}
                item={item}
                isCollapsed={isCollapsed}
                isExpanded={expandedItems[item.href] ?? false}
                pathname={pathname}
                depth={0}
                onToggleItem={onToggleItem}
                getBadgeValue={getBadgeValue}
                onItemClick={onItemClick}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

/**
 * Collapsible Group Header Component
 */
interface CollapsibleGroupHeaderProps {
  group: NavGroup;
  isExpanded: boolean;
  onToggle: () => void;
}

const CollapsibleGroupHeader = React.memo(function CollapsibleGroupHeader({
  group,
  isExpanded,
  onToggle,
}: CollapsibleGroupHeaderProps) {
  if (!group.collapsible) {
    return (
      <h3 className="text-muted-foreground px-3 text-xs font-semibold tracking-wider whitespace-nowrap uppercase">
        {group.title}
      </h3>
    );
  }

  return (
    <button
      onClick={onToggle}
      className="text-muted-foreground hover:text-foreground flex w-full min-w-0 items-center gap-2 px-3 py-1 text-xs font-semibold tracking-wider uppercase transition-colors"
      aria-expanded={isExpanded}
      aria-label={`${isExpanded ? "Collapse" : "Expand"} ${group.title} group`}
    >
      <motion.div
        animate={{ rotate: isExpanded ? 0 : -90 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronDown className="h-3 w-3" />
      </motion.div>
      <span className="truncate whitespace-nowrap">{group.title}</span>
    </button>
  );
});

/**
 * Nested Navigation Item Component (Recursive)
 */
interface NestedNavItemProps {
  item: NavItem;
  isCollapsed: boolean;
  isExpanded: boolean;
  pathname: string;
  depth: number;
  onToggleItem: (itemHref: string) => void;
  getBadgeValue: (item: NavItem) => string | undefined;
  onItemClick: () => void;
}

const NestedNavItem = React.memo(function NestedNavItem({
  item,
  isCollapsed,
  isExpanded,
  pathname,
  depth,
  onToggleItem,
  getBadgeValue,
  onItemClick,
}: NestedNavItemProps) {
  const isActive = isNavItemActive(item.href, pathname);
  const isSection = isNavItemSection(item.href, pathname);
  const itemHasChildren = hasChildren(item);
  const badgeValue = getBadgeValue(item);
  const Icon = item.icon;
  const linkRef = React.useRef<HTMLAnchorElement>(null);
  const scrollArea = useScrollArea();
  const hasScrolledForPathnameRef = React.useRef<string | null>(null);

  const paddingLeft = depth > 0 ? `${depth * 1}rem` : undefined;

  // Check if this is an exact match or the most specific match
  const isExactOrBestMatch = isActive && !isSection;

  // Auto-scroll active link into view on pathname change (only if not manually toggling)
  React.useEffect(() => {
    // Skip if already scrolled for this pathname
    if (hasScrolledForPathnameRef.current === pathname) {
      return;
    }

    // Only scroll for exact matches or best matches (not parent sections)
    if (!isExactOrBestMatch || !scrollArea) {
      return;
    }

    // Mark as scrolled for this pathname
    hasScrolledForPathnameRef.current = pathname;

    // Wait for group auto-expand animations and DOM updates to complete
    const timer = setTimeout(() => {
      // Double-check all conditions at execution time
      if (
        linkRef.current &&
        scrollArea &&
        !scrollArea.isManualToggling &&
        hasScrolledForPathnameRef.current === pathname &&
        isExactOrBestMatch
      ) {
        scrollArea.scrollToActiveItem(linkRef.current);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [isExactOrBestMatch, isCollapsed, scrollArea, pathname]);

  const handleClick = (e: React.MouseEvent) => {
    if (itemHasChildren && !isCollapsed) {
      e.preventDefault();
      onToggleItem(item.href);
    } else {
      onItemClick();
    }
  };

  const navLink = (
    <Link
      ref={linkRef}
      href={item.href}
      onClick={handleClick}
      aria-current={isActive ? "page" : undefined}
      aria-expanded={itemHasChildren ? isExpanded : undefined}
      className={cn(
        "relative flex min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
        // Default state
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        // Active state - accent background with yellow border (exact match only)
        isActive &&
          !isSection &&
          "bg-sidebar-accent text-sidebar-accent-foreground border-barq-yellow border-l-3 font-semibold",
        // Section state - subtle highlight (parent of active route, or prefix match)
        isSection && "bg-sidebar-accent/50",
        // Collapsed state centering
        isCollapsed && "justify-center px-2",
        // Hover effects
        !(isActive && !isSection) && "hover:scale-[1.02] hover:shadow-sm",
      )}
      style={{
        paddingLeft: !isCollapsed && paddingLeft ? paddingLeft : undefined,
      }}
    >
      {/* Icon */}
      <Icon
        className="h-5 w-5 flex-shrink-0 transition-colors"
        aria-hidden="true"
      />

      {/* Title (expanded only) */}
      {!isCollapsed && (
        <span className="flex-1 truncate whitespace-nowrap">{item.title}</span>
      )}

      {/* Expand/Collapse Icon for items with children */}
      {!isCollapsed && itemHasChildren && (
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </motion.div>
      )}

      {/* Badge (expanded) */}
      {!isCollapsed && badgeValue && !itemHasChildren && (
        <BadgePill value={badgeValue} isActive={isActive} />
      )}

      {/* Badge Dot Indicator (collapsed) */}
      {isCollapsed && badgeValue && (
        <span
          className="bg-destructive absolute top-1 right-1 h-2 w-2 rounded-full"
          aria-label="Has notifications"
        />
      )}
    </Link>
  );

  const navItemWithTooltip = isCollapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>{navLink}</TooltipTrigger>
      <TooltipContent side="right" className="flex flex-col gap-1">
        <p className="font-medium">{item.title}</p>
        {item.description && (
          <p className="text-muted-foreground text-xs">{item.description}</p>
        )}
        {badgeValue && (
          <p className="text-destructive text-xs font-semibold">{badgeValue}</p>
        )}
      </TooltipContent>
    </Tooltip>
  ) : (
    navLink
  );

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        {navItemWithTooltip}
      </motion.div>

      {/* Nested Children */}
      {itemHasChildren && !isCollapsed && (
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="space-y-1 pt-1 pl-3">
                {item.children?.map((child) => (
                  <NestedNavItem
                    key={child.href}
                    item={child}
                    isCollapsed={isCollapsed}
                    isExpanded={false}
                    pathname={pathname}
                    depth={depth + 1}
                    onToggleItem={onToggleItem}
                    getBadgeValue={getBadgeValue}
                    onItemClick={onItemClick}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
});

/**
 * Badge Pill Component with Pulse Animation
 */
interface BadgePillProps {
  value: string;
  isActive: boolean;
}

const BadgePill = React.memo(function BadgePill({
  value,
  isActive,
}: BadgePillProps) {
  const [prevValue, setPrevValue] = React.useState(value);
  const [shouldPulse, setShouldPulse] = React.useState(false);

  // Detect value changes and trigger pulse animation
  React.useEffect(() => {
    if (value !== prevValue) {
      setShouldPulse(true);
      setPrevValue(value);
      const timer = setTimeout(() => setShouldPulse(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [value, prevValue]);

  return (
    <motion.span
      initial={false}
      animate={{
        scale: shouldPulse ? [1, 1.2, 1] : 1,
      }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-semibold",
        isActive
          ? "bg-barq-yellow text-barq-black"
          : "bg-sidebar-accent text-sidebar-accent-foreground",
      )}
      aria-label={`${value} notification`}
    >
      {value}
    </motion.span>
  );
});
