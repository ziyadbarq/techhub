/**
 * Data Ownerships Page
 */

import { DataOwnershipsPageClient } from "@/components/data-ownerships/data-ownerships-page-client";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { requireFeature } from "@/lib/features/server";

export const dynamic = "force-dynamic";

export default async function DataOwnershipsPage() {
  await requireFeature("GOVERNANCE");

  try {
    await requirePermission(PERMISSIONS.DATA_OWNERSHIPS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/data-ownerships");
    throw error;
  }

  return <DataOwnershipsPageClient />;
}
