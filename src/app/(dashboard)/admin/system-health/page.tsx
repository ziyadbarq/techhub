/**
 * System Health Page
 * System health monitoring and diagnostics
 *
 * Features:
 * - System health dashboard
 * - System info display (DB size, counts)
 */

import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { SystemSetupDashboard } from "@/components/admin/system-setup/SystemSetupDashboard";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function AdminSystemHealthPage() {
  // Require SYSTEM_ADMIN permission (or create specific permission)
  // For now, we'll require USERS_MANAGE as a proxy for admin access
  try {
    await requirePermission(PERMISSIONS.USERS_MANAGE);
  } catch (error) {
    handlePermissionRedirect(error, "/admin/system-health");
    redirect("/unauthorized");
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
        <p className="text-muted-foreground mt-2">
          System health monitoring and diagnostics
        </p>
      </div>

      {/* Main Dashboard */}
      <SystemSetupDashboard />
    </div>
  );
}
