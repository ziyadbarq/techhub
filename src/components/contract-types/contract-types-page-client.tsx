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
import { ContractTypesTable } from "@/components/contract-types/contract-types-table";
import { ContractTypeForm } from "@/components/contract-types/contract-type-form";
import type { ContractTypeDTO } from "@/interface-adapters/presenters/contract-type.presenter";
import { listContractTypes } from "@/interface-adapters/controllers/contract-type.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";

export function ContractTypesPageClient() {
  const [contractTypes, setContractTypes] = React.useState<ContractTypeDTO[]>(
    [],
  );
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingContractType, setEditingContractType] =
    React.useState<ContractTypeDTO | null>(null);

  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.CONTRACT_TYPES_CREATE);

  const loadContractTypes = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await listContractTypes();
      if (result.success) {
        setContractTypes(result.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadContractTypes();
  }, [loadContractTypes]);

  const handleEdit = (contractType: ContractTypeDTO) => {
    setEditingContractType(contractType);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    setEditingContractType(null);
    void loadContractTypes();
  };

  const handleCancel = () => {
    setDialogOpen(false);
    setEditingContractType(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contract Types</h1>
          <p className="text-muted-foreground">
            Manage contract types and classifications
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Contract Type
          </Button>
        )}
      </div>

      <ContractTypesTable
        data={contractTypes}
        loading={loading}
        onEdit={handleEdit}
        onRefresh={loadContractTypes}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingContractType ? "Edit" : "Create"} Contract Type
            </DialogTitle>
            <DialogDescription>
              {editingContractType
                ? "Update the contract type details below."
                : "Fill in the details to create a new contract type."}
            </DialogDescription>
          </DialogHeader>
          <ContractTypeForm
            contractType={editingContractType ?? undefined}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
