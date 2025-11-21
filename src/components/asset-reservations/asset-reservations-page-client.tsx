/**
 * Asset Reservations Page Client Component
 */

"use client";

import { useState } from "react";
import { Plus, Calendar } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AssetReservationDTO } from "@/interface-adapters/dtos/generated/asset-reservation.dto";
import { listReservationsAction } from "@/interface-adapters/controllers/asset-reservation.controller";
import { AssetReservationsTable } from "./asset-reservations-table";
import { ReservationForm } from "./reservation-form";
import { ReservationDetail } from "./reservation-detail";
import { AvailabilityChecker } from "./availability-checker";
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
            {reservations.length} reservation
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
              New Reservation
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="availability">Check Availability</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <AssetReservationsTable
            data={reservations}
            loading={isLoading}
            onView={handleView}
            onRefresh={handleSuccess}
          />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <div className="text-muted-foreground rounded-lg border p-8 text-center">
            Calendar view will be implemented here
          </div>
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          <AvailabilityChecker />
        </TabsContent>
      </Tabs>

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
