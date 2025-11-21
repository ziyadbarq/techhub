/**
 * Locations Page Client Component
 */

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { LocationDTO } from "@/interface-adapters/presenters/location.presenter";
import { listLocationsAction } from "@/interface-adapters/controllers/location.controller";
import { LocationsTable } from "./locations-table";
import { LocationForm } from "./location-form";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface LocationsPageClientProps {
  initialLocations: LocationDTO[];
}

export function LocationsPageClient({
  initialLocations,
}: LocationsPageClientProps) {
  const [locations, setLocations] = useState<LocationDTO[]>(initialLocations);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationDTO | null>(
    null,
  );

  const loadLocations = async () => {
    setIsLoading(true);
    try {
      const result = await listLocationsAction();
      if (result.success) {
        setLocations(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load locations");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Locations</h2>
          <p className="text-muted-foreground">
            {locations.length} location{locations.length !== 1 ? "s" : ""}
          </p>
        </div>
        <PermissionGuard permission={PERMISSIONS.LOCATIONS_CREATE}>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
          >
            <Plus className="h-4 w-4" />
            New Location
          </Button>
        </PermissionGuard>
      </div>

      <LocationsTable
        data={locations}
        loading={isLoading}
        onEdit={(location) => {
          setEditingLocation(location);
          setIsFormOpen(true);
        }}
        onRefresh={loadLocations}
      />
      <LocationForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingLocation(null);
        }}
        onSuccess={loadLocations}
        location={editingLocation}
      />
    </div>
  );
}
