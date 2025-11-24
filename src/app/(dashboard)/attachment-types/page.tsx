/**
 * Attachment Types Page
 */

import { AttachmentTypesPageClient } from "@/components/attachment-types/attachment-types-page-client";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export const dynamic = "force-dynamic";

export default async function AttachmentTypesPage() {
  await requirePermission(PERMISSIONS.ATTACHMENT_TYPES_VIEW);

  return <AttachmentTypesPageClient />;
}
