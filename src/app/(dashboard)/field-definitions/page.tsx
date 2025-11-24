/**
 * Field Definitions Page
 */

import { FieldDefinitionsPageClient } from "@/components/field-definitions/field-definitions-page-client";
import { listFieldDefinitionsAction } from "@/interface-adapters/controllers/field-definition.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function FieldDefinitionsPage() {
  try {
    await requirePermission(PERMISSIONS.FIELD_DEFINITIONS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/field-definitions");
    throw error;
  }

  const result = await listFieldDefinitionsAction();
  const initialFields = result.success ? result.data : [];

  return <FieldDefinitionsPageClient initialFields={initialFields} />;
}
