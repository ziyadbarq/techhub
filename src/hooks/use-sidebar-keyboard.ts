/**
 * Sidebar Keyboard Shortcuts Hook
 *
 * Handles keyboard shortcuts for sidebar controls:
 * - Ctrl/Cmd+B: Toggle sidebar collapse
 * - ESC: Close mobile menu
 *
 * Extracted from Sidebar.tsx for better testability and reusability.
 */

"use client";

import { useEffect } from "react";

interface UseSidebarKeyboardProps {
  /** Whether the mobile menu is currently open */
  isMobileOpen: boolean;
  /** Callback to toggle sidebar collapse state */
  onToggleCollapse: () => void;
  /** Callback to close mobile menu */
  onCloseMobile: () => void;
}

/**
 * Hook to handle sidebar keyboard shortcuts
 *
 * Features:
 * - Ctrl/Cmd+B to toggle sidebar collapse (desktop)
 * - ESC to close mobile menu
 * - Properly prevents default browser behavior
 * - Cleans up event listeners on unmount
 *
 * @param props - Configuration options
 */
export function useSidebarKeyboard({
  isMobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: UseSidebarKeyboardProps): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + B to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        onToggleCollapse();
      }

      // ESC to close mobile menu
      if (e.key === "Escape" && isMobileOpen) {
        onCloseMobile();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen, onToggleCollapse, onCloseMobile]);
}
