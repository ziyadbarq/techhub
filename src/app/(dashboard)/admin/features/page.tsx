/**
 * Feature Flags Admin Page
 * Server component with permission check
 */

import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { FeaturesPageClient } from "@/components/features/features-page-client";

export const dynamic = "force-dynamic";

export default async function FeaturesPage() {
  try {
    await requirePermission(PERMISSIONS.FEATURE_FLAGS_MANAGE);
  } catch (error) {
    handlePermissionRedirect(error, "/admin/features");
    throw error;
  }

  return <FeaturesPageClient />;
}
