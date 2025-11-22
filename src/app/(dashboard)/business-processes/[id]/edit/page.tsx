/**
 * Edit Business Process Page
 */

import * as React from "react";
import { notFound, redirect } from "next/navigation";

import { BusinessProcessPageForm } from "@/components/services/business-process-page-form";
import { getBusinessProcessAction } from "@/interface-adapters/controllers/business-process.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { hasPermission } from "@/lib/permissions/server";

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
  const canManage = await hasPermission(PERMISSIONS.BUSINESS_PROCESSES_MANAGE);

  if (!canManage) {
    redirect(`/business-processes/${id}`);
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
