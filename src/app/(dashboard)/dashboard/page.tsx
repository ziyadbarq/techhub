/**
 * Main Dashboard
 * Personal dashboard for employees with role-aware widgets
 */

import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { DashboardPageClient } from "@/components/dashboard/dashboard-page-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  try {
    await requirePermission(PERMISSIONS.DASHBOARD_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/dashboard");
    throw error;
  }

  return <DashboardPageClient />;
}
