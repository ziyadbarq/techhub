/**
 * Mobile Controls Component
 *
 * Renders mobile menu button and overlay backdrop.
 * Only visible on mobile screens (< 768px).
 *
 * Extracted from Sidebar.tsx (lines 172-201).
 */

"use client";

import * as React from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MobileControlsProps {
  /** Whether the mobile menu is open */
  isMobileOpen: boolean;
  /** Callback to toggle mobile menu */
  onToggleMobile: () => void;
}

export const MobileControls = React.memo(function MobileControls({
  isMobileOpen,
  onToggleMobile,
}: MobileControlsProps) {
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
        onClick={onToggleMobile}
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
          onClick={onToggleMobile}
          aria-hidden="true"
        />
      )}
    </>
  );
});

MobileControls.displayName = "MobileControls";
