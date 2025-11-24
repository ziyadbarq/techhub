"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ContractsTable } from "@/components/contracts/contracts-table";
import type { ContractDTO } from "@/interface-adapters/presenters/contract.presenter";
import { listContracts } from "@/interface-adapters/controllers/contract.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";
import { useRouter } from "next/navigation";

export function ContractsPageClient() {
  const router = useRouter();
  const [contracts, setContracts] = React.useState<ContractDTO[]>([]);
  const [loading, setLoading] = React.useState(true);

  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.CONTRACTS_CREATE);

  const loadContracts = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await listContracts();
      if (result.success) {
        setContracts(result.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadContracts();
  }, [loadContracts]);

  const handleEdit = (contract: ContractDTO) => {
    // Navigate to edit page
    router.push(`/contracts/${contract.id}/edit`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contracts</h1>
          <p className="text-muted-foreground">
            Manage vendor contracts and agreements
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => router.push("/contracts/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Contract
          </Button>
        )}
      </div>

      <ContractsTable
        data={contracts}
        loading={loading}
        onEdit={handleEdit}
        onRefresh={loadContracts}
      />
    </div>
  );
}
