/**
 * Widget Skeleton
 * Loading state component for dashboard widgets
 */

"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface WidgetSkeletonProps {
  /** Number of skeleton rows to display */
  rows?: number;
  /** Show a chart-like skeleton */
  showChart?: boolean;
  /** Custom height for the skeleton area */
  height?: string;
}

export function WidgetSkeleton({
  rows = 3,
  showChart = false,
  height,
}: WidgetSkeletonProps) {
  if (showChart) {
    return (
      <div className="space-y-3">
        <Skeleton className={`w-full ${height || "h-[200px]"}`} />
        <div className="flex justify-center gap-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Card skeleton for summary stat cards
 */
export function StatCardSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}
