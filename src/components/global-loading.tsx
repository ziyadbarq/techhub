"use client";

import { Loader2 } from "lucide-react";

export function GlobalLoading() {
  return (
    <div className="bg-muted/40 flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner with barq brand colors */}
        <div className="relative">
          <Loader2 className="text-primary h-12 w-12 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full bg-yellow-400" />
          </div>
        </div>

        {/* Loading text */}
        <p className="text-muted-foreground text-sm font-medium">
          Loading presentation...
        </p>
      </div>
    </div>
  );
}

/**
 * Minimal loading spinner for inline use
 */
export function InlineLoading({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 p-4">
      <Loader2 className="text-primary h-5 w-5 animate-spin" />
      {text && <span className="text-muted-foreground text-sm">{text}</span>}
    </div>
  );
}

/**
 * Skeleton loading for cards
 */
export function CardSkeleton() {
  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="space-y-3">
        <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
        <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
        <div className="bg-muted h-3 w-2/3 animate-pulse rounded" />
      </div>
    </div>
  );
}

/**
 * Grid of skeleton cards
 */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
