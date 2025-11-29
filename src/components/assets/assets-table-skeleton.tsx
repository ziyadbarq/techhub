"use client";

/**
 * Assets Table Skeleton
 *
 * Loading state for the assets table, matching the actual layout.
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AssetsTableSkeletonProps {
  rowCount?: number;
}

export function AssetsTableSkeleton({
  rowCount = 10,
}: AssetsTableSkeletonProps) {
  return (
    <Card>
      <CardHeader className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-64" /> {/* Search input */}
            <Skeleton className="h-9 w-28" /> {/* Column toggle */}
          </div>
          <Skeleton className="h-9 w-24" /> {/* Export button */}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-t">
          {/* Header Row */}
          <div className="bg-muted/50 flex items-center border-b px-4 py-3">
            <Skeleton className="mr-4 h-4 w-4" /> {/* Checkbox */}
            <Skeleton className="mr-8 h-4 w-24" /> {/* Asset Tag */}
            <Skeleton className="mr-8 h-4 w-20" /> {/* Category */}
            <Skeleton className="mr-8 h-4 w-28" /> {/* Model */}
            <Skeleton className="mr-8 h-4 w-20" /> {/* Location */}
            <Skeleton className="mr-8 h-4 w-16" /> {/* Status */}
            <Skeleton className="mr-8 h-4 w-20" /> {/* Purchase Date */}
            <Skeleton className="h-4 w-16" /> {/* Cost */}
          </div>

          {/* Data Rows */}
          {Array.from({ length: rowCount }).map((_, index) => (
            <div
              key={index}
              className="flex items-center border-b px-4 py-4 last:border-b-0"
            >
              <Skeleton className="mr-4 h-4 w-4" /> {/* Checkbox */}
              <Skeleton className="mr-8 h-4 w-20" /> {/* Asset Tag */}
              <Skeleton className="mr-8 h-4 w-24" /> {/* Category */}
              <Skeleton className="mr-8 h-4 w-32" /> {/* Model */}
              <Skeleton className="mr-8 h-4 w-24" /> {/* Location */}
              <Skeleton className="mr-8 h-4 w-20" /> {/* Status */}
              <Skeleton className="mr-8 h-4 w-24" /> {/* Purchase Date */}
              <Skeleton className="h-4 w-20" /> {/* Cost */}
            </div>
          ))}

          {/* Pagination Row */}
          <div className="flex items-center justify-between border-t px-4 py-3">
            <Skeleton className="h-4 w-32" /> {/* Showing X of Y */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-24" /> {/* Rows per page */}
              <Skeleton className="h-9 w-9" /> {/* Prev */}
              <Skeleton className="h-9 w-9" /> {/* Next */}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Full Page Skeleton including summary cards and toolbar
 */
export function AssetsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="mt-1 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar Skeleton */}
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-10 min-w-[250px] flex-1" /> {/* Search */}
        <Skeleton className="h-10 w-40" /> {/* Category */}
        <Skeleton className="h-10 w-32" /> {/* Status */}
        <Skeleton className="h-10 w-40" /> {/* Location */}
        <Skeleton className="h-10 w-32" /> {/* Vendor */}
      </div>

      {/* Table Skeleton */}
      <AssetsTableSkeleton />
    </div>
  );
}
