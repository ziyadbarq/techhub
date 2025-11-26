/**
 * OrgChartToolbar Component
 * Highlight search and stats display for the org chart
 * Note: Main filtering (department, location) is handled by the parent page
 */

"use client";

import { Search, Users } from "lucide-react";
import { Panel } from "@xyflow/react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface OrgChartToolbarProps {
  /** Search query for highlighting nodes (not filtering) */
  searchQuery: string;
  onSearchChange: (value: string) => void;
  /** Total nodes currently displayed */
  nodeCount: number;
  /** Number of nodes matching the highlight search */
  highlightedCount: number;
}

export function OrgChartToolbar({
  searchQuery,
  onSearchChange,
  nodeCount,
  highlightedCount,
}: OrgChartToolbarProps) {
  return (
    <Panel
      position="top-left"
      className="bg-background/95 dark:bg-background/95 flex flex-col gap-2 rounded-lg border p-2 shadow-sm sm:gap-3 sm:p-4"
    >
      {/* Highlight search - finds and highlights nodes within current view */}
      <div className="flex items-center gap-2">
        <Search
          className="text-muted-foreground h-4 w-4 shrink-0"
          aria-hidden="true"
        />
        <Input
          placeholder="Highlight by name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 w-full text-sm sm:w-[180px]"
          aria-label="Highlight employees by name"
        />
      </div>

      {/* Stats */}
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Users className="h-4 w-4" aria-hidden="true" />
        <span>{nodeCount} shown</span>
        {highlightedCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {highlightedCount} found
          </Badge>
        )}
      </div>
    </Panel>
  );
}
