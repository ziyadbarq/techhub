/**
 * Asset Detail Skeleton
 *
 * Route-level loading state for /assets/[assetTag]. Mirrors the real page
 * (header card, quick status cards, tab bar, overview cards) so nothing
 * jumps when the server data arrives.
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder for one quick status card's icon and three text lines. */
export function StatusCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

function FieldGridSkeleton({ rows }: { rows: number }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: rows * 2 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-4 w-32 max-w-full" />
        </div>
      ))}
    </div>
  );
}

export function AssetDetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading asset">
      {/* Header */}
      <div className="bg-card rounded-xl border p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-8 w-36" />
            <div className="flex gap-4">
              <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-3">
                  <Skeleton className="h-9 w-52" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-72 max-w-full" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {["w-40", "w-40", "w-32", "w-20", "w-24"].map((width, i) => (
              <Skeleton key={i} className={`h-8 ${width}`} />
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <StatusCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-muted flex w-fit max-w-full flex-wrap gap-2 rounded-lg p-1">
        {["w-24", "w-28", "w-28", "w-28", "w-28", "w-24"].map((width, i) => (
          <Skeleton key={i} className={`bg-background/70 h-8 ${width}`} />
        ))}
      </div>

      {/* Overview tab content */}
      <div className="grid gap-6 md:grid-cols-2">
        {[3, 3, 2, 2].map((rows, i) => (
          <Card key={i}>
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56 max-w-full" />
            </CardHeader>
            <CardContent>
              <FieldGridSkeleton rows={rows} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
