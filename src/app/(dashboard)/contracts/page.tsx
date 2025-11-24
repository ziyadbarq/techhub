/**
 * Contracts Page
 */

import { ContractsPageClient } from "@/components/contracts/contracts-page-client";
import { requirePermission } from "@/lib/permissions/server";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function ContractsPage() {
  // Feature flag check (system level)
  await requireFeature("CONTRACTS");

  // Permission check (user level)
  try {
    await requirePermission(PERMISSIONS.CONTRACTS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/contracts");
    throw error;
  }

  return <ContractsPageClient />;
}
