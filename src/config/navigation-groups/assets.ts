/**
 * Assets & Inventory Navigation Group
 *
 * Consolidates operational asset workflows into a single group while keeping
 * setup data (categories, models, stock locations) in the Asset Catalog group.
 */

import {
  Package,
  Shield,
  UserCheck,
  Boxes,
  CalendarClock,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { NavGroup } from "../navigation.types";

export const assetsInventoryGroup: NavGroup = {
  id: "assets-inventory",
  title: "Assets & Inventory",
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
      title: "Stock Movements",
      href: "/stock-movements",
      icon: TrendingUp,
      description: "Track inventory movements",
      permission: PERMISSIONS.STOCK_MOVEMENTS_VIEW,
      featureFlag: "INVENTORY",
    },
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
  collapsible: true,
  defaultCollapsed: false,
  visible: true,
};
