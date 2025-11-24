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
import { DataDomainsTable } from "@/components/data-domains/data-domains-table";
import { DataDomainForm } from "@/components/data-domains/data-domain-form";
import type { DataDomainDTO } from "@/interface-adapters/presenters/data-domain.presenter";
import { listDataDomains } from "@/interface-adapters/controllers/data-domain.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";

export function DataDomainsPageClient() {
  const [dataDomains, setDataDomains] = React.useState<DataDomainDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingDataDomain, setEditingDataDomain] =
    React.useState<DataDomainDTO | null>(null);

  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.DATA_DOMAINS_CREATE);

  const loadDataDomains = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await listDataDomains();
      if (result.success) {
        setDataDomains(result.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadDataDomains();
  }, [loadDataDomains]);

  const handleEdit = (dataDomain: DataDomainDTO) => {
    setEditingDataDomain(dataDomain);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    setEditingDataDomain(null);
    void loadDataDomains();
  };

  const handleCancel = () => {
    setDialogOpen(false);
    setEditingDataDomain(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Domains</h1>
          <p className="text-muted-foreground">
            Manage data classification domains for governance and compliance
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Data Domain
          </Button>
        )}
      </div>

      <DataDomainsTable
        data={dataDomains}
        loading={loading}
        onEdit={handleEdit}
        onRefresh={loadDataDomains}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingDataDomain ? "Edit" : "Create"} Data Domain
            </DialogTitle>
            <DialogDescription>
              {editingDataDomain
                ? "Update the data domain details below."
                : "Fill in the details to create a new data domain."}
            </DialogDescription>
          </DialogHeader>
          <DataDomainForm
            dataDomain={editingDataDomain ?? undefined}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
