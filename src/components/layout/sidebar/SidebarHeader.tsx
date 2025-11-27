/**
 * Sidebar Header Component
 *
 * Displays the application logo, branding, and collapse toggle button.
 * Handles responsive visibility and animations.
 *
 * Extracted from Sidebar.tsx (lines 216-284).
 */

"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { BRANDING } from "@/config/branding";
import { Button } from "@/components/ui/button";

interface SidebarHeaderProps {
  /** Whether the sidebar is collapsed */
  isCollapsed: boolean;
  /** Callback to toggle collapse state */
  onToggleCollapse: () => void;
  /** Keyboard shortcut key (Ctrl or Cmd) */
  shortcutKey: string;
  /** Whether client has mounted (for SSR-safe theme) */
  mounted: boolean;
}

export const SidebarHeader = React.memo(function SidebarHeader({
  isCollapsed,
  onToggleCollapse,
  shortcutKey,
  mounted,
}: SidebarHeaderProps) {
  const { resolvedTheme } = useTheme();

  return (
    <div
      className="relative flex h-16 items-center border-b px-4"
      role="banner"
      aria-label="Site header"
    >
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="hover:text-sidebar-accent-foreground flex items-center gap-2 font-semibold transition-colors"
          aria-label={`${BRANDING.app.name} Dashboard`}
        >
          {/* Logo Icon */}
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
            {mounted ? (
              <Image
                src={BRANDING.logos.icon.default}
                alt={`${BRANDING.app.name} Logo`}
                width={32}
                height={32}
                className={cn(
                  "h-8 w-8 object-contain transition-all",
                  resolvedTheme === "dark" && "brightness-0 invert",
                )}
                priority
              />
            ) : (
              <div className="h-8 w-8" />
            )}
          </div>

          {/* App Name (animated) */}
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
                {BRANDING.app.name}
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
        onClick={onToggleCollapse}
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
  );
});

SidebarHeader.displayName = "SidebarHeader";
