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
import {
  Menu,
  X,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getVisibleNavGroups,
  isNavItemActive,
  isNavItemSection,
  hasChildren,
  getGroupDefaultState,
  getItemDefaultState,
  type NavItem,
  type NavGroup,
} from "@/config/navigation";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useBadgeUpdates } from "@/hooks/use-badge-updates";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { usePlatform, getModifierKey } from "@/hooks/use-platform";
import { usePermissions } from "@/hooks/use-permissions";
import { debounce } from "@/lib/utils/debounce";

interface SidebarProps {
  className?: string;
}

/**
 * Initialize group collapsed states based on defaults
 */
function initializeGroupStates(groups: NavGroup[]): Record<string, boolean> {
  const states: Record<string, boolean> = {};
  groups.forEach((group) => {
    if (group.collapsible) {
      states[group.id] = getGroupDefaultState(group.id);
    }
  });
  return states;
}

/**
 * Initialize item expanded states based on defaults
 */
function initializeItemStates(groups: NavGroup[]): Record<string, boolean> {
  const states: Record<string, boolean> = {};

  const processItems = (items: NavItem[]) => {
    items.forEach((item) => {
      if (hasChildren(item)) {
        states[item.href] = getItemDefaultState(item.href);
        if (item.children) {
          processItems(item.children);
        }
      }
    });
  };

  groups.forEach((group) => processItems(group.items));
  return states;
}

function SidebarComponent({ className }: SidebarProps) {
  const pathname = usePathname();
  const sidebarRef = React.useRef<HTMLElement>(null);

  // State management with safe localStorage
  const [isCollapsed, setIsCollapsed] = useLocalStorage(
    "sidebar-collapsed",
    false,
  );
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  // Get user permissions
  const { permissions, isLoading: permissionsLoading } = usePermissions();

  // Get visible navigation groups (memoized, filtered by user permissions)
  const navGroups = React.useMemo(
    () => getVisibleNavGroups(permissions),
    [permissions],
  );

  // Initialize group and item states
  const [collapsedGroups, setCollapsedGroups] = useLocalStorage<
    Record<string, boolean>
  >("sidebar-groups-collapsed", initializeGroupStates(navGroups));

  const [expandedItems, setExpandedItems] = React.useState<
    Record<string, boolean>
  >(() => initializeItemStates(navGroups));

  // Real-time badge updates
  const badges = useBadgeUpdates();

  // Focus trap for mobile menu accessibility
  useFocusTrap(sidebarRef, isMobileOpen);

  // Platform detection for keyboard shortcuts (SSR-safe)
  const platform = usePlatform();
  const shortcutKey = getModifierKey(platform);

  // Auto-collapse on tablet screens (only if no user preference exists)
  React.useEffect(() => {
    // Check if user has set a preference
    const hasPreference = localStorage.getItem("sidebar-collapsed") !== null;

    if (!hasPreference) {
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      setIsCollapsed(isTablet);
    }

    // Debounced resize handler to prevent performance issues
    const handleResize = debounce(() => {
      const hasPreference = localStorage.getItem("sidebar-collapsed") !== null;
      if (!hasPreference) {
        const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
        setIsCollapsed(isTablet);
      }
    }, 150);

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      handleResize.cancel(); // Cancel any pending debounced calls
    };
  }, [setIsCollapsed]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + B to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        setIsCollapsed((prev) => !prev);
      }

      // ESC to close mobile menu
      if (e.key === "Escape" && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen, setIsCollapsed]);

  // Close mobile menu when route changes
  React.useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);
  const toggleMobile = () => setIsMobileOpen((prev) => !prev);

  // Toggle group collapsed state
  const toggleGroup = React.useCallback(
    (groupId: string) => {
      setCollapsedGroups((prev) => ({
        ...prev,
        [groupId]: !prev[groupId],
      }));
    },
    [setCollapsedGroups],
  );

  // Toggle item expanded state
  const toggleItem = React.useCallback((itemHref: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemHref]: !prev[itemHref],
    }));
  }, []);

  // Get badge value for an item
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

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "fixed top-4 z-50 h-12 w-12 transition-all duration-300 md:hidden",
          isMobileOpen ? "left-[232px]" : "left-4",
        )}
        onClick={toggleMobile}
        aria-label={isMobileOpen ? "Close menu" : "Open menu"}
        aria-expanded={isMobileOpen}
      >
        {isMobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
        <span className="sr-only">
          {isMobileOpen ? "Close menu" : "Open menu"}
        </span>
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={toggleMobile}
          aria-hidden="true"
        />
      )}

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
        {/* Header / Logo Area */}
        <div
          className="relative flex h-16 items-center border-b px-4"
          role="banner"
          aria-label="Site header"
        >
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hover:text-sidebar-accent-foreground flex items-center gap-2 font-semibold transition-colors"
              aria-label="Barq App Home"
            >
              <div className="bg-barq-yellow flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md dark:bg-white">
                <span className="text-barq-black text-lg font-bold">B</span>
              </div>
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.span
                    key="app-name"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden text-lg whitespace-nowrap"
                  >
                    Barq App
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </div>

          {/* Collapse Toggle Button (Desktop only) */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "border-border/40 hover:border-border hover:bg-sidebar-accent bg-background absolute top-1/2 z-[100] hidden -translate-y-1/2 border shadow-md transition-all duration-200 md:flex",
              isCollapsed ? "-right-4 size-7 rounded-full" : "right-2",
            )}
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isCollapsed}
            title={`${isCollapsed ? "Expand" : "Collapse"} sidebar (${shortcutKey}+B)`}
          >
            <ChevronLeft
              className={cn(
                "transition-transform duration-200",
                isCollapsed ? "h-3 w-3 rotate-180" : "h-4 w-4",
              )}
            />
            <span className="sr-only">
              {isCollapsed ? "Expand" : "Collapse"} sidebar
            </span>
          </Button>
        </div>

        {/* Navigation */}
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
            ) : (
              <TooltipProvider delayDuration={100}>
                {navGroups.map((group) => (
                  <NavigationGroup
                    key={group.id}
                    group={group}
                    isCollapsed={isCollapsed}
                    isGroupCollapsed={collapsedGroups[group.id] ?? false}
                    expandedItems={expandedItems}
                    pathname={pathname ?? "/"}
                    onToggleGroup={toggleGroup}
                    onToggleItem={toggleItem}
                    getBadgeValue={getBadgeValue}
                    onItemClick={() => setIsMobileOpen(false)}
                  />
                ))}
              </TooltipProvider>
            )}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div
          className="border-t p-4"
          role="contentinfo"
          aria-label="Site information"
        >
          <TooltipProvider>
            {!isCollapsed ? (
              <div className="space-y-2">
                <div className="bg-barq-light-blue/20 dark:bg-barq-light-blue/10 border-barq-light-blue/30 dark:border-barq-light-blue/20 hover:bg-barq-light-blue/30 dark:hover:bg-barq-light-blue/15 flex items-center gap-2.5 rounded-lg border p-2.5 transition-all">
                  <div className="bg-barq-yellow flex h-7 w-7 items-center justify-center rounded-md shadow-sm">
                    <Sparkles className="text-barq-black h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-xs font-medium">
                      Powered by
                    </p>
                    <p className="text-foreground text-sm font-bold">Barq AI</p>
                  </div>
                </div>
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex justify-center">
                    <div className="bg-barq-yellow flex h-7 w-7 items-center justify-center rounded-md shadow-sm transition-transform hover:scale-110">
                      <Sparkles className="text-barq-black h-4 w-4" />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="font-medium">Powered by Barq AI</p>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </aside>

      {/* Spacer for main content */}
      <div
        className={cn(
          "hidden transition-all duration-300 md:block",
          isCollapsed ? "w-16" : "w-64",
        )}
        aria-hidden="true"
      />
    </>
  );
}

// Export memoized version for performance optimization
export const Sidebar = React.memo(SidebarComponent);
Sidebar.displayName = "Sidebar";

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
      <h3 className="text-muted-foreground px-3 text-xs font-semibold tracking-wider uppercase">
        {group.title}
      </h3>
    );
  }

  return (
    <button
      onClick={onToggle}
      className="text-muted-foreground hover:text-foreground flex w-full items-center gap-2 px-3 py-1 text-xs font-semibold tracking-wider uppercase transition-colors"
      aria-expanded={isExpanded}
      aria-label={`${isExpanded ? "Collapse" : "Expand"} ${group.title} group`}
    >
      <motion.div
        animate={{ rotate: isExpanded ? 0 : -90 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronDown className="h-3 w-3" />
      </motion.div>
      <span>{group.title}</span>
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

  const paddingLeft = depth > 0 ? `${depth * 1}rem` : undefined;

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
      href={item.href}
      onClick={handleClick}
      aria-current={isActive ? "page" : undefined}
      aria-expanded={itemHasChildren ? isExpanded : undefined}
      className={cn(
        "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
        // Default state
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        // Active state - bold yellow accent with left border
        isActive &&
          "bg-barq-yellow/10 text-barq-yellow border-barq-yellow dark:bg-barq-yellow/20 border-l-3 font-semibold",
        // Section state - subtle highlight
        isSection && !isActive && "bg-sidebar-accent/50",
        // Collapsed state centering
        isCollapsed && "justify-center px-2",
        // Hover effects
        !isActive && "hover:scale-[1.02] hover:shadow-sm",
      )}
      style={{
        paddingLeft: !isCollapsed && paddingLeft ? paddingLeft : undefined,
      }}
    >
      {/* Icon */}
      <Icon
        className={cn(
          "h-5 w-5 flex-shrink-0 transition-colors",
          isActive && "text-barq-yellow",
        )}
        aria-hidden="true"
      />

      {/* Title (expanded only) */}
      {!isCollapsed && <span className="flex-1">{item.title}</span>}

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
