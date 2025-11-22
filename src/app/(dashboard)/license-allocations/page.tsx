"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { LicenseAllocationDTO } from "@/interface-adapters/presenters/license-allocation.presenter";
import { listLicenseAllocations } from "@/interface-adapters/controllers/license-allocation.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";

export const dynamic = "force-dynamic";

export default function LicenseAllocationsPage() {
  const [allocations, setAllocations] = React.useState<LicenseAllocationDTO[]>(
    [],
  );
  const [loading, setLoading] = React.useState(true);

  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.LICENSE_ALLOCATIONS_CREATE);

  const loadAllocations = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await listLicenseAllocations();
      if (result.success) {
        setAllocations(result.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadAllocations();
  }, [loadAllocations]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            License Allocations
          </h1>
          <p className="text-muted-foreground">
            Track license assignments to users, devices, and resources
          </p>
        </div>
        {canCreate && (
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            New Allocation
          </Button>
        )}
      </div>

      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">
          {loading
            ? "Loading allocations..."
            : allocations.length === 0
              ? "No allocations found. Create one to get started."
              : `${allocations.length} allocation(s) found`}
        </p>
      </div>
    </div>
  );
}
