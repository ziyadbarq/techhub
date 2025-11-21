/**
 * Asset Assignments Page
 */

import { AssetAssignmentsPageClient } from "@/components/asset-assignments/asset-assignments-page-client";
import { listAssetAssignmentsAction } from "@/interface-adapters/controllers/asset-assignment.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export const dynamic = "force-dynamic";

export default async function AssetAssignmentsPage() {
  await requirePermission(PERMISSIONS.ASSET_ASSIGNMENTS_VIEW);

  const result = await listAssetAssignmentsAction();
  const initialAssetAssignments = result.success ? result.data : [];

  return (
    <AssetAssignmentsPageClient
      initialAssetAssignments={initialAssetAssignments}
    />
  );
}
