/**
 * Verification Campaigns Page
 */

import { VerificationCampaignsPageClient } from "@/components/verification-campaigns/verification-campaigns-page-client";
import { listVerificationCampaigns } from "@/interface-adapters/controllers/verification-campaign.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export const dynamic = "force-dynamic";

export default async function VerificationCampaignsPage() {
  await requirePermission(PERMISSIONS.VERIFICATION_CAMPAIGNS_VIEW);

  const result = await listVerificationCampaigns();
  const initialCampaigns = result.success ? result.data : [];

  return <VerificationCampaignsPageClient initialCampaigns={initialCampaigns} />;
}
