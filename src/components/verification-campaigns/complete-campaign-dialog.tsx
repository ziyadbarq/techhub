/**
 * Complete Campaign Dialog
 */

"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { VerificationCampaignDTO } from "@/interface-adapters/presenters/verification-campaign.presenter";
import { completeVerificationCampaign } from "@/interface-adapters/controllers/verification-campaign.controller";
import { format } from "date-fns";

interface CompleteCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: VerificationCampaignDTO;
  onSuccess: () => void;
}

export function CompleteCampaignDialog({
  open,
  onOpenChange,
  campaign,
  onSuccess,
}: CompleteCampaignDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const result = await completeVerificationCampaign(campaign.id);

      if (result.success) {
        toast.success("Campaign completed successfully");
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to complete campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Campaign?</DialogTitle>
          <DialogDescription>
            Are you sure you want to mark this verification campaign as
            completed?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <p className="font-semibold">{campaign.name}</p>
            {campaign.description && (
              <p className="text-muted-foreground mt-1 text-sm">
                {campaign.description}
              </p>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Target Type:</span>
              <span className="font-medium">
                {campaign.targetType === "CI"
                  ? "Configuration Items"
                  : "Assets"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Started:</span>
              <span className="font-medium">
                {format(new Date(campaign.scheduledStart), "PPP")}
              </span>
            </div>
          </div>

          <div className="bg-muted rounded-md p-3">
            <p className="text-sm">
              Completing this campaign will mark it as finished and prevent
              further modifications. Verification items will remain in their
              current state. This action cannot be undone.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={isSubmitting}
            className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
          >
            {isSubmitting ? "Completing..." : "Complete Campaign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
