/**
 * Vendor Detail Page
 *
 * Server component for viewing a single vendor's details (360-degree view).
 */

import { notFound } from "next/navigation";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { getVendorAction } from "@/interface-adapters/controllers/vendor.controller";
import {
  getVendorRelationCountsAction,
  getVendorStatisticsAction,
} from "@/interface-adapters/controllers/vendor-details.controller";
import { VendorDetailPageClient } from "@/components/vendors/vendor-detail-page-client";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";

export const dynamic = "force-dynamic";

interface VendorDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function VendorDetailPage({
  params,
}: VendorDetailPageProps) {
  const { id } = await params;

  await requireFeatureAndPermission(
    "FOUNDATION",
    PERMISSIONS.VENDORS_VIEW,
    `/vendors/${id}`,
  );

  // Fetch data in parallel
  const [vendorResult, countsResult, statsResult] = await Promise.all([
    getVendorAction(id),
    getVendorRelationCountsAction(id),
    getVendorStatisticsAction(id),
  ]);

  if (!vendorResult.success || !vendorResult.data) {
    notFound();
  }

  return (
    <VendorDetailPageClient
      vendor={vendorResult.data}
      counts={countsResult.success ? countsResult.data : null}
      statistics={statsResult.success ? statsResult.data : null}
    />
  );
}
