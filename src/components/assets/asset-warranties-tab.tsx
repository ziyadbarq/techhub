/**
 * Asset Warranties Tab Component
 */

"use client";

import { AssetWarrantyPanel } from "@/components/warranties/asset-warranty-panel";

interface AssetWarrantiesTabProps {
  assetId: string;
}

export function AssetWarrantiesTab({ assetId }: AssetWarrantiesTabProps) {
  return (
    <div className="space-y-6">
      <AssetWarrantyPanel assetId={assetId} compact={false} />
    </div>
  );
}
