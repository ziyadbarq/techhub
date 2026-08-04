import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContractForm } from "@/components/contracts/contract-form";
import { getContract } from "@/interface-adapters/controllers/contract.controller";
import { requirePermission } from "@/lib/permissions/server";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

interface EditContractPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditContractPage({
  params,
}: EditContractPageProps) {
  await requireFeature("CONTRACTS");

  try {
    await requirePermission(PERMISSIONS.CONTRACTS_UPDATE);
  } catch (error) {
    handlePermissionRedirect(error, "/contracts");
    throw error;
  }

  const { id } = await params;
  const result = await getContract(id);

  if (!result.success) {
    notFound();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Contract</CardTitle>
      </CardHeader>
      <CardContent>
        <ContractForm contract={result.data} />
      </CardContent>
    </Card>
  );
}
