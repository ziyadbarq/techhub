/**
 * Dependency Infographic Configuration
 * Entity data, dimensions, and styling constants
 */

import {
  MapPin,
  Building2,
  Warehouse,
  Users,
  Tags,
  Store,
  Box,
  Settings2,
  Package,
  type LucideIcon,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export type TierType = "foundation" | "dependent" | "final";

export interface DependencyEntity {
  id: string;
  name: string;
  shortDesc: string;
  fullDesc: string;
  href: string;
  icon: LucideIcon;
  order: number;
  tier: TierType;
  dependsOn: string[];
  isOptionalDep?: boolean;
}

// ============================================================================
// Entity Configuration
// ============================================================================

export const DEPENDENCY_ENTITIES: DependencyEntity[] = [
  // Tier 1: Foundation (no dependencies)
  {
    id: "locations",
    name: "Locations",
    shortDesc: "Sites & buildings",
    fullDesc:
      "Define physical sites, buildings, and addresses where your organization operates and assets are located.",
    href: "/locations",
    icon: MapPin,
    order: 1,
    tier: "foundation",
    dependsOn: [],
  },
  {
    id: "asset-categories",
    name: "Categories",
    shortDesc: "Asset types",
    fullDesc:
      "Asset Categories: Create a hierarchical classification system for your assets (e.g., Hardware → Laptops, Software → Licenses).",
    href: "/asset-categories",
    icon: Tags,
    order: 5,
    tier: "foundation",
    dependsOn: [],
  },
  {
    id: "vendors",
    name: "Vendors",
    shortDesc: "Suppliers",
    fullDesc:
      "Register suppliers, manufacturers, and service providers who supply or maintain your assets.",
    href: "/vendors",
    icon: Store,
    order: 6,
    tier: "foundation",
    dependsOn: [],
  },
  {
    id: "field-definitions",
    name: "Fields",
    shortDesc: "Custom fields",
    fullDesc:
      "Field Definitions: Define custom fields to capture additional data specific to your organization's needs.",
    href: "/field-definitions",
    icon: Settings2,
    order: 8,
    tier: "foundation",
    dependsOn: [],
  },

  // Tier 2: Location-dependent
  {
    id: "organization-units",
    name: "Org Units",
    shortDesc: "Departments",
    fullDesc:
      "Organization Units: Set up your organizational structure with departments, teams, and cost centers. Requires locations to be defined first.",
    href: "/organization-units",
    icon: Building2,
    order: 2,
    tier: "dependent",
    dependsOn: ["locations"],
  },
  {
    id: "stock-locations",
    name: "Stock",
    shortDesc: "Storage areas",
    fullDesc:
      "Stock Locations: Define inventory storage areas like warehouses, IT closets, or storage rooms within your locations.",
    href: "/stock-locations",
    icon: Warehouse,
    order: 4,
    tier: "dependent",
    dependsOn: ["locations"],
  },

  // Tier 3: Organization-dependent
  {
    id: "persons",
    name: "Persons",
    shortDesc: "Employees",
    fullDesc:
      "Register employees, contractors, and contacts who can be assigned assets or manage inventory.",
    href: "/persons",
    icon: Users,
    order: 3,
    tier: "dependent",
    dependsOn: ["organization-units"],
  },
  {
    id: "asset-models",
    name: "Models",
    shortDesc: "Product specs",
    fullDesc:
      'Asset Models: Define specific product models with specifications (e.g., MacBook Pro 14" M3). Links to categories and vendors.',
    href: "/asset-models",
    icon: Box,
    order: 7,
    tier: "dependent",
    dependsOn: ["asset-categories", "vendors"],
  },

  // Tier 4: Final (multi-dependency)
  {
    id: "assets",
    name: "Assets",
    shortDesc: "IT equipment",
    fullDesc:
      "Track individual IT assets with serial numbers, assignments, and lifecycle status. The final destination for all your data.",
    href: "/assets",
    icon: Package,
    order: 9,
    tier: "final",
    dependsOn: ["asset-models", "stock-locations"],
    isOptionalDep: true, // persons is optional for assignment
  },
];

// ============================================================================
// Layout Configuration
// ============================================================================

export const LAYOUT_CONFIG = {
  node: {
    width: 160,
    height: 64,
  },
  graph: {
    rankdir: "TB" as const, // Top to bottom
    ranksep: 70, // Vertical spacing between ranks
    nodesep: 40, // Horizontal spacing between nodes
  },
  fitView: {
    padding: 0.2,
  },
  zoom: {
    min: 0.5,
    max: 1.5,
  },
};

// ============================================================================
// Theme-aware Colors
// ============================================================================

export const getTierColors = (isDark: boolean) => ({
  foundation: {
    bg: isDark ? "bg-emerald-500/15" : "bg-emerald-500/10",
    border: isDark ? "border-emerald-500/40" : "border-emerald-500/30",
    iconBg: isDark ? "bg-emerald-500/20" : "bg-emerald-500/15",
    iconColor: isDark ? "text-emerald-400" : "text-emerald-600",
    badgeBg: isDark ? "bg-emerald-500/20" : "bg-emerald-500/15",
    badgeText: isDark ? "text-emerald-300" : "text-emerald-700",
    hover: "hover:border-emerald-500/60 hover:shadow-emerald-500/10",
  },
  dependent: {
    bg: isDark ? "bg-blue-500/15" : "bg-blue-500/10",
    border: isDark ? "border-blue-500/40" : "border-blue-500/30",
    iconBg: isDark ? "bg-blue-500/20" : "bg-blue-500/15",
    iconColor: isDark ? "text-blue-400" : "text-blue-600",
    badgeBg: isDark ? "bg-blue-500/20" : "bg-blue-500/15",
    badgeText: isDark ? "text-blue-300" : "text-blue-700",
    hover: "hover:border-blue-500/60 hover:shadow-blue-500/10",
  },
  final: {
    bg: isDark ? "bg-barq-yellow/15" : "bg-barq-yellow/10",
    border: isDark ? "border-barq-yellow/50" : "border-barq-yellow/40",
    iconBg: isDark ? "bg-barq-yellow/25" : "bg-barq-yellow/20",
    iconColor: "text-barq-yellow",
    badgeBg: isDark ? "bg-barq-yellow/25" : "bg-barq-yellow/20",
    badgeText: isDark ? "text-barq-yellow" : "text-yellow-700",
    hover: "hover:border-barq-yellow/70 hover:shadow-barq-yellow/15",
  },
});

export const getEdgeColor = (isDark: boolean) =>
  isDark ? "#71717a" : "#a1a1aa"; // zinc-500 / zinc-400
