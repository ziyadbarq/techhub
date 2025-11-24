/**
 * Configuration Items Page
 */

import { ConfigurationItemsPageClient } from "@/components/configuration-items/configuration-items-page-client";
import { listConfigurationItemsAction } from "@/interface-adapters/controllers/configuration-item.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { requireFeature } from "@/lib/features/server";

export const dynamic = "force-dynamic";

export default async function ConfigurationItemsPage() {
  await requireFeature("CMDB");

  try {
    await requirePermission(PERMISSIONS.CONFIGURATION_ITEMS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/configuration-items");
    throw error;
  }

  const result = await listConfigurationItemsAction();
  const initialItems = result.success ? result.data : [];

  return <ConfigurationItemsPageClient initialItems={initialItems} />;
}
