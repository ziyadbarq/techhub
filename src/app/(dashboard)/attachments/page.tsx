/**
 * Attachments Page
 */

import { AttachmentsPageClient } from "@/components/attachments/attachments-page-client";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export const dynamic = "force-dynamic";

export default async function AttachmentsPage() {
  await requirePermission(PERMISSIONS.ATTACHMENTS_VIEW);

  return <AttachmentsPageClient />;
}
