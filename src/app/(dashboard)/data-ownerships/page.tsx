/**
 * Data Ownerships Page
 */

import { DataOwnershipsPageClient } from "@/components/data-ownerships/data-ownerships-page-client";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export const dynamic = "force-dynamic";

export default async function DataOwnershipsPage() {
  await requirePermission(PERMISSIONS.DATA_OWNERSHIPS_VIEW);

  return <DataOwnershipsPageClient />;
}
