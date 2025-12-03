/**
 * Routes Manifest - Single Source of Truth
 *
 * This file is the ONLY place where routes should be defined.
 * All other route configurations are code-generated from this manifest.
 *
 * Generated artifacts:
 * - navigation-groups/*.ts (navigation UI structure)
 * - protected-routes.ts (route-level permissions)
 *
 * DO NOT EDIT GENERATED FILES - Update this manifest instead and run the generator.
 */

import type { LucideIcon } from "lucide-react";
import {
  Home,
  Users,
  Package,
  Boxes,
  Settings,
  Shield,
  Clock,
  FolderTree,
  Building2,
  MapPin,
  Store,
  Briefcase,
  CheckSquare,
  LayoutDashboard,
  FileText,
  Database,
  Laptop,
  Layers,
  Network,
  FileCode,
  FileKey,
  ShoppingCart,
  AlertCircle,
  BarChart3,
  BookOpen,
  Gauge,
  Activity,
  Archive,
  Wrench,
  ClipboardList,
  Workflow,
  ShieldCheck,
  Binary,
  HardDrive,
} from "lucide-react";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

/**
 * Icon name mapping for code generation
 * Maps icon component to its import name
 */
export const ICON_NAME_MAP = new Map<LucideIcon, string>([
  [Home, "Home"],
  [Users, "Users"],
  [Package, "Package"],
  [Boxes, "Boxes"],
  [Settings, "Settings"],
  [Shield, "Shield"],
  [Clock, "Clock"],
  [FolderTree, "FolderTree"],
  [Building2, "Building2"],
  [MapPin, "MapPin"],
  [Store, "Store"],
  [Briefcase, "Briefcase"],
  [CheckSquare, "CheckSquare"],
  [LayoutDashboard, "LayoutDashboard"],
  [FileText, "FileText"],
  [Database, "Database"],
  [Laptop, "Laptop"],
  [Layers, "Layers"],
  [Network, "Network"],
  [FileCode, "FileCode"],
  [FileKey, "FileKey"],
  [ShoppingCart, "ShoppingCart"],
  [AlertCircle, "AlertCircle"],
  [BarChart3, "BarChart3"],
  [BookOpen, "BookOpen"],
  [Gauge, "Gauge"],
  [Activity, "Activity"],
  [Archive, "Archive"],
  [Wrench, "Wrench"],
  [ClipboardList, "ClipboardList"],
  [Workflow, "Workflow"],
  [ShieldCheck, "ShieldCheck"],
  [Binary, "Binary"],
  [HardDrive, "HardDrive"],
]);

/**
 * Route definition in the manifest
 */
export interface RouteDefinition {
  /** Route path (Next.js pattern with [id] for dynamic segments) */
  path: string;

  /** Display label for navigation */
  label: string;

  /** Lucide icon component */
  icon: LucideIcon;

  /** Icon name (for code generation) */
  iconName?: string;

  /** Short description for tooltips/documentation */
  description?: string;

  /** Required permission constant names (ANY - OR logic) - e.g., ["DASHBOARD_VIEW"] */
  requiredPermissions?: string[];

  /** Resolved permission keys for runtime checks */
  _permissionKeys?: PermissionKey[];

  /** Required permission constant names (ALL - AND logic) - e.g., ["USERS_VIEW", "USERS_MANAGE"] */
  requiredAllPermissions?: string[];

  /** Required role names (ANY - OR logic) */
  requiredRoles?: string[];

  /** Feature flag required to access this route */
  featureFlag?: string;

  /** Navigation visibility */
  visibleInNav?: boolean;

  /** Badge text (e.g., "New", "Beta") or "dynamic" for real-time counts */
  badge?: string | "dynamic";

  /** Navigation group this route belongs to */
  navGroup?: NavGroupId;

  /** Parent route path (for hierarchical nav) */
  parentRoute?: string;

  /** Whether this route should be visible by default in nav */
  defaultVisible?: boolean;

  /** Whether this is a child route that shouldn't appear in primary nav */
  isChildRoute?: boolean;

  /** Sort order within navigation group (lower = higher) */
  navOrder?: number;
}

/**
 * Navigation group identifiers
 */
export type NavGroupId =
  | "main"
  | "foundation"
  | "assets"
  | "asset-catalog"
  | "services-cmdb"
  | "compliance"
  | "system";

/**
 * Navigation group metadata
 */
export interface NavGroupMetadata {
  id: NavGroupId;
  title: string;
  collapsible: boolean;
  defaultCollapsed?: boolean;
  permission?: PermissionKey;
  order: number;
}

/**
 * Navigation groups configuration
 */
export const NAV_GROUPS: Record<NavGroupId, NavGroupMetadata> = {
  main: {
    id: "main",
    title: "Main",
    collapsible: false,
    order: 1,
  },
  foundation: {
    id: "foundation",
    title: "Foundation",
    collapsible: true,
    defaultCollapsed: false,
    order: 2,
  },
  assets: {
    id: "assets",
    title: "Assets & Inventory",
    collapsible: true,
    defaultCollapsed: false,
    order: 3,
  },
  "asset-catalog": {
    id: "asset-catalog",
    title: "Asset Catalog",
    collapsible: true,
    defaultCollapsed: true,
    order: 4,
  },
  "services-cmdb": {
    id: "services-cmdb",
    title: "Services & CMDB",
    collapsible: true,
    defaultCollapsed: true,
    order: 5,
  },
  compliance: {
    id: "compliance",
    title: "Compliance & Governance",
    collapsible: true,
    defaultCollapsed: true,
    order: 6,
  },
  system: {
    id: "system",
    title: "System & Admin",
    collapsible: true,
    defaultCollapsed: true,
    permission: PERMISSIONS.USERS_VIEW,
    order: 7,
  },
};

/**
 * Routes Manifest - Single source of truth for all routes
 *
 * Guidelines:
 * - Keep routes alphabetically sorted within each section
 * - Always specify requiredPermissions (even if empty)
 * - Use visibleInNav: false for child routes
 * - Add featureFlag for module-gated features
 */
export const ROUTES_MANIFEST: RouteDefinition[] = [
  // ============================================================================
  // MAIN GROUP
  // ============================================================================
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: Home,
    description: "Overview and statistics",
    requiredPermissions: ["DASHBOARD_VIEW"],
    visibleInNav: true,
    navGroup: "main",
    navOrder: 1,
  },
  {
    path: "/intune/devices",
    label: "Intune Devices",
    icon: Laptop,
    description: "View and manage Microsoft Intune devices",
    requiredPermissions: ["INTUNE_DEVICES_VIEW"],
    featureFlag: "INTUNE",
    visibleInNav: true,
    navGroup: "main",
    navOrder: 2,
  },
  {
    path: "/intune/devices/[id]",
    label: "Intune Device Details",
    icon: Laptop,
    description: "View specific Intune device details",
    requiredPermissions: ["INTUNE_DEVICES_VIEW"],
    featureFlag: "INTUNE",
    visibleInNav: false,
    isChildRoute: true,
    parentRoute: "/intune/devices",
  },
  {
    path: "/intune/compliance",
    label: "Intune Compliance",
    icon: ShieldCheck,
    description: "Device compliance monitoring dashboard",
    requiredPermissions: ["INTUNE_COMPLIANCE_VIEW"],
    featureFlag: "INTUNE",
    visibleInNav: false,
    isChildRoute: true,
    parentRoute: "/intune/devices",
  },
  {
    path: "/data-import",
    label: "Data Import",
    icon: Database,
    description: "Universal data importer for all entities",
    requiredPermissions: ["DATA_IMPORT_MANAGE"],
    featureFlag: "DATA_IMPORT",
    visibleInNav: true,
    navGroup: "main",
    navOrder: 3,
  },
  {
    path: "/analytics",
    label: "Analytics",
    icon: LayoutDashboard,
    description: "Asset statistics and charts",
    requiredPermissions: ["ASSETS_VIEW"],
    visibleInNav: false, // Hidden until implemented
    navGroup: "main",
    navOrder: 4,
  },
  {
    path: "/reports",
    label: "Reports",
    icon: FileText,
    description: "Asset management reports",
    requiredPermissions: ["ASSETS_VIEW"],
    visibleInNav: false, // Hidden until implemented
    navGroup: "main",
    navOrder: 5,
  },
  {
    path: "/reports/usage",
    label: "Usage Report",
    icon: FileText,
    description: "Usage statistics report",
    requiredPermissions: ["DASHBOARD_ANALYTICS"],
    visibleInNav: false,
    isChildRoute: true,
    parentRoute: "/reports",
  },
  {
    path: "/reports/performance",
    label: "Performance Report",
    icon: FileText,
    description: "Performance metrics report",
    requiredPermissions: ["DASHBOARD_ANALYTICS"],
    visibleInNav: false,
    isChildRoute: true,
    parentRoute: "/reports",
  },

  // ============================================================================
  // FOUNDATION GROUP
  // ============================================================================
  {
    path: "/persons",
    label: "Persons",
    icon: Users,
    description: "Person directory - view all persons and employee directory",
    requiredPermissions: ["PERSONS_VIEW"],
    featureFlag: "FOUNDATION",
    visibleInNav: true,
    navGroup: "foundation",
    navOrder: 1,
  },
  {
    path: "/persons/[id]",
    label: "Person Details",
    icon: Users,
    description:
      "Person details - 360-degree view with roles, reporting chain, and related entities",
    requiredPermissions: ["PERSONS_VIEW"],
    featureFlag: "FOUNDATION",
    visibleInNav: false,
    isChildRoute: true,
    parentRoute: "/persons",
  },
  {
    path: "/organization-units",
    label: "Organization Units",
    icon: FolderTree,
    description: "Organization unit management - view org hierarchy",
    requiredPermissions: ["ORGANIZATION_UNITS_VIEW"],
    featureFlag: "FOUNDATION",
    visibleInNav: true,
    navGroup: "foundation",
    navOrder: 2,
  },
  {
    path: "/locations",
    label: "Locations",
    icon: MapPin,
    description: "Location management - view and manage physical locations",
    requiredPermissions: ["LOCATIONS_VIEW"],
    featureFlag: "FOUNDATION",
    visibleInNav: true,
    navGroup: "foundation",
    navOrder: 3,
  },
  {
    path: "/vendors",
    label: "Vendors",
    icon: Store,
    description: "Vendor management - view and manage vendors",
    requiredPermissions: ["VENDORS_VIEW"],
    featureFlag: "FOUNDATION",
    visibleInNav: true,
    navGroup: "foundation",
    navOrder: 4,
  },

  // ============================================================================
  // ASSETS & INVENTORY GROUP
  // ============================================================================
  {
    path: "/assets",
    label: "Assets",
    icon: Package,
    description: "Asset management - view all assets",
    requiredPermissions: ["ASSETS_VIEW"],
    featureFlag: "ASSETS",
    visibleInNav: true,
    navGroup: "assets",
    navOrder: 1,
  },
  {
    path: "/assets/[assetTag]",
    label: "Asset Details",
    icon: Package,
    description: "View specific asset details (360-degree view)",
    requiredPermissions: ["ASSETS_VIEW"],
    featureFlag: "ASSETS",
    visibleInNav: false,
    isChildRoute: true,
    parentRoute: "/assets",
  },
  {
    path: "/asset-assignments",
    label: "Asset Assignments",
    icon: ClipboardList,
    description: "Asset assignment tracking",
    requiredPermissions: ["ASSET_ASSIGNMENTS_VIEW"],
    featureFlag: "ASSETS",
    visibleInNav: true,
    navGroup: "assets",
    navOrder: 2,
  },
  {
    path: "/asset-kits",
    label: "Asset Kits",
    icon: Boxes,
    description: "Pre-configured asset kits for bulk deployment",
    requiredPermissions: ["ASSET_KITS_VIEW"],
    featureFlag: "ASSET_KITS",
    visibleInNav: true,
    navGroup: "assets",
    navOrder: 3,
  },
  {
    path: "/asset-reservations",
    label: "Asset Reservations",
    icon: Clock,
    description: "Asset reservation management",
    requiredPermissions: ["ASSET_RESERVATIONS_VIEW"],
    featureFlag: "ASSET_RESERVATIONS",
    visibleInNav: true,
    navGroup: "assets",
    navOrder: 4,
  },
  {
    path: "/asset-disposals",
    label: "Asset Disposals",
    icon: Archive,
    description: "Asset disposal tracking and approval workflow",
    requiredPermissions: ["ASSET_DISPOSALS_VIEW"],
    featureFlag: "ASSET_DISPOSALS",
    visibleInNav: true,
    navGroup: "assets",
    navOrder: 5,
  },
  {
    path: "/stock-locations",
    label: "Stock Locations",
    icon: Building2,
    description: "Warehouse and stock location management",
    requiredPermissions: ["STOCK_LOCATIONS_VIEW"],
    featureFlag: "INVENTORY",
    visibleInNav: true,
    navGroup: "assets",
    navOrder: 6,
  },
  {
    path: "/stock-movements",
    label: "Stock Movements",
    icon: Activity,
    description: "Track asset movements between locations",
    requiredPermissions: ["STOCK_MOVEMENTS_VIEW"],
    featureFlag: "INVENTORY",
    visibleInNav: true,
    navGroup: "assets",
    navOrder: 7,
  },
  {
    path: "/maintenance-schedules",
    label: "Maintenance Schedules",
    icon: Wrench,
    description: "Scheduled maintenance planning",
    requiredPermissions: ["MAINTENANCE_SCHEDULES_VIEW"],
    featureFlag: "MAINTENANCE",
    visibleInNav: true,
    navGroup: "assets",
    navOrder: 8,
  },
  {
    path: "/maintenance-records",
    label: "Maintenance Records",
    icon: ClipboardList,
    description: "Historical maintenance tracking",
    requiredPermissions: ["MAINTENANCE_RECORDS_VIEW"],
    featureFlag: "MAINTENANCE",
    visibleInNav: true,
    navGroup: "assets",
    navOrder: 9,
  },
  {
    path: "/warranties",
    label: "Warranties",
    icon: ShieldCheck,
    description: "Warranty tracking and management",
    requiredPermissions: ["WARRANTIES_VIEW"],
    featureFlag: "WARRANTIES",
    visibleInNav: true,
    navGroup: "assets",
    navOrder: 10,
  },

  // ============================================================================
  // ASSET CATALOG GROUP
  // ============================================================================
  {
    path: "/asset-categories",
    label: "Asset Categories",
    icon: FolderTree,
    description: "Asset category management - view all categories",
    requiredPermissions: ["ASSET_CATEGORIES_VIEW"],
    featureFlag: "ASSETS",
    visibleInNav: true,
    navGroup: "asset-catalog",
    navOrder: 1,
  },
  {
    path: "/asset-categories/[id]",
    label: "Asset Category Details",
    icon: FolderTree,
    description: "View specific asset category with custom fields",
    requiredPermissions: ["ASSET_CATEGORIES_VIEW"],
    featureFlag: "ASSETS",
    visibleInNav: false,
    isChildRoute: true,
    parentRoute: "/asset-categories",
  },
  {
    path: "/asset-models",
    label: "Asset Models",
    icon: Layers,
    description: "Asset model management - view all asset models",
    requiredPermissions: ["ASSET_MODELS_VIEW"],
    featureFlag: "ASSETS",
    visibleInNav: true,
    navGroup: "asset-catalog",
    navOrder: 2,
  },
  {
    path: "/asset-models/[id]",
    label: "Asset Model Details",
    icon: Layers,
    description: "View specific asset model details with assets and statistics",
    requiredPermissions: ["ASSET_MODELS_VIEW"],
    featureFlag: "ASSETS",
    visibleInNav: false,
    isChildRoute: true,
    parentRoute: "/asset-models",
  },
  {
    path: "/field-definitions",
    label: "Custom Fields",
    icon: FileCode,
    description: "Custom field definitions for dynamic attributes",
    requiredPermissions: ["FIELD_DEFINITIONS_VIEW"],
    featureFlag: "ASSETS",
    visibleInNav: true,
    navGroup: "asset-catalog",
    navOrder: 3,
  },
  {
    path: "/lifecycle-states",
    label: "Lifecycle States",
    icon: Workflow,
    description: "Asset lifecycle state management",
    requiredPermissions: ["LIFECYCLE_STATES_VIEW"],
    featureFlag: "ASSETS",
    visibleInNav: true,
    navGroup: "asset-catalog",
    navOrder: 4,
  },

  // ============================================================================
  // SERVICES & CMDB GROUP
  // ============================================================================
  {
    path: "/services",
    label: "Services",
    icon: Gauge,
    description: "IT service catalog and management",
    requiredPermissions: ["SERVICES_VIEW"],
    featureFlag: "SERVICE_MANAGEMENT",
    visibleInNav: true,
    navGroup: "services-cmdb",
    navOrder: 1,
  },
  {
    path: "/business-processes",
    label: "Business Processes",
    icon: Workflow,
    description: "Business process management",
    requiredPermissions: ["BUSINESS_PROCESSES_VIEW"],
    featureFlag: "SERVICE_MANAGEMENT",
    visibleInNav: true,
    navGroup: "services-cmdb",
    navOrder: 2,
  },
  {
    path: "/configuration-items",
    label: "Configuration Items",
    icon: HardDrive,
    description: "CMDB configuration item management",
    requiredPermissions: ["CONFIGURATION_ITEMS_VIEW"],
    featureFlag: "CMDB",
    visibleInNav: true,
    navGroup: "services-cmdb",
    navOrder: 3,
  },
  {
    path: "/ci-classes",
    label: "CI Classes",
    icon: Binary,
    description: "Configuration item class definitions",
    requiredPermissions: ["CI_CLASSES_VIEW"],
    featureFlag: "CMDB",
    visibleInNav: true,
    navGroup: "services-cmdb",
    navOrder: 4,
  },
  {
    path: "/ci-relationships",
    label: "CI Relationships",
    icon: Network,
    description: "Configuration item relationship mapping",
    requiredPermissions: ["CI_RELATIONSHIPS_VIEW"],
    featureFlag: "CMDB",
    visibleInNav: true,
    navGroup: "services-cmdb",
    navOrder: 5,
  },

  // ============================================================================
  // COMPLIANCE & GOVERNANCE GROUP
  // ============================================================================
  {
    path: "/contracts",
    label: "Contracts",
    icon: FileText,
    description: "Contract management",
    requiredPermissions: ["CONTRACTS_VIEW"],
    featureFlag: "CONTRACT_MANAGEMENT",
    visibleInNav: true,
    navGroup: "compliance",
    navOrder: 1,
  },
  {
    path: "/contract-types",
    label: "Contract Types",
    icon: FileCode,
    description: "Contract type management",
    requiredPermissions: ["CONTRACT_TYPES_VIEW"],
    featureFlag: "CONTRACT_MANAGEMENT",
    visibleInNav: true,
    navGroup: "compliance",
    navOrder: 2,
  },
  {
    path: "/license-products",
    label: "License Products",
    icon: FileKey,
    description: "License product management",
    requiredPermissions: ["LICENSE_PRODUCTS_VIEW"],
    featureFlag: "LICENSE_MANAGEMENT",
    visibleInNav: true,
    navGroup: "compliance",
    navOrder: 3,
  },
  {
    path: "/license-entitlements",
    label: "License Entitlements",
    icon: ShoppingCart,
    description: "License entitlement management",
    requiredPermissions: ["LICENSE_ENTITLEMENTS_VIEW"],
    featureFlag: "LICENSE_MANAGEMENT",
    visibleInNav: true,
    navGroup: "compliance",
    navOrder: 4,
  },
  {
    path: "/license-allocations",
    label: "License Allocations",
    icon: ClipboardList,
    description: "License allocation tracking",
    requiredPermissions: ["LICENSE_ALLOCATIONS_VIEW"],
    featureFlag: "LICENSE_MANAGEMENT",
    visibleInNav: true,
    navGroup: "compliance",
    navOrder: 5,
  },
  {
    path: "/data-domains",
    label: "Data Domains",
    icon: FolderTree,
    description: "Data domain management for governance",
    requiredPermissions: ["DATA_DOMAINS_VIEW"],
    featureFlag: "GOVERNANCE",
    visibleInNav: true,
    navGroup: "compliance",
    navOrder: 6,
  },
  {
    path: "/data-ownerships",
    label: "Data Ownerships",
    icon: Users,
    description: "Data ownership assignment management",
    requiredPermissions: ["DATA_OWNERSHIPS_VIEW"],
    featureFlag: "GOVERNANCE",
    visibleInNav: true,
    navGroup: "compliance",
    navOrder: 7,
  },
  {
    path: "/attachment-types",
    label: "Attachment Types",
    icon: FileCode,
    description: "Attachment type management",
    requiredPermissions: ["ATTACHMENT_TYPES_VIEW"],
    featureFlag: "ATTACHMENTS",
    visibleInNav: true,
    navGroup: "compliance",
    navOrder: 8,
  },
  {
    path: "/attachments",
    label: "Attachments",
    icon: FileText,
    description: "Attachment management across all entities",
    requiredPermissions: ["ATTACHMENTS_VIEW"],
    featureFlag: "ATTACHMENTS",
    visibleInNav: true,
    navGroup: "compliance",
    navOrder: 9,
  },

  // ============================================================================
  // SYSTEM & ADMIN GROUP
  // ============================================================================
  {
    path: "/admin",
    label: "Admin Dashboard",
    icon: Shield,
    description: "Admin dashboard - requires any admin permission",
    requiredPermissions: ["USERS_MANAGE", "ROLES_VIEW", "PERMISSIONS_VIEW"],
    visibleInNav: true,
    navGroup: "system",
    navOrder: 1,
  },
  {
    path: "/admin/system-setup",
    label: "System Setup",
    icon: Settings,
    description: "System setup and database operations",
    requiredPermissions: ["USERS_MANAGE"],
    visibleInNav: true,
    navGroup: "system",
    navOrder: 2,
  },
  {
    path: "/admin/roles",
    label: "System Roles",
    icon: Shield,
    description: "Role management - view, create, edit, delete roles",
    requiredPermissions: ["ROLES_VIEW"],
    visibleInNav: true,
    navGroup: "system",
    navOrder: 3,
  },
  {
    path: "/admin/roles/new",
    label: "Create Role",
    icon: Shield,
    description: "Create new role",
    requiredPermissions: ["ROLES_CREATE"],
    visibleInNav: false,
    isChildRoute: true,
    parentRoute: "/admin/roles",
  },
  {
    path: "/admin/roles/[id]",
    label: "Role Details",
    icon: Shield,
    description: "View/edit specific role",
    requiredPermissions: ["ROLES_VIEW"],
    visibleInNav: false,
    isChildRoute: true,
    parentRoute: "/admin/roles",
  },
  {
    path: "/admin/roles/[id]/permissions",
    label: "Role Permissions",
    icon: Shield,
    description: "Assign permissions to role",
    requiredPermissions: ["ROLES_MANAGE"],
    visibleInNav: false,
    isChildRoute: true,
    parentRoute: "/admin/roles",
  },
  {
    path: "/admin/permissions",
    label: "Permissions",
    icon: ShieldCheck,
    description:
      "Permission management - view, create, edit, delete permissions",
    requiredPermissions: ["PERMISSIONS_VIEW"],
    visibleInNav: true,
    navGroup: "system",
    navOrder: 4,
  },
  {
    path: "/admin/permissions/new",
    label: "Create Permission",
    icon: ShieldCheck,
    description: "Create new permission",
    requiredPermissions: ["PERMISSIONS_CREATE"],
    visibleInNav: false,
    isChildRoute: true,
    parentRoute: "/admin/permissions",
  },
  {
    path: "/admin/permissions/[id]",
    label: "Permission Details",
    icon: ShieldCheck,
    description: "View/edit specific permission",
    requiredPermissions: ["PERMISSIONS_VIEW"],
    visibleInNav: false,
    isChildRoute: true,
    parentRoute: "/admin/permissions",
  },
  {
    path: "/admin/users",
    label: "Users",
    icon: Users,
    description: "User management - view users and their roles",
    requiredPermissions: ["USERS_VIEW"],
    visibleInNav: true,
    navGroup: "system",
    navOrder: 5,
  },
  {
    path: "/admin/users/[id]",
    label: "User Details",
    icon: Users,
    description: "View specific user details",
    requiredPermissions: ["USERS_VIEW"],
    visibleInNav: false,
    isChildRoute: true,
    parentRoute: "/admin/users",
  },
  {
    path: "/admin/users/[id]/roles",
    label: "User Roles",
    icon: Users,
    description: "Assign roles to user",
    requiredPermissions: ["USERS_MANAGE"],
    visibleInNav: false,
    isChildRoute: true,
    parentRoute: "/admin/users",
  },
  {
    path: "/admin/audit-logs",
    label: "Audit Logs",
    icon: AlertCircle,
    description: "View audit logs of all RBAC changes",
    requiredPermissions: ["AUDIT_LOGS_VIEW"],
    visibleInNav: true,
    navGroup: "system",
    navOrder: 6,
  },
  {
    path: "/admin/features",
    label: "Feature Flags",
    icon: Settings,
    description: "Feature flag management",
    requiredPermissions: ["FEATURE_FLAGS_MANAGE"],
    visibleInNav: true,
    navGroup: "system",
    navOrder: 7,
  },
  {
    path: "/rbac-analytics",
    label: "RBAC Analytics",
    icon: BarChart3,
    description: "RBAC analytics dashboard",
    requiredPermissions: ["ROLES_VIEW"],
    visibleInNav: false,
    navGroup: "system",
    navOrder: 8,
  },
  {
    path: "/settings",
    label: "Settings",
    icon: Settings,
    description: "Application settings",
    requiredPermissions: ["SETTINGS_VIEW"],
    visibleInNav: false,
    navGroup: "main",
  },
  {
    path: "/settings/account",
    label: "Account Settings",
    icon: Settings,
    description: "Account settings",
    requiredPermissions: ["SETTINGS_VIEW"],
    visibleInNav: false,
    isChildRoute: true,
    parentRoute: "/settings",
  },
  {
    path: "/settings/preferences",
    label: "Preferences",
    icon: Settings,
    description: "User preferences",
    requiredPermissions: ["SETTINGS_VIEW"],
    visibleInNav: false,
    isChildRoute: true,
    parentRoute: "/settings",
  },
  {
    path: "/settings/security",
    label: "Security Settings",
    icon: Settings,
    description: "Security settings - manage passwords, 2FA, etc.",
    requiredPermissions: ["SETTINGS_MANAGE"],
    visibleInNav: false,
    isChildRoute: true,
    parentRoute: "/settings",
  },

  // ============================================================================
  // REFERENCE ROUTES (Hidden from UI)
  // ============================================================================
  {
    path: "/tasks",
    label: "Tasks",
    icon: CheckSquare,
    description: "Manage your tasks",
    requiredPermissions: ["TASKS_VIEW"],
    visibleInNav: false, // Reference implementation only
    navGroup: "main",
  },
  {
    path: "/tasks/new",
    label: "Create Task",
    icon: CheckSquare,
    description: "Create new task",
    requiredPermissions: ["TASKS_CREATE"],
    visibleInNav: false,
    isChildRoute: true,
    parentRoute: "/tasks",
  },
  {
    path: "/tasks/[id]",
    label: "Task Details",
    icon: CheckSquare,
    description: "View specific task (ownership checks apply for editing)",
    requiredPermissions: ["TASKS_VIEW"],
    visibleInNav: false,
    isChildRoute: true,
    parentRoute: "/tasks",
  },
  {
    path: "/tasks/active",
    label: "Active Tasks",
    icon: CheckSquare,
    description: "View active tasks",
    requiredPermissions: ["TASKS_VIEW"],
    visibleInNav: false,
    isChildRoute: true,
    parentRoute: "/tasks",
  },
  {
    path: "/tasks/completed",
    label: "Completed Tasks",
    icon: CheckSquare,
    description: "View completed tasks",
    requiredPermissions: ["TASKS_VIEW"],
    visibleInNav: false,
    isChildRoute: true,
    parentRoute: "/tasks",
  },
  {
    path: "/tasks/archived",
    label: "Archived Tasks",
    icon: CheckSquare,
    description: "View archived tasks",
    requiredPermissions: ["TASKS_VIEW"],
    visibleInNav: false,
    isChildRoute: true,
    parentRoute: "/tasks",
  },
  {
    path: "/team",
    label: "Team",
    icon: Users,
    description: "Team members list",
    requiredPermissions: ["USERS_VIEW"],
    visibleInNav: false,
    navGroup: "main",
  },
  {
    path: "/team/roles",
    label: "Team Roles",
    icon: Users,
    description: "Team role management",
    requiredPermissions: ["USERS_MANAGE"],
    visibleInNav: false,
    isChildRoute: true,
    parentRoute: "/team",
  },
];

/**
 * Public routes that don't require authentication
 */
export const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/unauthorized",
  "/api/auth",
  "/health",
] as const;

/**
 * Get all routes for a specific navigation group
 */
export function getRoutesByNavGroup(groupId: NavGroupId): RouteDefinition[] {
  return ROUTES_MANIFEST.filter((route) => route.navGroup === groupId).sort(
    (a, b) => (a.navOrder || 999) - (b.navOrder || 999),
  );
}

/**
 * Get all routes that should be visible in navigation
 */
export function getVisibleNavRoutes(): RouteDefinition[] {
  return ROUTES_MANIFEST.filter((route) => route.visibleInNav === true);
}

/**
 * Get route definition by path
 */
export function getRouteByPath(path: string): RouteDefinition | undefined {
  return ROUTES_MANIFEST.find((route) => route.path === path);
}

/**
 * Get all child routes for a parent route
 */
export function getChildRoutes(parentPath: string): RouteDefinition[] {
  return ROUTES_MANIFEST.filter((route) => route.parentRoute === parentPath);
}

/**
 * Get all protected route paths
 */
export function getAllProtectedPaths(): string[] {
  return ROUTES_MANIFEST.map((route) => route.path);
}
