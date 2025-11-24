/**
 * Sidebar Spacer Component
 *
 * Provides spacing for main content area to prevent overlap with fixed sidebar.
 * Only visible on desktop (hidden on mobile where sidebar is overlay).
 *
 * Extracted from Sidebar.tsx (lines 373-380).
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SidebarSpacerProps {
  /** Whether the sidebar is collapsed */
  isCollapsed: boolean;
}

export const SidebarSpacer = React.memo(function SidebarSpacer({
  isCollapsed,
}: SidebarSpacerProps) {
  return (
    <div
      className={cn(
        "hidden transition-all duration-300 md:block",
        isCollapsed ? "w-16" : "w-64",
      )}
      aria-hidden="true"
    />
  );
});

SidebarSpacer.displayName = "SidebarSpacer";
