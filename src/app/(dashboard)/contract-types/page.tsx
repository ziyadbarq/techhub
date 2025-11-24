/**
 * Contract Types Page
 */

import { ContractTypesPageClient } from "@/components/contract-types/contract-types-page-client";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export const dynamic = "force-dynamic";

export default async function ContractTypesPage() {
  await requirePermission(PERMISSIONS.CONTRACT_TYPES_VIEW);

  return <ContractTypesPageClient />;
}
