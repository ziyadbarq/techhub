/**
 * CI Relationships Page
 */

import { CIRelationshipsPageClient } from "@/components/ci-relationships/ci-relationships-page-client";
import { listCIRelationshipsAction } from "@/interface-adapters/controllers/ci-relationship.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function CIRelationshipsPage() {
  try {
    await requirePermission(PERMISSIONS.CI_RELATIONSHIPS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/ci-relationships");
    throw error;
  }

  const result = await listCIRelationshipsAction();
  const initialRelationships = result.success ? result.data : [];

  return (
    <CIRelationshipsPageClient initialRelationships={initialRelationships} />
  );
}
