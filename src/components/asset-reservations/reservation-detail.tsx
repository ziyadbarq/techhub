/**
 * Reservation Detail Component
 */

"use client";

import { useState } from "react";
import { reservationStatusColors } from "@/lib/utils/status-colors";
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
import type { AssetReservationDTO } from "@/interface-adapters/dtos/generated/asset-reservation.dto";
import {
  cancelReservationAction,
  startReservationAction,
  completeReservationAction,
} from "@/interface-adapters/controllers/asset-reservation.controller";
import { assignAssetToEmployeeAction } from "@/interface-adapters/controllers/asset-workflow.controller";
import { Play, CheckCircle2, X, UserPlus } from "lucide-react";
import { formatDate } from "@/lib/utils/date-format";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface ReservationDetailProps {
  reservation: AssetReservationDTO;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReservationDetail({
  reservation,
  onClose,
  onSuccess,
}: ReservationDetailProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStart = async () => {
    setIsSubmitting(true);
    try {
      const result = await startReservationAction(reservation.id);
      if (result.success) {
        toast.success("Reservation started!");
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to start reservation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const result = await completeReservationAction(reservation.id);
      if (result.success) {
        toast.success("Reservation completed!");
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to complete reservation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    // TODO: Add dialog to collect cancellation reason from user
    // For now, using placeholder reason
    setIsSubmitting(true);
    try {
      const result = await cancelReservationAction(
        reservation.id,
        "Cancelled by user", // Placeholder reason - cancelledById comes from server session
      );
      if (result.success) {
        toast.success("Reservation cancelled");
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to cancel reservation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignAsset = async () => {
    // Check if we have a person to assign to
    if (!reservation.reservedForPersonId) {
      toast.error("Cannot assign: No person specified for this reservation");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await assignAssetToEmployeeAction({
        assetId: reservation.assetId,
        personId: reservation.reservedForPersonId,
        stockLocationFromId: null, // Asset is being reserved, location will be set during assignment
        note: `Assigned from reservation: ${reservation.purpose || "N/A"}`,
      });

      if (result.success) {
        toast.success(
          `Asset assigned to ${reservation.personName}! Reservation automatically cancelled.`,
        );
        onClose();
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to assign asset");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canStart = reservation.status === "CONFIRMED";
  const canComplete = reservation.status === "ACTIVE";
  const canCancel =
    reservation.status === "PENDING" || reservation.status === "CONFIRMED";
  const canAssign =
    (reservation.status === "PENDING" ||
      reservation.status === "CONFIRMED" ||
      reservation.status === "ACTIVE") &&
    reservation.reservedForPersonId != null; // Can only assign to a person, not org unit

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Reservation Details</DialogTitle>
            <Badge
              variant="outline"
              className={reservationStatusColors[reservation.status] || ""}
            >
              {reservation.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Basic Information</h3>
            <div className="grid gap-3 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Asset:</span>
                <span className="col-span-2">
                  {reservation.assetTag || reservation.assetId}
                </span>
              </div>
              {reservation.reservedForPersonId && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground">Reserved For:</span>
                  <span className="col-span-2">
                    {reservation.personName || reservation.reservedForPersonId}
                  </span>
                </div>
              )}
              {reservation.reservedForOrgUnitId && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground">Org Unit:</span>
                  <span className="col-span-2">
                    {reservation.reservedForOrgUnitId}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Start Date:</span>
                <span className="col-span-2">
                  {formatDate(reservation.startDate)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">End Date:</span>
                <span className="col-span-2">
                  {formatDate(reservation.endDate)}
                </span>
              </div>
              {reservation.purpose && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground">Purpose:</span>
                  <span className="col-span-2">{reservation.purpose}</span>
                </div>
              )}
              {reservation.notes && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground">Notes:</span>
                  <span className="col-span-2">{reservation.notes}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {/* Primary action: Assign Asset (completes the pre-assignment workflow) */}
            {canAssign && (
              <PermissionGuard
                permission={PERMISSIONS.ASSET_ASSIGNMENTS_CREATE}
              >
                <Button
                  onClick={handleAssignAsset}
                  disabled={isSubmitting}
                  className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Assign Asset to {reservation.personName || "Employee"}
                </Button>
              </PermissionGuard>
            )}

            {/* Secondary actions: Reservation lifecycle states */}
            {canStart && (
              <Button
                onClick={handleStart}
                disabled={isSubmitting}
                variant="outline"
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Start Reservation
              </Button>
            )}

            {canComplete && (
              <Button
                onClick={handleComplete}
                disabled={isSubmitting}
                variant="outline"
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Complete Reservation
              </Button>
            )}

            {/* Cancel action */}
            {canCancel && (
              <PermissionGuard
                permission={PERMISSIONS.ASSET_RESERVATIONS_CANCEL}
              >
                <Button
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  variant="destructive"
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel Reservation
                </Button>
              </PermissionGuard>
            )}

            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
