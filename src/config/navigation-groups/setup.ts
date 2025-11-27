/**
 * Setup Navigation Group
 *
 * Consolidated group for initial data entry workflow.
 * Items ordered by entity dependencies for optimal data population flow.
 *
 * Dependency order:
 * 1. Locations (no deps - self-referencing hierarchy)
 * 2. Organization Units (no deps - self-referencing hierarchy)
 * 3. Persons (no deps - created via auth)
 * 4. Stock Locations (optional: Location)
 * 5. Asset Categories (no deps)
 * 6. Vendors (no deps)
 * 7. Asset Models (requires: Vendor + AssetCategory)
 * 8. Field Definitions (no deps)
 * 9. Assets (requires: AssetCategory, optional: rest)
 */

import {
  MapPin,
  Building2,
  UserCircle,
  Warehouse,
  Package,
  Settings2,
} from "lucide-react";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { NavGroup } from "../navigation.types";

export const setupGroup: NavGroup = {
  id: "setup",
  title: "Setup",
  items: [
    // No dependencies - can be created first
    {
      title: "Locations",
      href: "/locations",
      icon: MapPin,
      description: "Manage locations",
      permission: PERMISSIONS.LOCATIONS_VIEW,
      featureFlag: "FOUNDATION",
    },
    {
      title: "Organization Units",
      href: "/organization-units",
      icon: Building2,
      description: "Organization structure",
      permission: PERMISSIONS.ORGANIZATION_UNITS_VIEW,
      featureFlag: "FOUNDATION",
    },
    {
      title: "Persons",
      href: "/persons",
      icon: UserCircle,
      description: "Manage and browse company employees",
      permission: PERMISSIONS.PERSONS_VIEW,
      featureFlag: "FOUNDATION",
    },
    // Depends on Location (optional)
    {
      title: "Stock Locations",
      href: "/stock-locations",
      icon: Warehouse,
      description: "Manage stock locations and warehouses",
      permission: PERMISSIONS.STOCK_LOCATIONS_VIEW,
      featureFlag: "INVENTORY",
    },
    // No dependencies
    {
      title: "Asset Categories",
      href: "/asset-categories",
      icon: Package,
      description: "Manage asset categories",
      permission: PERMISSIONS.ASSET_CATEGORIES_VIEW,
      featureFlag: "ASSETS",
    },
    {
      title: "Vendors",
      href: "/vendors",
      icon: Package,
      description: "Manage vendors",
      permission: PERMISSIONS.VENDORS_VIEW,
      featureFlag: "FOUNDATION",
    },
    // Depends on Vendor + AssetCategory
    {
      title: "Asset Models",
      href: "/asset-models",
      icon: Package,
      description: "Manage asset models",
      permission: PERMISSIONS.ASSET_MODELS_VIEW,
      featureFlag: "ASSETS",
    },
    // No dependencies
    {
      title: "Field Definitions",
      href: "/field-definitions",
      icon: Settings2,
      description: "Manage custom field definitions",
      permission: PERMISSIONS.FIELD_DEFINITIONS_VIEW,
      featureFlag: "FOUNDATION",
    },
    // Depends on AssetCategory (rest optional)
    {
      title: "Assets",
      href: "/assets",
      icon: Package,
      description: "Manage assets",
      permission: PERMISSIONS.ASSETS_VIEW,
      featureFlag: "ASSETS",
    },
  ],
  visible: true,
  collapsible: true,
  defaultCollapsed: false, // Expanded by default for easy access during setup
};
