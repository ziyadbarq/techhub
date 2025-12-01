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

interface ConfigurationItemsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ConfigurationItemsPage({
  searchParams,
}: ConfigurationItemsPageProps) {
  await requireFeature("CMDB");

  try {
    await requirePermission(PERMISSIONS.CONFIGURATION_ITEMS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/configuration-items");
    throw error;
  }

  const result = await listConfigurationItemsAction();
  const initialItems = result.success ? result.data : [];

  const params = await searchParams;
  const getParam = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const initialViewState = {
    search: getParam("q") ?? "",
    criticality: getParam("criticality") ?? "all",
    environment: getParam("environment") ?? "all",
    owner: getParam("owner") ?? "all",
    assetLink: getParam("assetLink") ?? "all",
    density:
      (getParam("density") as "compact" | "comfortable" | null) ?? "compact",
  };

  return (
    <ConfigurationItemsPageClient
      initialItems={initialItems}
      initialViewState={initialViewState}
    />
  );
}
