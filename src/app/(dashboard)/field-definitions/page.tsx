/**
 * Field Definitions Page
 */

import { FieldDefinitionsPageClient } from "@/components/field-definitions/field-definitions-page-client";
import { listFieldDefinitionsAction } from "@/interface-adapters/controllers/field-definition.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";

export const dynamic = "force-dynamic";

export default async function FieldDefinitionsPage() {
  await requireFeatureAndPermission(
    "FOUNDATION",
    PERMISSIONS.FIELD_DEFINITIONS_VIEW,
    "/field-definitions",
  );

  const result = await listFieldDefinitionsAction();
  const initialFields = result.success ? result.data : [];

  return <FieldDefinitionsPageClient initialFields={initialFields} />;
}
