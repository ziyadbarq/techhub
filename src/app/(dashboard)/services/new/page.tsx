/**
 * Create Service Page
 */

import * as React from "react";
import { redirect } from "next/navigation";

import { ServiceForm } from "@/components/services/service-form";
import { listVendorsAction } from "@/interface-adapters/controllers/vendor.controller";
import { listBusinessProcessesAction } from "@/interface-adapters/controllers/business-process.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { hasPermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

export default async function NewServicePage() {
  const canCreate = await hasPermission(PERMISSIONS.SERVICES_CREATE);

  if (!canCreate) {
    redirect("/services");
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
