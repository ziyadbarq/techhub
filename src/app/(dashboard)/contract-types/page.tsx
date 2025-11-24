/**
 * Contract Types Page
 */

import { ContractTypesPageClient } from "@/components/contract-types/contract-types-page-client";
import { requirePermission } from "@/lib/permissions/server";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function ContractTypesPage() {
  await requireFeature("CONTRACTS");

  try {
    await requirePermission(PERMISSIONS.CONTRACT_TYPES_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/contract-types");
    throw error;
  }

  return <ContractTypesPageClient />;
}
