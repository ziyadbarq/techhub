import { notFound } from "next/navigation";

import { ContractDetailClient } from "@/components/contracts/contract-detail-client";
import { getContract } from "@/interface-adapters/controllers/contract.controller";
import { requirePermission } from "@/lib/permissions/server";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

interface ContractDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContractDetailPage({
  params,
}: ContractDetailPageProps) {
  await requireFeature("CONTRACTS");

  try {
    await requirePermission(PERMISSIONS.CONTRACTS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/contracts");
    throw error;
  }

  const { id } = await params;
  const result = await getContract(id);

  if (!result.success) {
    notFound();
  }

  return <ContractDetailClient contract={result.data} />;
}
