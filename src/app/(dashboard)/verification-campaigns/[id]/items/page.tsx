/**
 * Verification Campaign Items Page
 */

import { notFound } from "next/navigation";
import { VerificationCampaignItemsPageClient } from "@/components/verification-campaigns/verification-campaign-items-page-client";
import { getVerificationCampaign } from "@/interface-adapters/controllers/verification-campaign.controller";
import { listVerificationItems } from "@/interface-adapters/controllers/verification-item.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { requireFeature } from "@/lib/features/server";

export const dynamic = "force-dynamic";

interface VerificationCampaignItemsPageProps {
  params: Promise<{ id: string }>;
}

export default async function VerificationCampaignItemsPage({
  params,
}: VerificationCampaignItemsPageProps) {
  await requireFeature("GOVERNANCE");

  const { id } = await params;

  try {
    await requirePermission(PERMISSIONS.VERIFICATION_CAMPAIGNS_VIEW);
    await requirePermission(PERMISSIONS.VERIFICATION_ITEMS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, `/verification-campaigns/${id}/items`);
    throw error;
  }

  const [campaignResult, itemsResult] = await Promise.all([
    getVerificationCampaign(id),
    listVerificationItems({ campaignId: id }),
  ]);

  if (!campaignResult.success) {
    notFound();
  }

  return (
    <VerificationCampaignItemsPageClient
      campaign={campaignResult.data}
      initialItems={itemsResult.success ? itemsResult.data : []}
    />
  );
}
