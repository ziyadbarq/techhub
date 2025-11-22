/**
 * Verification Campaigns Page Client Component
 */

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { VerificationCampaignDTO } from "@/interface-adapters/presenters/verification-campaign.presenter";
import { listVerificationCampaigns } from "@/interface-adapters/controllers/verification-campaign.controller";
import { VerificationCampaignsTable } from "./verification-campaigns-table";
import { CreateVerificationCampaignDialog } from "./create-verification-campaign-dialog";
import { EditVerificationCampaignDialog } from "./edit-verification-campaign-dialog";
import { StartCampaignDialog } from "./start-campaign-dialog";
import { CompleteCampaignDialog } from "./complete-campaign-dialog";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface VerificationCampaignsPageClientProps {
  initialCampaigns: VerificationCampaignDTO[];
}

export function VerificationCampaignsPageClient({
  initialCampaigns,
}: VerificationCampaignsPageClientProps) {
  const [campaigns, setCampaigns] =
    useState<VerificationCampaignDTO[]>(initialCampaigns);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] =
    useState<VerificationCampaignDTO | null>(null);
  const [startingCampaign, setStartingCampaign] =
    useState<VerificationCampaignDTO | null>(null);
  const [completingCampaign, setCompletingCampaign] =
    useState<VerificationCampaignDTO | null>(null);

  const loadCampaigns = async () => {
    setIsLoading(true);
    try {
      const result = await listVerificationCampaigns();
      if (result.success) {
        setCampaigns(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load campaigns");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    loadCampaigns();
  };

  const handleEdit = (campaign: VerificationCampaignDTO) => {
    setEditingCampaign(campaign);
  };

  const handleStart = (campaign: VerificationCampaignDTO) => {
    setStartingCampaign(campaign);
  };

  const handleComplete = (campaign: VerificationCampaignDTO) => {
    setCompletingCampaign(campaign);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Verification Campaigns</h2>
          <p className="text-muted-foreground">
            {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <PermissionGuard permission={PERMISSIONS.VERIFICATION_CAMPAIGNS_CREATE}>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
            >
              <Plus className="h-4 w-4" />
              New Campaign
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Campaigns Table */}
      <VerificationCampaignsTable
        data={campaigns}
        loading={isLoading}
        onEdit={handleEdit}
        onStart={handleStart}
        onComplete={handleComplete}
        onRefresh={handleSuccess}
      />

      {/* Create Campaign Dialog */}
      <CreateVerificationCampaignDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={handleSuccess}
      />

      {/* Edit Campaign Dialog */}
      {editingCampaign && (
        <EditVerificationCampaignDialog
          open={!!editingCampaign}
          onOpenChange={(open) => !open && setEditingCampaign(null)}
          campaign={editingCampaign}
          onSuccess={handleSuccess}
        />
      )}

      {/* Start Campaign Dialog */}
      {startingCampaign && (
        <StartCampaignDialog
          open={!!startingCampaign}
          onOpenChange={(open) => !open && setStartingCampaign(null)}
          campaign={startingCampaign}
          onSuccess={handleSuccess}
        />
      )}

      {/* Complete Campaign Dialog */}
      {completingCampaign && (
        <CompleteCampaignDialog
          open={!!completingCampaign}
          onOpenChange={(open) => !open && setCompletingCampaign(null)}
          campaign={completingCampaign}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
