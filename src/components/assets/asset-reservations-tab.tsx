/**
 * Asset Reservations Tab Component
 * Displays all reservations for this asset
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Calendar, User, Clock, AlertCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { AssetReservationDTO } from "@/interface-adapters/dtos/generated/asset-reservation.dto";
import { listReservationsByAssetAction } from "@/interface-adapters/controllers/asset-reservation.controller";

interface AssetReservationsTabProps {
  assetId: string;
}

const statusVariants: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  PENDING: "outline",
  CONFIRMED: "secondary",
  ACTIVE: "default",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

export function AssetReservationsTab({ assetId }: AssetReservationsTabProps) {
  const [reservations, setReservations] = useState<AssetReservationDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReservations = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listReservationsByAssetAction(assetId);
      if (result.success) {
        setReservations(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load reservations");
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    loadReservations();
  }, [assetId, loadReservations]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[200px] flex-col items-center justify-center">
          <Calendar className="text-muted-foreground mb-4 h-12 w-12" />
          <p className="text-muted-foreground">
            No reservations for this asset
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Reservation History</h3>
          <p className="text-muted-foreground text-sm">
            {reservations.length} reservation
            {reservations.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {reservations.map((reservation) => (
          <Card key={reservation.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="h-4 w-4" />
                    {reservation.purpose || "Reservation"}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {format(new Date(reservation.startDate), "MMM d, yyyy")}
                      {" → "}
                      {format(new Date(reservation.endDate), "MMM d, yyyy")}
                    </span>
                    {reservation.personName && (
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {reservation.personName}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <Badge
                  variant={statusVariants[reservation.status] || "outline"}
                >
                  {reservation.status}
                </Badge>
              </div>
            </CardHeader>
            {(reservation.notes || reservation.status === "CANCELLED") && (
              <CardContent>
                {reservation.notes && (
                  <p className="text-muted-foreground text-sm">
                    {reservation.notes}
                  </p>
                )}
                {reservation.status === "CANCELLED" && (
                  <div className="text-destructive mt-2 flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>This reservation was cancelled</span>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
