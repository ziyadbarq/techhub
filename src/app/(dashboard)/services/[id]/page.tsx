/**
 * Service Detail Page
 */

import * as React from "react";
import { notFound } from "next/navigation";

import { ServiceDetailView } from "@/components/services/service-detail-view";
import {
  getServiceAction,
  getServiceOwnersAction,
  getServiceInfrastructureAction,
  getServiceAssetsAction,
} from "@/interface-adapters/controllers/service.controller";

export const dynamic = "force-dynamic";

interface ServiceDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ServiceDetailPage({
  params,
}: ServiceDetailPageProps) {
  const { id } = await params;

  // Fetch all data in parallel
  const [serviceResult, ownersResult, infrastructureResult, assetsResult] =
    await Promise.all([
      getServiceAction(id),
      getServiceOwnersAction(id),
      getServiceInfrastructureAction(id),
      getServiceAssetsAction(id),
    ]);

  if (!serviceResult.success || !serviceResult.data) {
    notFound();
  }

  return (
    <div className="container py-6">
      <ServiceDetailView
        service={serviceResult.data}
        owners={ownersResult.success ? ownersResult.data : []}
        infrastructure={
          infrastructureResult.success ? infrastructureResult.data : null
        }
        linkedAssets={assetsResult.success ? assetsResult.data : []}
      />
    </div>
  );
}
