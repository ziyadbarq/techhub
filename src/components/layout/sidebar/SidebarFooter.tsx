/**
 * Sidebar Footer Component
 *
 * Displays "Powered by AI" branding with different layouts for expanded/collapsed states.
 * Shows full branding card when expanded, icon-only with tooltip when collapsed.
 *
 * Extracted from Sidebar.tsx (lines 332-370).
 */

"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { BRANDING } from "@/config/branding";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarFooterProps {
  /** Whether the sidebar is collapsed */
  isCollapsed: boolean;
}

export const SidebarFooter = React.memo(function SidebarFooter({
  isCollapsed,
}: SidebarFooterProps) {
  return (
    <div
      className="border-t p-4"
      role="contentinfo"
      aria-label="Site information"
    >
      <TooltipProvider>
        {!isCollapsed ? (
          // Expanded state: Full branding card
          <div className="space-y-2">
            <div className="bg-barq-light-blue/20 dark:bg-barq-light-blue/10 border-barq-light-blue/30 dark:border-barq-light-blue/20 hover:bg-barq-light-blue/30 dark:hover:bg-barq-light-blue/15 flex items-center gap-2.5 rounded-lg border p-2.5 transition-all">
              <div className="bg-barq-yellow flex h-7 w-7 items-center justify-center rounded-md shadow-sm">
                <Sparkles className="text-barq-black h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs font-medium">
                  Powered by
                </p>
                <p className="text-foreground text-sm font-bold">
                  {BRANDING.ai.name}
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Collapsed state: Icon with tooltip
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex justify-center">
                <div className="bg-barq-yellow flex h-7 w-7 items-center justify-center rounded-md shadow-sm transition-transform hover:scale-110">
                  <Sparkles className="text-barq-black h-4 w-4" />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-medium">{BRANDING.ai.tagline}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
});

SidebarFooter.displayName = "SidebarFooter";
