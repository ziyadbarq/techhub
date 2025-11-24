/**
 * Asset Assignments Page
 */

import { AssetAssignmentsPageClient } from "@/components/asset-assignments/asset-assignments-page-client";
import { listAssetAssignmentsAction } from "@/interface-adapters/controllers/asset-assignment.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function AssetAssignmentsPage() {
  try {
    await requirePermission(PERMISSIONS.ASSET_ASSIGNMENTS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/asset-assignments");
    throw error;
  }

  const result = await listAssetAssignmentsAction();
  const initialAssetAssignments = result.success ? result.data : [];

  return (
    <AssetAssignmentsPageClient
      initialAssetAssignments={initialAssetAssignments}
    />
  );
}
