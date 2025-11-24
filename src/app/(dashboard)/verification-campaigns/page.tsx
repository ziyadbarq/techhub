/**
 * Verification Campaigns Page
 */

import { VerificationCampaignsPageClient } from "@/components/verification-campaigns/verification-campaigns-page-client";
import { listVerificationCampaigns } from "@/interface-adapters/controllers/verification-campaign.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { requireFeature } from "@/lib/features/server";

export const dynamic = "force-dynamic";

export default async function VerificationCampaignsPage() {
  await requireFeature("GOVERNANCE");

  try {
    await requirePermission(PERMISSIONS.VERIFICATION_CAMPAIGNS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/verification-campaigns");
    throw error;
  }

  const result = await listVerificationCampaigns();
  const initialCampaigns = result.success ? result.data : [];

  return (
    <VerificationCampaignsPageClient initialCampaigns={initialCampaigns} />
  );
}
