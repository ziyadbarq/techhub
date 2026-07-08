/**
 * Page Loading Skeleton
 *
 * Generic route-level loading state for dashboard list pages: page header,
 * a stats strip, and a table block. Used by route loading.tsx files so
 * navigation to force-dynamic pages shows immediate feedback instead of a
 * blank screen while server data loads.
 */

import { Skeleton } from "@/components/ui/skeleton";

export function PageLoadingSkeleton() {
  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>

      {/* Stats strip */}
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table block */}
      <div className="space-y-3 rounded-lg border p-4">
        <Skeleton className="h-8 w-full" />
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
