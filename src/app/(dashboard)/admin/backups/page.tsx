/**
 * Admin Backups Page
 * Standalone view for managing database backups.
 */

import { redirect } from "next/navigation";
import { DatabaseBackupsPanel } from "@/components/admin/system-setup/panels/DatabaseBackupsPanel";
import { requirePermission } from "@/lib/permissions/server";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export const dynamic = "force-dynamic";

export default async function AdminBackupsPage() {
  try {
    await requirePermission(PERMISSIONS.DATABASE_BACKUP);
  } catch (error) {
    handlePermissionRedirect(error, "/admin/backups");
    redirect("/unauthorized");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Database Backups</h1>
        <p className="text-muted-foreground mt-2">
          Create, monitor, download, and delete database backup archives.
        </p>
      </div>

      <DatabaseBackupsPanel />
    </div>
  );
}
