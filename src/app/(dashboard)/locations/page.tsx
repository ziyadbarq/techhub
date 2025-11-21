/**
 * Locations Page
 */

import { LocationsPageClient } from "@/components/locations/locations-page-client";
import { listLocationsAction } from "@/interface-adapters/controllers/location.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  await requirePermission(PERMISSIONS.LOCATIONS_VIEW);

  const result = await listLocationsAction();
  const initialLocations = result.success ? result.data : [];

  return <LocationsPageClient initialLocations={initialLocations} />;
}
