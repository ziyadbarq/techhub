/**
 * Configuration Items Page
 */

import { ConfigurationItemsPageClient } from "@/components/configuration-items/configuration-items-page-client";
import { listConfigurationItemsAction } from "@/interface-adapters/controllers/configuration-item.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export const dynamic = "force-dynamic";

export default async function ConfigurationItemsPage() {
  await requirePermission(PERMISSIONS.CONFIGURATION_ITEMS_VIEW);

  const result = await listConfigurationItemsAction();
  const initialItems = result.success ? result.data : [];

  return <ConfigurationItemsPageClient initialItems={initialItems} />;
}
