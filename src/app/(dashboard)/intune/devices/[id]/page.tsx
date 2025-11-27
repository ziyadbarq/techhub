/**
 * Intune Device Detail Page
 *
 * Server component for viewing a single Intune device.
 */

import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requireFeature } from "@/lib/features/server";
import { getIntuneDeviceAction } from "@/interface-adapters/controllers/intune-device.controller";
import { IntuneDeviceDetailClient } from "@/components/intune/intune-device-detail-client";

export const dynamic = "force-dynamic";

interface IntuneDeviceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function IntuneDeviceDetailPage({
  params,
}: IntuneDeviceDetailPageProps) {
  const { id } = await params;

  // Check feature flag first
  try {
    await requireFeature("INTUNE");
  } catch {
    handlePermissionRedirect(
      new Error("INTUNE feature is not enabled"),
      `/intune/devices/${id}`,
    );
    throw new Error("INTUNE feature is not enabled");
  }

  // Check permissions
  try {
    await requirePermission(PERMISSIONS.INTUNE_DEVICES_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, `/intune/devices/${id}`);
    throw error;
  }

  // Fetch device data
  const result = await getIntuneDeviceAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return <IntuneDeviceDetailClient device={result.data} />;
}
