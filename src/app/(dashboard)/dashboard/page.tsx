/**
 * Main Dashboard
 * Analytics dashboard with widgets, tracking, queues, and metrics
 */

import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricsCardsWidget } from "@/components/dashboard/widgets/metrics-cards-widget";
import { TaskQueueWidget } from "@/components/dashboard/widgets/task-queue-widget";
import { RecentActivityWidget } from "@/components/dashboard/widgets/recent-activity-widget";
import { QuickActionsWidget } from "@/components/dashboard/widgets/quick-actions-widget";
import { ExpiringWarrantiesWidget } from "@/components/warranties/expiring-warranties-widget";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  try {
    await requirePermission(PERMISSIONS.DASHBOARD_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/dashboard");
    throw error;
  }
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Monitor your assets, track maintenance, and manage inventory
        </p>
      </div>

      {/* Metrics Cards Row */}
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="bg-muted h-4 w-24 rounded" />
                </CardHeader>
                <CardContent>
                  <div className="bg-muted h-8 w-16 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <MetricsCardsWidget />
      </Suspense>

      {/* Main Dashboard Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - 2/3 width */}
        <div className="space-y-6 lg:col-span-2">
          {/* Task Queue */}
          <Suspense
            fallback={
              <Card>
                <CardHeader>
                  <CardTitle>Loading...</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted h-48 animate-pulse rounded" />
                </CardContent>
              </Card>
            }
          >
            <TaskQueueWidget />
          </Suspense>

          {/* Recent Activity */}
          <Suspense
            fallback={
              <Card>
                <CardHeader>
                  <CardTitle>Loading...</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted h-96 animate-pulse rounded" />
                </CardContent>
              </Card>
            }
          >
            <RecentActivityWidget />
          </Suspense>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <QuickActionsWidget />

          {/* Expiring Warranties */}
          <Suspense
            fallback={
              <Card>
                <CardHeader>
                  <CardTitle>Loading...</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted h-64 animate-pulse rounded" />
                </CardContent>
              </Card>
            }
          >
            <ExpiringWarrantiesWidget daysThreshold={30} maxItems={5} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
