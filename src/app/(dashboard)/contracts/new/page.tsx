/**
 * New Contract Page
 */

import { ContractForm } from "@/components/contracts/contract-form";
import { listContractTypes } from "@/interface-adapters/controllers/contract-type.controller";
import { listVendorsAction } from "@/interface-adapters/controllers/vendor.controller";
import { requireFeature } from "@/lib/features/server";
import { requirePermission } from "@/lib/permissions/server";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export const dynamic = "force-dynamic";

export default async function NewContractPage() {
  await requireFeature("CONTRACTS");

  try {
    await requirePermission(PERMISSIONS.CONTRACTS_CREATE);
  } catch (error) {
    handlePermissionRedirect(error, "/contracts/new");
    throw error;
  }

  const [contractTypesResult, vendorsResult] = await Promise.all([
    listContractTypes({ activeOnly: true }),
    listVendorsAction(),
  ]);

  return (
    <ContractForm
      contractTypes={
        contractTypesResult.success ? contractTypesResult.data : []
      }
      vendors={
        vendorsResult.success
          ? vendorsResult.data.filter((vendor) => vendor.isActive)
          : []
      }
    />
  );
}
