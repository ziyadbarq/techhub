/**
 * Warranties Page
 * Display and manage asset warranties
 */

import { WarrantiesPageClient } from "@/components/warranties/warranties-page-client";
import { listWarrantiesAction } from "@/interface-adapters/controllers/warranty.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";

export const dynamic = "force-dynamic";

export default async function WarrantiesPage() {
  await requireFeatureAndPermission(
    "WARRANTIES",
    PERMISSIONS.WARRANTIES_VIEW,
    "/warranties",
  );

  const result = await listWarrantiesAction();
  const initialWarranties = result.success ? result.data.warranties : [];

  return <WarrantiesPageClient initialWarranties={initialWarranties} />;
}
