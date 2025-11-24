/**
 * Attachment Types Page
 */

import { AttachmentTypesPageClient } from "@/components/attachment-types/attachment-types-page-client";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function AttachmentTypesPage() {
  try {
    await requirePermission(PERMISSIONS.ATTACHMENT_TYPES_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/attachment-types");
    throw error;
  }

  return <AttachmentTypesPageClient />;
}
