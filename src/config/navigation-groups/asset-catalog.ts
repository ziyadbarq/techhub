/**
 * Asset Catalog Navigation Group
 *
 * Asset-only catalog and inventory setup separate from the shared foundation data.
 */

import { Warehouse, Package } from "lucide-react";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { NavGroup } from "../navigation.types";

export const assetCatalogGroup: NavGroup = {
  id: "asset-catalog",
  title: "Asset Catalog",
  items: [
    {
      title: "Asset Categories",
      href: "/asset-categories",
      icon: Package,
      description: "Manage asset categories",
      permission: PERMISSIONS.ASSET_CATEGORIES_VIEW,
      featureFlag: "ASSETS",
    },
    {
      title: "Asset Models",
      href: "/asset-models",
      icon: Package,
      description: "Manage asset models",
      permission: PERMISSIONS.ASSET_MODELS_VIEW,
      featureFlag: "ASSETS",
    },
    {
      title: "Stock Locations",
      href: "/stock-locations",
      icon: Warehouse,
      description: "Manage stock locations and warehouses",
      permission: PERMISSIONS.STOCK_LOCATIONS_VIEW,
      featureFlag: "INVENTORY",
    },
  ],
  visible: true,
  collapsible: true,
  defaultCollapsed: false,
};
