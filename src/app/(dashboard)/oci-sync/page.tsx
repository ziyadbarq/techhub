/**
 * OCI Cloud Sync Page
 *
 * Server component for OCI cloud resource synchronization dashboard.
 */

import { requirePermission } from "@/lib/permissions/server";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requireFeature } from "@/lib/features/server";
import {
  getOciSyncLogsAction,
  getLatestOciSyncStatusAction,
} from "@/interface-adapters/controllers/oci-sync.controller";
import { OciSyncDashboard } from "@/components/oci-sync/oci-sync-dashboard";

export const dynamic = "force-dynamic";

export default async function OciSyncPage() {
  // Check feature flag first
  try {
    await requireFeature("OCI_SYNC");
  } catch {
    handlePermissionRedirect(
      new Error("OCI_SYNC feature is not enabled"),
      "/oci-sync",
    );
    throw new Error("OCI_SYNC feature is not enabled");
  }

  // Check permissions
  try {
    await requirePermission(PERMISSIONS.OCI_SYNC_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/oci-sync");
    throw error;
  }

  // Fetch initial data
  const [logsResult, statusResult] = await Promise.all([
    getOciSyncLogsAction(20),
    getLatestOciSyncStatusAction(),
  ]);

  return (
    <OciSyncDashboard
      initialLogs={logsResult.success ? logsResult.data : []}
      latestSync={statusResult.success ? statusResult.data : null}
    />
  );
}
