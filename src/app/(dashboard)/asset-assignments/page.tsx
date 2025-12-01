/**
 * Asset Assignments Page
 */

import { AssetAssignmentsPageClient } from "@/components/asset-assignments/asset-assignments-page-client";
import { listAssetAssignmentsAction } from "@/interface-adapters/controllers/asset-assignment.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";

export const dynamic = "force-dynamic";

export default async function AssetAssignmentsPage() {
  await requireFeatureAndPermission(
    "ASSETS",
    PERMISSIONS.ASSET_ASSIGNMENTS_VIEW,
    "/asset-assignments",
  );

  const result = await listAssetAssignmentsAction();
  const initialAssetAssignments = result.success ? result.data : [];

  return (
    <AssetAssignmentsPageClient
      initialAssetAssignments={initialAssetAssignments}
    />
  );
}
