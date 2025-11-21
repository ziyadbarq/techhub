/**
 * Disposal Detail Component - Simplified Version
 */

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { AssetDisposalDTO } from "@/interface-adapters/dtos/generated/asset-disposal.dto";
import {
  startDisposalAction,
  completeDisposalAction,
  cancelDisposalAction,
} from "@/interface-adapters/controllers/asset-disposal.controller";
import { ApprovalWorkflow } from "./approval-workflow";
import { Play, X, CheckCircle2, FileText, Download } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

interface DisposalDetailProps {
  disposal: AssetDisposalDTO;
  onClose: () => void;
  onSuccess: () => void;
}

const statusColors: Record<string, string> = {
  PENDING_APPROVAL: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
  APPROVED: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  REJECTED: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
  IN_PROGRESS: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
  SANITIZED: "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20",
  COMPLETED: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  CANCELLED: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20",
};

export function DisposalDetail({
  disposal,
  onClose,
  onSuccess,
}: DisposalDetailProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStart = async () => {
    setIsSubmitting(true);
    try {
      const result = await startDisposalAction({
        disposalId: disposal.id,
      });
      if (result.success) {
        toast.success("Disposal started!");
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to start disposal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const result = await completeDisposalAction({
        disposalId: disposal.id,
        disposalDate: new Date(),
      });
      if (result.success) {
        toast.success("Disposal completed! Certificate generated.");
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to complete disposal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!cancellationReason.trim()) {
      toast.error("Please provide a cancellation reason");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await cancelDisposalAction({
        disposalId: disposal.id,
        cancellationReason,
      });
      if (result.success) {
        toast.success("Disposal cancelled");
        setShowCancelDialog(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to cancel disposal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canStart = disposal.status === "APPROVED";
  const canComplete = disposal.status === "SANITIZED";
  const canCancel =
    disposal.status === "PENDING_APPROVAL" ||
    disposal.status === "APPROVED" ||
    disposal.status === "IN_PROGRESS";

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Disposal Request Details</DialogTitle>
              <Badge
                variant="outline"
                className={statusColors[disposal.status] || ""}
              >
                {disposal.status.replace(/_/g, " ")}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="mb-3 text-lg font-semibold">Basic Information</h3>
              <div className="grid gap-3 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground">Asset ID:</span>
                  <span className="col-span-2 font-mono">
                    {disposal.assetId}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="col-span-2">{disposal.disposalType}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground">Method:</span>
                  <span className="col-span-2">{disposal.disposalMethod}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground">Reason:</span>
                  <span className="col-span-2">{disposal.reason}</span>
                </div>
                {disposal.estimatedValue !== null && (
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-muted-foreground">
                      Estimated Value:
                    </span>
                    <span className="col-span-2">
                      ${disposal.estimatedValue.toFixed(2)}
                    </span>
                  </div>
                )}
                {disposal.notes && (
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-muted-foreground">Notes:</span>
                    <span className="col-span-2">{disposal.notes}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Approval Workflow */}
            <ApprovalWorkflow disposalId={disposal.id} onSuccess={onSuccess} />

            <Separator />

            {/* Certificate */}
            {disposal.certificateNumber && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                  <FileText className="h-5 w-5" />
                  Certificate of Destruction
                </h3>
                <div className="bg-muted/50 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-lg font-semibold">
                        {disposal.certificateNumber}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Generated on{" "}
                        {disposal.certificateGeneratedAt
                          ? new Date(
                              disposal.certificateGeneratedAt,
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      Download Certificate
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {canStart && (
                <Button
                  onClick={handleStart}
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Start Disposal
                </Button>
              )}

              {canComplete && (
                <Button
                  onClick={handleComplete}
                  disabled={isSubmitting}
                  className="gap-2 bg-green-600 text-white hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Complete Disposal
                </Button>
              )}

              {canCancel && (
                <Button
                  onClick={() => setShowCancelDialog(true)}
                  disabled={isSubmitting}
                  variant="destructive"
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel Disposal
                </Button>
              )}

              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Disposal Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for cancelling this disposal request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Cancellation reason..."
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            className="min-h-24"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Request</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isSubmitting || !cancellationReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Cancelling..." : "Cancel Request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
