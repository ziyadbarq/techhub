/**
 * Attachments Page
 */

import { AttachmentsPageClient } from "@/components/attachments/attachments-page-client";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function AttachmentsPage() {
  try {
    await requirePermission(PERMISSIONS.ATTACHMENTS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/attachments");
    throw error;
  }

  return <AttachmentsPageClient />;
}
