/**
 * Create Service Page
 */

import * as React from "react";

import { ServiceForm } from "@/components/services/service-form";
import { listVendorsAction } from "@/interface-adapters/controllers/vendor.controller";
import { listBusinessProcessesAction } from "@/interface-adapters/controllers/business-process.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function NewServicePage() {
  // Security: Require permission to create services
  try {
    await requirePermission(PERMISSIONS.SERVICES_CREATE);
  } catch (error) {
    handlePermissionRedirect(error, "/services/new");
    throw error;
  }

  // Fetch vendors and business processes for dropdowns
  const [vendorsResult, processesResult] = await Promise.all([
    listVendorsAction(),
    listBusinessProcessesAction(),
  ]);

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Service</h1>
        <p className="text-muted-foreground mt-1">
          Add a new service to the catalog
        </p>
      </div>

      <ServiceForm
        mode="create"
        vendors={vendorsResult.success ? vendorsResult.data : []}
        businessProcesses={processesResult.success ? processesResult.data : []}
      />
    </div>
  );
}
