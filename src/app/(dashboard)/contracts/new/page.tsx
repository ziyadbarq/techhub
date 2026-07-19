import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContractForm } from "@/components/contracts/contract-form";
import { requirePermission } from "@/lib/permissions/server";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function NewContractPage() {
  await requireFeature("CONTRACTS");

  try {
    await requirePermission(PERMISSIONS.CONTRACTS_CREATE);
  } catch (error) {
    handlePermissionRedirect(error, "/contracts");
    throw error;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Contract</CardTitle>
      </CardHeader>
      <CardContent>
        <ContractForm />
      </CardContent>
    </Card>
  );
}
