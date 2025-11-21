/**
 * Asset Reservations Page
 */

import { AssetReservationsPageClient } from "@/components/asset-reservations/asset-reservations-page-client";
import { listReservationsAction } from "@/interface-adapters/controllers/asset-reservation.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export const dynamic = "force-dynamic";

export default async function AssetReservationsPage() {
  await requirePermission(PERMISSIONS.ASSET_RESERVATIONS_VIEW);

  const result = await listReservationsAction();
  const initialReservations = result.success ? result.data : [];

  return (
    <AssetReservationsPageClient initialReservations={initialReservations} />
  );
}
