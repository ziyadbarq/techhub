/**
 * Relationship Types Page
 */

import { RelationshipTypesPageClient } from "@/components/relationship-types/relationship-types-page-client";
import { listRelationshipTypesAction } from "@/interface-adapters/controllers/relationship-type.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { requireFeature } from "@/lib/features/server";

export const dynamic = "force-dynamic";

export default async function RelationshipTypesPage() {
  await requireFeature("CMDB");

  try {
    await requirePermission(PERMISSIONS.RELATIONSHIP_TYPES_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/relationship-types");
    throw error;
  }

  const result = await listRelationshipTypesAction();
  const initialTypes = result.success ? result.data : [];

  return <RelationshipTypesPageClient initialTypes={initialTypes} />;
}
