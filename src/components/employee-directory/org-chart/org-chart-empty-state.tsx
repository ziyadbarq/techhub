/**
 * OrgChartEmptyState Component
 * Loading, no employees, and no matches states for the org chart
 */

"use client";

import { Network } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface OrgChartEmptyStateProps {
  /** Whether there are employees in the system (just none matching filters) */
  hasEmployees: boolean;
  /** Current search query (optional) */
  searchQuery?: string;
  /** Callback to clear the search */
  onClearSearch?: () => void;
}

export function OrgChartEmptyState({
  hasEmployees,
  searchQuery,
  onClearSearch,
}: OrgChartEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="bg-muted mb-4 rounded-full p-4">
        <Network className="text-muted-foreground h-8 w-8" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">
        {hasEmployees ? "No matching employees" : "No employees found"}
      </h3>
      <p className="text-muted-foreground max-w-sm text-sm">
        {hasEmployees
          ? "Try adjusting your search query or department filter to find what you're looking for."
          : "There are no employees in the directory yet."}
      </p>
      {searchQuery && onClearSearch && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearSearch}
          className="mt-4"
        >
          Clear Search
        </Button>
      )}
    </div>
  );
}
