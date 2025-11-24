/**
 * Contracts Page
 */

import { ContractsPageClient } from "@/components/contracts/contracts-page-client";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export const dynamic = "force-dynamic";

export default async function ContractsPage() {
  await requirePermission(PERMISSIONS.CONTRACTS_VIEW);

  return <ContractsPageClient />;
}
