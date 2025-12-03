/**
 * Service Detail Page
 */

import * as React from "react";
import { notFound } from "next/navigation";

import { ServiceDetailView } from "@/components/services/service-detail-view";
import {
  getServiceAction,
  getServiceHealthHistoryAction,
  getServiceSlaMetricsAction,
} from "@/interface-adapters/controllers/service.controller";
import { getServiceOwnersAction } from "@/interface-adapters/controllers/service-ownership.controller";
import { getServiceInfrastructureAction } from "@/interface-adapters/controllers/service-infrastructure.controller";
import { getServiceAssetsAction } from "@/interface-adapters/controllers/service-asset.controller";
import { listPersonsAction } from "@/interface-adapters/controllers/person.controller";
import type { PersonDTO } from "@/interface-adapters/presenters/person.presenter";
import { hasPermission, requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { isFeatureEnabled } from "@/lib/features/server";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

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

  // Security: Require permission to view services
  try {
    await requirePermission(PERMISSIONS.SERVICES_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, `/services/${id}`);
    throw error;
  }

  const [canManageOwners, canViewPersons, healthSlaEnabled] = await Promise.all(
    [
      hasPermission(PERMISSIONS.SERVICES_MANAGE),
      hasPermission(PERMISSIONS.PERSONS_VIEW),
      isFeatureEnabled("SERVICE_HEALTH_SLA"),
    ],
  );

  // Fetch all data in parallel
  const [
    serviceResult,
    ownersResult,
    infrastructureResult,
    assetsResult,
    personsResult,
    healthHistoryResult,
    slaMetricsResult,
  ] = await Promise.all([
    getServiceAction(id),
    getServiceOwnersAction(id),
    getServiceInfrastructureAction(id),
    getServiceAssetsAction(id),
    canManageOwners && canViewPersons ? listPersonsAction() : null,
    healthSlaEnabled ? getServiceHealthHistoryAction(id) : null,
    healthSlaEnabled ? getServiceSlaMetricsAction(id) : null,
  ]);

  if (!serviceResult.success || !serviceResult.data) {
    notFound();
  }

  const persons: PersonDTO[] =
    personsResult && personsResult.success && personsResult.data
      ? personsResult.data
      : [];

  return (
    <div className="container py-6">
      <ServiceDetailView
        service={serviceResult.data}
        owners={ownersResult.success ? ownersResult.data : []}
        infrastructure={
          infrastructureResult.success ? infrastructureResult.data : null
        }
        linkedAssets={assetsResult.success ? assetsResult.data : []}
        persons={persons}
        healthHistory={
          healthHistoryResult && healthHistoryResult.success
            ? healthHistoryResult.data
            : []
        }
        slaMetrics={
          slaMetricsResult && slaMetricsResult.success
            ? slaMetricsResult.data
            : []
        }
        healthSlaEnabled={healthSlaEnabled}
      />
    </div>
  );
}
