/**
 * Header Skeleton
 * Loading placeholder for the header during initial render
 */

import { Skeleton } from "@/components/ui/skeleton";

export function HeaderSkeleton() {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 flex h-16 items-center gap-4 border-b px-4 backdrop-blur lg:px-6">
      {/* Mobile menu button placeholder */}
      <Skeleton className="h-9 w-9 lg:hidden" />

      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side actions skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    </header>
  );
}
