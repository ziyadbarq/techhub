"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { LicenseEntitlementDTO } from "@/interface-adapters/dtos/generated/license-entitlement.dto";
import { listLicenseEntitlements } from "@/interface-adapters/controllers/license-entitlement.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";
import { LicenseEntitlementsTable } from "./license-entitlements-table";
import { LicenseEntitlementForm } from "./license-entitlement-form";
import { LicenseEntitlementDetail } from "./license-entitlement-detail";

export function LicenseEntitlementsPageClient() {
  const [entitlements, setEntitlements] = React.useState<
    LicenseEntitlementDTO[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [formOpen, setFormOpen] = React.useState(false);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedEntitlement, setSelectedEntitlement] =
    React.useState<LicenseEntitlementDTO | null>(null);

  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.LICENSE_ENTITLEMENTS_CREATE);

  const loadEntitlements = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await listLicenseEntitlements();
      if (result.success) {
        setEntitlements(result.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadEntitlements();
  }, [loadEntitlements]);

  const handleEdit = (entitlement: LicenseEntitlementDTO) => {
    setSelectedEntitlement(entitlement);
    setFormOpen(true);
  };

  const handleView = (entitlement: LicenseEntitlementDTO) => {
    setSelectedEntitlement(entitlement);
    setDetailOpen(true);
  };

  const handleCreate = () => {
    setSelectedEntitlement(null);
    setFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setSelectedEntitlement(null);
    }
  };

  const handleDetailClose = (open: boolean) => {
    setDetailOpen(open);
    if (!open) {
      setSelectedEntitlement(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            License Entitlements
          </h1>
          <p className="text-muted-foreground">
            Manage purchased license quantities, costs, and allocations
          </p>
        </div>
        {canCreate && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Entitlement
          </Button>
        )}
      </div>

      <LicenseEntitlementsTable
        data={entitlements}
        loading={loading}
        onEdit={handleEdit}
        onView={handleView}
        onRefresh={loadEntitlements}
      />

      <LicenseEntitlementForm
        open={formOpen}
        onOpenChange={handleFormClose}
        onSuccess={loadEntitlements}
        entitlement={selectedEntitlement}
      />

      <LicenseEntitlementDetail
        entitlement={selectedEntitlement}
        open={detailOpen}
        onOpenChange={handleDetailClose}
        onEdit={handleEdit}
        onDeleted={loadEntitlements}
      />
    </div>
  );
}
