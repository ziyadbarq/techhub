/**
 * Organization Units Page Client Component
 */

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { OrganizationUnitDTO } from "@/interface-adapters/presenters/organization-unit.presenter";
import { listOrganizationUnitsAction } from "@/interface-adapters/controllers/organization-unit.controller";
import { OrganizationUnitsTable } from "./organization-units-table";
import { OrganizationUnitForm } from "./organization-unit-form";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface OrganizationUnitsPageClientProps {
  initialUnits: OrganizationUnitDTO[];
}

export function OrganizationUnitsPageClient({
  initialUnits,
}: OrganizationUnitsPageClientProps) {
  const [units, setUnits] = useState<OrganizationUnitDTO[]>(initialUnits);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<OrganizationUnitDTO | null>(
    null,
  );

  const loadUnits = async () => {
    setIsLoading(true);
    try {
      const result = await listOrganizationUnitsAction();
      if (result.success) {
        setUnits(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load organization units");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Organization Units</h2>
          <p className="text-muted-foreground">
            {units.length} unit{units.length !== 1 ? "s" : ""}
          </p>
        </div>
        <PermissionGuard permission={PERMISSIONS.ORGANIZATION_UNITS_CREATE}>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
          >
            <Plus className="h-4 w-4" />
            New Unit
          </Button>
        </PermissionGuard>
      </div>

      <OrganizationUnitsTable
        data={units}
        loading={isLoading}
        onEdit={(unit) => {
          setEditingUnit(unit);
          setIsFormOpen(true);
        }}
        onRefresh={loadUnits}
      />
      <OrganizationUnitForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingUnit(null);
        }}
        onSuccess={loadUnits}
        unit={editingUnit}
      />
    </div>
  );
}
