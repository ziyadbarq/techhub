/**
 * Sidebar Skeleton
 * Loading placeholder for the sidebar during initial render
 */

import { Skeleton } from "@/components/ui/skeleton";

export function SidebarSkeleton() {
  return (
    <aside className="bg-background fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r lg:flex">
      {/* Header skeleton */}
      <div className="flex h-16 items-center border-b px-4">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="ml-3 h-5 w-24" />
      </div>

      {/* Navigation skeleton */}
      <div className="flex-1 space-y-4 overflow-hidden p-4">
        {/* Group 1 */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>

        {/* Group 2 */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>

        {/* Group 3 */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </div>
    </aside>
  );
}
