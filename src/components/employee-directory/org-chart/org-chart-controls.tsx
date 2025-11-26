/**
 * OrgChartControls Component
 * Expand all, collapse all, and reset view buttons for the org chart
 */

"use client";

import { Maximize2, Minimize2, RotateCcw } from "lucide-react";
import { Panel } from "@xyflow/react";
import { Button } from "@/components/ui/button";

interface OrgChartControlsProps {
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onResetView: () => void;
}

export function OrgChartControls({
  onExpandAll,
  onCollapseAll,
  onResetView,
}: OrgChartControlsProps) {
  return (
    <Panel
      position="top-right"
      className="bg-background/95 dark:bg-background/95 flex items-center gap-1 rounded-lg border p-2 shadow-sm"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={onExpandAll}
        title="Expand All"
        aria-label="Expand all employee nodes"
        className="h-8 w-8 p-0 sm:h-8 sm:w-auto sm:px-3"
      >
        <Maximize2 className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only sm:ml-2">Expand</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onCollapseAll}
        title="Collapse All"
        aria-label="Collapse all employee nodes"
        className="h-8 w-8 p-0 sm:h-8 sm:w-auto sm:px-3"
      >
        <Minimize2 className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only sm:ml-2">Collapse</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onResetView}
        title="Reset View"
        aria-label="Reset org chart view to default"
        className="h-8 w-8 p-0 sm:h-8 sm:w-auto sm:px-3"
      >
        <RotateCcw className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only sm:ml-2">Reset</span>
      </Button>
    </Panel>
  );
}
