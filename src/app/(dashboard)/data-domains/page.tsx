/**
 * Data Domains Page
 */

import { DataDomainsPageClient } from "@/components/data-domains/data-domains-page-client";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { requireFeature } from "@/lib/features/server";

export const dynamic = "force-dynamic";

export default async function DataDomainsPage() {
  await requireFeature("GOVERNANCE");

  try {
    await requirePermission(PERMISSIONS.DATA_DOMAINS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/data-domains");
    throw error;
  }

  return <DataDomainsPageClient />;
}
