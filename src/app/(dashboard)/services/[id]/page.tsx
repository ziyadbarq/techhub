/**
 * Service Detail Page
 */

import * as React from "react";
import { notFound } from "next/navigation";

import { ServiceDetailView } from "@/components/services/service-detail-view";
import { getServiceAction } from "@/interface-adapters/controllers/service.controller";
import { getServiceOwnersAction } from "@/interface-adapters/controllers/service-ownership.controller";
import { getServiceInfrastructureAction } from "@/interface-adapters/controllers/service-infrastructure.controller";
import { getServiceAssetsAction } from "@/interface-adapters/controllers/service-asset.controller";
import { listPersonsAction } from "@/interface-adapters/controllers/person.controller";
import type { PersonDTO } from "@/interface-adapters/presenters/person.presenter";
import { hasPermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

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

  const [canManageOwners, canViewPersons] = await Promise.all([
    hasPermission(PERMISSIONS.SERVICES_MANAGE),
    hasPermission(PERMISSIONS.PERSONS_VIEW),
  ]);

  // Fetch all data in parallel
  const [
    serviceResult,
    ownersResult,
    infrastructureResult,
    assetsResult,
    personsResult,
  ] = await Promise.all([
    getServiceAction(id),
    getServiceOwnersAction(id),
    getServiceInfrastructureAction(id),
    getServiceAssetsAction(id),
    canManageOwners && canViewPersons ? listPersonsAction() : null,
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
      />
    </div>
  );
}
