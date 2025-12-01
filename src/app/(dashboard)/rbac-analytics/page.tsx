/**
 * RBAC Analytics Dashboard Page
 *
 * Comprehensive analytics dashboard for role-based access control.
 * Features:
 * - Role usage statistics with bar chart
 * - Orphaned roles table
 * - Permission usage statistics
 * - User role distribution pie chart
 * - Users with conflicts table
 */

import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";
import {
  getRoleUsageStatsAction,
  getPermissionUsageStatsAction,
  getUserRoleStatsAction,
} from "@/interface-adapters/controllers/rbac-analytics.controller";
import { AnalyticsDashboardClient } from "@/components/analytics/analytics-dashboard-client";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireFeatureAndPermission(
    "RBAC",
    PERMISSIONS.ROLES_VIEW,
    "/rbac-analytics",
  );

  // Fetch data on the server
  const [roleUsageResult, permissionUsageResult, userRoleStatsResult] =
    await Promise.all([
      getRoleUsageStatsAction(),
      getPermissionUsageStatsAction(),
      getUserRoleStatsAction(),
    ]);

  const roleUsageStats = roleUsageResult.success
    ? (roleUsageResult.data ?? [])
    : [];
  const permissionUsageStats = permissionUsageResult.success
    ? (permissionUsageResult.data ?? [])
    : [];
  const userRoleStats = userRoleStatsResult.success
    ? (userRoleStatsResult.data ?? null)
    : null;

  return (
    <PermissionGuard
      permission={PERMISSIONS.ROLES_VIEW}
      fallback={
        <div className="bg-background min-h-screen">
          <div className="container mx-auto max-w-7xl px-4 py-8">
            <div className="border-destructive bg-destructive/10 rounded-lg border p-6 text-center">
              <h1 className="text-destructive mb-2 text-2xl font-bold">
                Access Denied
              </h1>
              <p className="text-muted-foreground">
                You do not have permission to view analytics. Please contact
                your administrator.
              </p>
            </div>
          </div>
        </div>
      }
    >
      <div className="bg-background min-h-screen">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold">
              RBAC Analytics Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Comprehensive insights into role usage, permissions, and user
              assignments
            </p>
          </div>

          {/* Info Card */}
          <div className="bg-muted/50 mb-8 rounded-lg border p-6">
            <h2 className="mb-3 text-lg font-semibold">Analytics Features</h2>
            <div className="grid gap-4 text-sm md:grid-cols-3">
              <div>
                <h3 className="mb-2 font-medium">Role Insights</h3>
                <ul className="text-muted-foreground space-y-1">
                  <li>✓ Role usage distribution</li>
                  <li>✓ Orphaned role detection</li>
                  <li>✓ User assignment metrics</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-medium">Permission Analysis</h3>
                <ul className="text-muted-foreground space-y-1">
                  <li>✓ Most/least used permissions</li>
                  <li>✓ Unused permission tracking</li>
                  <li>✓ Role coverage metrics</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-medium">User Statistics</h3>
                <ul className="text-muted-foreground space-y-1">
                  <li>✓ Role distribution by user</li>
                  <li>✓ Conflict detection</li>
                  <li>✓ Multi-role assignments</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Analytics Dashboard */}
          <AnalyticsDashboardClient
            roleUsageStats={roleUsageStats}
            permissionUsageStats={permissionUsageStats}
            userRoleStats={userRoleStats}
          />

          {/* Footer */}
          <div className="text-muted-foreground mt-12 border-t pt-8 text-center text-sm">
            <p>Explore the analytics implementation:</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <code className="bg-muted rounded px-2 py-1">
                src/core/use-cases/rbac/analytics/
              </code>
              <code className="bg-muted rounded px-2 py-1">
                src/interface-adapters/controllers/rbac-analytics.controller.ts
              </code>
            </div>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
