/**
 * Asset Dashboard Page
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import { AssetDashboardClient } from "@/components/dashboard/asset-dashboard-client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Asset Dashboard",
  description: "Asset management dashboard with statistics and reports",
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-2">
              <div className="bg-muted h-4 w-24 animate-pulse rounded" />
              <div className="bg-muted h-8 w-16 animate-pulse rounded" />
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="bg-muted h-6 w-32 animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="bg-muted h-64 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity Skeleton */}
      <Card>
        <CardHeader>
          <div className="bg-muted h-6 w-40 animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-muted h-16 animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AssetDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Asset Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your asset inventory and recent activity
        </p>
      </div>

      {/* Dashboard Content */}
      <Suspense fallback={<LoadingSkeleton />}>
        <AssetDashboardClient />
      </Suspense>
    </div>
  );
}
