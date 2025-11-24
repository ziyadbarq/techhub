/**
 * CI Classes Page
 */

import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { listCIClassesAction } from "@/interface-adapters/controllers/ci-class.controller";
import { CIClassesPageClient } from "@/components/ci-classes/ci-classes-page-client";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { requireFeature } from "@/lib/features/server";

export const dynamic = "force-dynamic";

export default async function CIClassesPage() {
  await requireFeature("CMDB");

  // Check permissions
  try {
    await requirePermission(PERMISSIONS.CI_CLASSES_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/ci-classes");
    throw error;
  }

  // Fetch initial data
  const result = await listCIClassesAction();
  const data = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      <CIClassesPageClient initialData={data} />
    </div>
  );
}
