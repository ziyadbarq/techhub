/**
 * Person Detail Page
 *
 * Server component for viewing a single person's details (360-degree view).
 */

import { notFound } from "next/navigation";
import { hasPermission, requirePermission } from "@/lib/permissions/server";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import {
  getPersonDetailsAction,
  getPersonRelationCountsAction,
  getPersonIntuneDevicesAction,
} from "@/interface-adapters/controllers/person-details.controller";
import { getReportingChainAction } from "@/interface-adapters/controllers/employee-directory.controller";
import { PersonDetailPageClient } from "@/components/persons/person-detail-page-client";

export const dynamic = "force-dynamic";

interface PersonDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PersonDetailPage({
  params,
}: PersonDetailPageProps) {
  const { id } = await params;

  // Check permissions
  try {
    await requirePermission(PERMISSIONS.PERSONS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, `/persons/${id}`);
    throw error;
  }

  const canViewIntune = await hasPermission(PERMISSIONS.INTUNE_DEVICES_VIEW);

  // Fetch data in parallel
  const [personResult, countsResult, chainResult, intuneDevicesResult] =
    await Promise.all([
      getPersonDetailsAction(id),
      getPersonRelationCountsAction(id),
      getReportingChainAction(id),
      canViewIntune ? getPersonIntuneDevicesAction(id) : null,
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
