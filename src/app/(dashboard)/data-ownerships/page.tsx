"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataOwnershipsTable } from "@/components/data-ownerships/data-ownerships-table";
import { DataOwnershipForm } from "@/components/data-ownerships/data-ownership-form";
import type { DataOwnershipDTO } from "@/interface-adapters/presenters/data-ownership.presenter";
import type { DataDomainDTO } from "@/interface-adapters/presenters/data-domain.presenter";
import type { CIClassDTO } from "@/interface-adapters/presenters/ci-class.presenter";
import type { AssetCategoryDTO } from "@/interface-adapters/presenters/asset-category.presenter";
import type { PersonDTO } from "@/interface-adapters/presenters/person.presenter";
import type { OrganizationUnitDTO } from "@/interface-adapters/presenters/organization-unit.presenter";
import { listDataOwnerships } from "@/interface-adapters/controllers/data-ownership.controller";
import { listDataDomains } from "@/interface-adapters/controllers/data-domain.controller";
import { listCIClassesAction } from "@/interface-adapters/controllers/ci-class.controller";
import { listAssetCategoriesAction } from "@/interface-adapters/controllers/asset-category.controller";
import { listPersonsAction } from "@/interface-adapters/controllers/person.controller";
import { listOrganizationUnitsAction } from "@/interface-adapters/controllers/organization-unit.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";

export const dynamic = "force-dynamic";

export default function DataOwnershipsPage() {
  const [dataOwnerships, setDataOwnerships] = React.useState<
    DataOwnershipDTO[]
  >([]);
  const [dataDomains, setDataDomains] = React.useState<DataDomainDTO[]>([]);
  const [ciClasses, setCIClasses] = React.useState<CIClassDTO[]>([]);
  const [assetCategories, setAssetCategories] = React.useState<
    AssetCategoryDTO[]
  >([]);
  const [persons, setPersons] = React.useState<PersonDTO[]>([]);
  const [organizationUnits, setOrganizationUnits] = React.useState<
    OrganizationUnitDTO[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingDataOwnership, setEditingDataOwnership] =
    React.useState<DataOwnershipDTO | null>(null);

  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.DATA_OWNERSHIPS_CREATE);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      // Load all data in parallel
      const [
        ownershipsResult,
        domainsResult,
        ciClassesResult,
        categoriesResult,
        personsResult,
        orgUnitsResult,
      ] = await Promise.all([
        listDataOwnerships(),
        listDataDomains(),
        listCIClassesAction(),
        listAssetCategoriesAction(),
        listPersonsAction(),
        listOrganizationUnitsAction(),
      ]);

      if (ownershipsResult.success) {
        setDataOwnerships(ownershipsResult.data);
      }
      if (domainsResult.success) {
        setDataDomains(domainsResult.data);
      }
      if (ciClassesResult.success) {
        setCIClasses(ciClassesResult.data);
      }
      if (categoriesResult.success) {
        setAssetCategories(categoriesResult.data);
      }
      if (personsResult.success) {
        setPersons(personsResult.data);
      }
      if (orgUnitsResult.success) {
        setOrganizationUnits(orgUnitsResult.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleEdit = (dataOwnership: DataOwnershipDTO) => {
    setEditingDataOwnership(dataOwnership);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    setEditingDataOwnership(null);
    void loadData();
  };

  const handleCancel = () => {
    setDialogOpen(false);
    setEditingDataOwnership(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Ownerships</h1>
          <p className="text-muted-foreground">
            Manage data ownership assignments for governance and compliance
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Data Ownership
          </Button>
        )}
      </div>

      <DataOwnershipsTable
        data={dataOwnerships}
        dataDomains={dataDomains}
        ciClasses={ciClasses}
        assetCategories={assetCategories}
        persons={persons}
        organizationUnits={organizationUnits}
        loading={loading}
        onEdit={handleEdit}
        onRefresh={loadData}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {editingDataOwnership ? "Edit" : "Create"} Data Ownership
            </DialogTitle>
            <DialogDescription>
              {editingDataOwnership
                ? "Update the data ownership assignment details below."
                : "Fill in the details to create a new data ownership assignment."}
            </DialogDescription>
          </DialogHeader>
          <DataOwnershipForm
            dataOwnership={editingDataOwnership ?? undefined}
            dataDomains={dataDomains}
            ciClasses={ciClasses}
            assetCategories={assetCategories}
            persons={persons}
            organizationUnits={organizationUnits}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
