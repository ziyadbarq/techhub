/**
 * Sidebar State Management Hook
 *
 * Manages sidebar collapse and mobile menu state with:
 * - LocalStorage persistence for collapse state
 * - Responsive auto-collapse for tablet screens
 * - Mobile menu state management
 * - Auto-close mobile menu on route changes
 *
 * Extracted from Sidebar.tsx for better testability and reusability.
 */

"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLocalStorage } from "./use-local-storage";
import { debounce } from "@/lib/utils/debounce";

interface UseSidebarStateReturn {
  /** Whether the sidebar is collapsed (desktop) */
  isCollapsed: boolean;
  /** Whether the mobile menu is open */
  isMobileOpen: boolean;
  /** Toggle collapse state */
  toggleCollapse: () => void;
  /** Toggle mobile menu state */
  toggleMobile: () => void;
  /** Set collapsed state directly */
  setIsCollapsed: (value: boolean | ((prev: boolean) => boolean)) => void;
  /** Set mobile open state directly */
  setIsMobileOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
}

/**
 * Hook to manage sidebar collapse and mobile menu state
 *
 * Features:
 * - Persists collapse state to localStorage
 * - Auto-collapses on tablet screens (768-1024px) unless user has set a preference
 * - Closes mobile menu on route changes
 * - Debounced resize handling for performance
 *
 * @returns Sidebar state and control functions
 */
export function useSidebarState(): UseSidebarStateReturn {
  const pathname = usePathname();

  // State management with safe localStorage
  const [isCollapsed, setIsCollapsed] = useLocalStorage(
    "sidebar-collapsed",
    false,
  );
  const [isMobileOpen, setIsMobileOpen] = useLocalStorage(
    "sidebar-mobile-open",
    false,
  );

  // Auto-collapse on tablet screens (only if no user preference exists)
  useEffect(() => {
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

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname, setIsMobileOpen]);

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);
  const toggleMobile = () => setIsMobileOpen((prev) => !prev);

  return {
    isCollapsed,
    isMobileOpen,
    toggleCollapse,
    toggleMobile,
    setIsCollapsed,
    setIsMobileOpen,
  };
}
