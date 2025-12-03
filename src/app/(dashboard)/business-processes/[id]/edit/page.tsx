/**
 * Edit Business Process Page
 */

import * as React from "react";
import { notFound } from "next/navigation";

import { BusinessProcessPageForm } from "@/components/services/business-process-page-form";
import { getBusinessProcessAction } from "@/interface-adapters/controllers/business-process.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

interface EditBusinessProcessPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditBusinessProcessPage({
  params,
}: EditBusinessProcessPageProps) {
  const { id } = await params;

  // Security: Require permission to manage business processes
  try {
    await requirePermission(PERMISSIONS.BUSINESS_PROCESSES_MANAGE);
  } catch (error) {
    handlePermissionRedirect(error, `/business-processes/${id}/edit`);
    throw error;
  }

  const result = await getBusinessProcessAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Business Process</h1>
        <p className="text-muted-foreground mt-1">
          Update business process information
        </p>
      </div>

      <BusinessProcessPageForm mode="edit" businessProcess={result.data} />
    </div>
  );
}
