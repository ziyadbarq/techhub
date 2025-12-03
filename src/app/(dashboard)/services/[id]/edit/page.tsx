/**
 * Edit Service Page
 */

import * as React from "react";
import { notFound } from "next/navigation";

import { ServiceForm } from "@/components/services/service-form";
import { getServiceAction } from "@/interface-adapters/controllers/service.controller";
import { listVendorsAction } from "@/interface-adapters/controllers/vendor.controller";
import { listBusinessProcessesAction } from "@/interface-adapters/controllers/business-process.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

interface EditServicePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditServicePage({
  params,
}: EditServicePageProps) {
  const { id } = await params;

  // Security: Require permission to update services
  try {
    await requirePermission(PERMISSIONS.SERVICES_UPDATE);
  } catch (error) {
    handlePermissionRedirect(error, `/services/${id}/edit`);
    throw error;
  }

  // Fetch service and reference data
  const [serviceResult, vendorsResult, processesResult] = await Promise.all([
    getServiceAction(id),
    listVendorsAction(),
    listBusinessProcessesAction(),
  ]);

  if (!serviceResult.success || !serviceResult.data) {
    notFound();
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Service</h1>
        <p className="text-muted-foreground mt-1">Update service information</p>
      </div>

      <ServiceForm
        mode="edit"
        service={serviceResult.data}
        vendors={vendorsResult.success ? vendorsResult.data : []}
        businessProcesses={processesResult.success ? processesResult.data : []}
      />
    </div>
  );
}
