"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { LicenseEntitlementDTO } from "@/interface-adapters/presenters/license-entitlement.presenter";
import { listLicenseEntitlements } from "@/interface-adapters/controllers/license-entitlement.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";

export function LicenseEntitlementsPageClient() {
  const [entitlements, setEntitlements] = React.useState<
    LicenseEntitlementDTO[]
  >([]);
  const [loading, setLoading] = React.useState(true);

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            License Entitlements
          </h1>
          <p className="text-muted-foreground">
            Manage purchased license quantities and allocations
          </p>
        </div>
        {canCreate && (
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            New Entitlement
          </Button>
        )}
      </div>

      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">
          {loading
            ? "Loading entitlements..."
            : entitlements.length === 0
              ? "No entitlements found. Create one to get started."
              : `${entitlements.length} entitlement(s) found`}
        </p>
      </div>
    </div>
  );
}
