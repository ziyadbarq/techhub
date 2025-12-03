/**
 * Business Process Detail Page
 */

import * as React from "react";
import { notFound } from "next/navigation";

import { BusinessProcessDetailView } from "@/components/services/business-process-detail-view";
import { getBusinessProcessAction } from "@/interface-adapters/controllers/business-process.controller";
import { requirePermission } from "@/lib/permissions/server";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export const dynamic = "force-dynamic";

interface BusinessProcessDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BusinessProcessDetailPage({
  params,
}: BusinessProcessDetailPageProps) {
  const { id } = await params;

  // Security: Require permission to view business processes
  try {
    await requirePermission(PERMISSIONS.BUSINESS_PROCESSES_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, `/business-processes/${id}`);
    throw error;
  }

  const result = await getBusinessProcessAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="container py-6">
      <BusinessProcessDetailView process={result.data} />
    </div>
  );
}
