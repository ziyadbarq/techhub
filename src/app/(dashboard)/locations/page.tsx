/**
 * Locations Page
 */

import { LocationsPageClient } from "@/components/locations/locations-page-client";
import { listLocationsAction } from "@/interface-adapters/controllers/location.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  await requireFeatureAndPermission(
    "FOUNDATION",
    PERMISSIONS.LOCATIONS_VIEW,
    "/locations",
  );

  const result = await listLocationsAction();
  const initialLocations = result.success ? result.data : [];

  return <LocationsPageClient initialLocations={initialLocations} />;
}
