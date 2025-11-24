/**
 * Data Domains Page
 */

import { DataDomainsPageClient } from "@/components/data-domains/data-domains-page-client";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export const dynamic = "force-dynamic";

export default async function DataDomainsPage() {
  await requirePermission(PERMISSIONS.DATA_DOMAINS_VIEW);

  return <DataDomainsPageClient />;
}
