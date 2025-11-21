/**
 * Warranties Page
 * Display and manage asset warranties
 */

import { WarrantiesPageClient } from "@/components/warranties/warranties-page-client";
import { listWarrantiesAction } from "@/interface-adapters/controllers/warranty.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export const dynamic = "force-dynamic";

export default async function WarrantiesPage() {
  await requirePermission(PERMISSIONS.WARRANTIES_VIEW);

  const result = await listWarrantiesAction();
  const initialWarranties = result.success ? result.data.warranties : [];

  return <WarrantiesPageClient initialWarranties={initialWarranties} />;
}
