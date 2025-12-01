/**
 * Person Detail Page
 *
 * Server component for viewing a single person's details (360-degree view).
 */

import { notFound } from "next/navigation";
import { hasPermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import {
  getPersonDetailsAction,
  getPersonRelationCountsAction,
  getPersonIntuneDevicesAction,
} from "@/interface-adapters/controllers/person-details.controller";
import { getReportingChainAction } from "@/interface-adapters/controllers/employee-directory.controller";
import { PersonDetailPageClient } from "@/components/persons/person-detail-page-client";
import { isFeatureEnabled } from "@/lib/features/server";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";

export const dynamic = "force-dynamic";

interface PersonDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PersonDetailPage({
  params,
}: PersonDetailPageProps) {
  const { id } = await params;

  await requireFeatureAndPermission(
    "FOUNDATION",
    PERMISSIONS.PERSONS_VIEW,
    `/persons/${id}`,
  );

  const [intuneEnabled, canViewIntune] = await Promise.all([
    isFeatureEnabled("INTUNE"),
    hasPermission(PERMISSIONS.INTUNE_DEVICES_VIEW),
  ]);

  // Fetch data in parallel
  const [personResult, countsResult, chainResult, intuneDevicesResult] =
    await Promise.all([
      getPersonDetailsAction(id),
      getPersonRelationCountsAction(id),
      getReportingChainAction(id),
      intuneEnabled && canViewIntune ? getPersonIntuneDevicesAction(id) : null,
    ]);

  if (!personResult.success || !personResult.data) {
    notFound();
  }

  return (
    <PersonDetailPageClient
      person={personResult.data}
      counts={countsResult.success ? countsResult.data : null}
      reportingChain={chainResult.success ? chainResult.data.chain : []}
      intuneDevices={
        intuneDevicesResult && intuneDevicesResult.success
          ? intuneDevicesResult.data
          : []
      }
    />
  );
}
