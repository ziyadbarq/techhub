/**
 * Asset Reservations Page Client Component
 */

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { AssetReservationDTO } from "@/interface-adapters/dtos/generated/asset-reservation.dto";
import { listReservationsAction } from "@/interface-adapters/controllers/asset-reservation.controller";
import { AssetReservationsTable } from "./asset-reservations-table";
import { ReservationForm } from "./reservation-form";
import { ReservationDetail } from "./reservation-detail";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface AssetReservationsPageClientProps {
  initialReservations: AssetReservationDTO[];
}

export function AssetReservationsPageClient({
  initialReservations,
}: AssetReservationsPageClientProps) {
  const [reservations, setReservations] =
    useState<AssetReservationDTO[]>(initialReservations);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<AssetReservationDTO | null>(null);

  const loadReservations = async () => {
    setIsLoading(true);
    try {
      const result = await listReservationsAction();
      if (result.success) {
        setReservations(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load reservations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (reservation: AssetReservationDTO) => {
    setSelectedReservation(reservation);
  };

  const handleSuccess = () => {
    loadReservations();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Asset Reservations</h2>
          <p className="text-muted-foreground">
            Pre-assignment holds for new hires - {reservations.length}{" "}
            reservation
            {reservations.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <PermissionGuard permission={PERMISSIONS.ASSET_RESERVATIONS_CREATE}>
            <Button
              onClick={() => setIsFormOpen(true)}
              className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
            >
              <Plus className="h-4 w-4" />
              Reserve Asset
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Reservations Table */}
      <AssetReservationsTable
        data={reservations}
        loading={isLoading}
        onView={handleView}
        onRefresh={handleSuccess}
      />

      {/* Reservation Form Dialog */}
      <ReservationForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleSuccess}
      />

      {/* Reservation Detail Dialog */}
      {selectedReservation && (
        <ReservationDetail
          reservation={selectedReservation}
          onClose={() => setSelectedReservation(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
