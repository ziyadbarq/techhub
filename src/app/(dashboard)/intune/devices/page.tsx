/**
 * Intune Devices Page
 *
 * Server component for viewing and managing Intune managed devices.
 */

import { requirePermission } from "@/lib/permissions/server";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requireFeature } from "@/lib/features/server";
import { listIntuneDevicesAction } from "@/interface-adapters/controllers/intune-device.controller";
import { IntuneDevicesPageClient } from "@/components/intune/intune-devices-page-client";

export const dynamic = "force-dynamic";

export default async function IntuneDevicesPage() {
  // Check feature flag first
  try {
    await requireFeature("INTUNE");
  } catch {
    handlePermissionRedirect(
      new Error("INTUNE feature is not enabled"),
      "/intune/devices",
    );
    throw new Error("INTUNE feature is not enabled");
  }

  // Check permissions
  try {
    await requirePermission(PERMISSIONS.INTUNE_DEVICES_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/intune/devices");
    throw error;
  }

  // Fetch initial data with pagination
  const result = await listIntuneDevicesAction(undefined, {
    page: 1,
    pageSize: 10,
  });
  const initialData = result.success
    ? result.data
    : { devices: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };

  return <IntuneDevicesPageClient initialData={initialData} />;
}
