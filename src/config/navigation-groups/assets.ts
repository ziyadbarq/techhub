/**
 * Asset-Related Navigation Groups
 *
 * Groups:
 * - Asset Management: Core asset entities (assets, categories, models, assignments, warranties)
 * - Asset Operations: Operational workflows (kits, reservations, disposals)
 * - Inventory: Stock management (locations, movements)
 */

import {
  Package,
  Shield,
  UserCheck,
  Boxes,
  CalendarClock,
  Trash2,
  Warehouse,
  TrendingUp,
} from "lucide-react";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { NavGroup } from "../navigation.types";

export const assetManagementGroup: NavGroup = {
  id: "asset-management",
  title: "Asset Management",
  items: [
    {
      title: "Assets",
      href: "/assets",
      icon: Package,
      description: "Manage assets",
      permission: PERMISSIONS.ASSETS_VIEW,
      featureFlag: "ASSETS",
    },
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
      title: "Asset Assignments",
      href: "/asset-assignments",
      icon: UserCheck,
      description: "Manage asset assignments",
      permission: PERMISSIONS.ASSET_ASSIGNMENTS_VIEW,
      featureFlag: "ASSETS",
    },
    {
      title: "Warranties",
      href: "/warranties",
      icon: Shield,
      description: "Manage asset warranties",
      permission: PERMISSIONS.WARRANTIES_VIEW,
      featureFlag: "WARRANTIES",
    },
  ],
  visible: true,
  collapsible: true,
  defaultCollapsed: false,
};

export const assetOperationsGroup: NavGroup = {
  id: "asset-operations",
  title: "Asset Operations",
  items: [
    {
      title: "Asset Kits",
      href: "/asset-kits",
      icon: Boxes,
      description: "Predefined asset bundles and checkouts",
      permission: PERMISSIONS.ASSET_KITS_VIEW,
      featureFlag: "ASSET_KITS",
    },
    {
      title: "Reservations",
      href: "/asset-reservations",
      icon: CalendarClock,
      description: "Asset reservations and availability",
      permission: PERMISSIONS.ASSET_RESERVATIONS_VIEW,
      featureFlag: "ASSET_RESERVATIONS",
    },
    {
      title: "Disposals",
      href: "/asset-disposals",
      icon: Trash2,
      description: "Asset disposal workflow",
      permission: PERMISSIONS.ASSET_DISPOSALS_VIEW,
      featureFlag: "ASSET_DISPOSALS",
    },
  ],
  visible: true,
  collapsible: true,
  defaultCollapsed: false,
};

export const inventoryGroup: NavGroup = {
  id: "inventory",
  title: "Inventory",
  items: [
    {
      title: "Stock Locations",
      href: "/stock-locations",
      icon: Warehouse,
      description: "Manage stock locations and warehouses",
      permission: PERMISSIONS.STOCK_LOCATIONS_VIEW,
      featureFlag: "INVENTORY",
    },
    {
      title: "Stock Movements",
      href: "/stock-movements",
      icon: TrendingUp,
      description: "Track inventory movements",
      permission: PERMISSIONS.STOCK_MOVEMENTS_VIEW,
      featureFlag: "INVENTORY",
    },
  ],
  visible: true,
  collapsible: true,
  defaultCollapsed: false,
};
