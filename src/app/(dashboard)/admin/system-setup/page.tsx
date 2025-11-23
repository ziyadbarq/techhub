/**
 * Admin System Setup Page
 * Post-installation system operations and diagnostics
 *
 * Features:
 * - System health dashboard
 * - System info display (DB size, counts)
 * - Database seeding controls
 * - Database reset (dev-only, danger zone)
 */

import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { SystemSetupDashboard } from "@/components/admin/system-setup/SystemSetupDashboard";

export const dynamic = "force-dynamic";

export default async function AdminSystemSetupPage() {
  // Require SYSTEM_ADMIN permission (or create specific permission)
  // For now, we'll require USERS_MANAGE as a proxy for admin access
  try {
    await requirePermission(PERMISSIONS.USERS_MANAGE);
  } catch {
    redirect("/unauthorized");
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Setup</h1>
        <p className="text-muted-foreground mt-2">
          System administration, diagnostics, and database operations
        </p>
      </div>

      {/* Main Dashboard */}
      <SystemSetupDashboard />
    </div>
  );
}
