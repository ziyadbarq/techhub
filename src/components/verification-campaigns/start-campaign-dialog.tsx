/**
 * Start Campaign Dialog
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
import { startVerificationCampaign } from "@/interface-adapters/controllers/verification-campaign.controller";
import { format } from "date-fns";

interface StartCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: VerificationCampaignDTO;
  onSuccess: () => void;
}

export function StartCampaignDialog({
  open,
  onOpenChange,
  campaign,
  onSuccess,
}: StartCampaignDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStart = async () => {
    setIsSubmitting(true);
    try {
      const result = await startVerificationCampaign(campaign.id);

      if (result.success) {
        toast.success("Campaign started successfully");
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to start campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Campaign?</DialogTitle>
          <DialogDescription>
            Are you sure you want to start this verification campaign?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <p className="font-semibold">{campaign.name}</p>
            {campaign.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {campaign.description}
              </p>
            )}
          </div>

          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Target Type:</span>
              <span className="font-medium">
                {campaign.targetType === "CI"
                  ? "Configuration Items"
                  : "Assets"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Scheduled Start:</span>
              <span className="font-medium">
                {format(new Date(campaign.scheduledStart), "PPP")}
              </span>
            </div>
            {campaign.scheduledEnd && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scheduled End:</span>
                <span className="font-medium">
                  {format(new Date(campaign.scheduledEnd), "PPP")}
                </span>
              </div>
            )}
          </div>

          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm">
              Starting this campaign will activate it and make verification items
              available for review. This action cannot be undone.
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
            onClick={handleStart}
            disabled={isSubmitting}
            className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
          >
            {isSubmitting ? "Starting..." : "Start Campaign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
