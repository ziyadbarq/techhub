/**
 * Reservation Detail Component
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
import type { AssetReservationDTO } from "@/interface-adapters/dtos/generated/asset-reservation.dto";
import {
  cancelReservationAction,
  startReservationAction,
  completeReservationAction,
} from "@/interface-adapters/controllers/asset-reservation.controller";
import { Play, CheckCircle2, X } from "lucide-react";
import { formatDate } from "@/lib/utils/date-format";

interface ReservationDetailProps {
  reservation: AssetReservationDTO;
  onClose: () => void;
  onSuccess: () => void;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
  CONFIRMED: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  ACTIVE: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  COMPLETED: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20",
  CANCELLED: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
};

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
    setIsSubmitting(true);
    try {
      const result = await cancelReservationAction(reservation.id);
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

  const canStart = reservation.status === "CONFIRMED";
  const canComplete = reservation.status === "ACTIVE";
  const canCancel =
    reservation.status === "PENDING" || reservation.status === "CONFIRMED";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Reservation Details</DialogTitle>
            <Badge
              variant="outline"
              className={statusColors[reservation.status] || ""}
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
              {reservation.reservedByPersonId && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground">Reserved By:</span>
                  <span className="col-span-2">
                    {reservation.personName || reservation.reservedByPersonId}
                  </span>
                </div>
              )}
              {reservation.reservedByOrgUnitId && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground">Org Unit:</span>
                  <span className="col-span-2">
                    {reservation.reservedByOrgUnitId}
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
            {canStart && (
              <Button
                onClick={handleStart}
                disabled={isSubmitting}
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
                className="gap-2 bg-green-600 text-white hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                Complete Reservation
              </Button>
            )}

            {canCancel && (
              <Button
                onClick={handleCancel}
                disabled={isSubmitting}
                variant="destructive"
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancel Reservation
              </Button>
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
