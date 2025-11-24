/**
 * Locations Page
 */

import { LocationsPageClient } from "@/components/locations/locations-page-client";
import { listLocationsAction } from "@/interface-adapters/controllers/location.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  try {
    await requirePermission(PERMISSIONS.LOCATIONS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/locations");
    throw error;
  }

  const result = await listLocationsAction();
  const initialLocations = result.success ? result.data : [];

  return <LocationsPageClient initialLocations={initialLocations} />;
}
