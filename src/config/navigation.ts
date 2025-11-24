/**
 * Centralized Navigation Configuration
 *
 * Advanced features:
 * - ✅ Navigation groups with headers
 * - ✅ Collapsible groups
 * - ✅ Multi-level nested navigation
 * - ✅ Role-based permissions
 * - ✅ Real-time badge updates
 * - ✅ Dynamic visibility
 *
 * Usage:
 * ```tsx
 * import { getVisibleNavGroups } from "@/config/navigation";
 * const navGroups = getVisibleNavGroups();
 * ```
 */

import {
  Home,
  CheckSquare,
  Shield,
  Package,
  GitBranch,
  Activity,
  Building2,
  UserCircle,
  MapPin,
  ContactRound,
  UserCog,
  Settings2,
  ArrowRightLeft,
  Warehouse,
  TrendingUp,
  UserCheck,
  LayoutDashboard,
  FileText,
  Wrench,
  ClipboardList,
  Database,
  Lightbulb,
  ShieldCheck,
  Trash2,
  Boxes,
  CalendarClock,
  FileSignature,
  FileKey,
  Key,
  Award,
  UserSquare2,
  Globe2,
  LockKeyhole,
  Bell,
  ServerCog,
  Cloud,
  FolderLock,
  Users,
  CheckCircle2,
  Paperclip,
  FileType,
  Server,
  GitPullRequest,
  type LucideIcon,
} from "lucide-react";
import {
  PERMISSIONS,
  type PermissionKey,
} from "@/core/domain/value-objects/permission-key";

export interface NavItem {
  /** Display title for the navigation item */
  title: string;
  /** Route path */
  href: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Optional badge text (e.g., "New", "Beta", count) - use "dynamic" for real-time updates */
  badge?: string | "dynamic";
  /** Optional description for tooltips or accessibility */
  description?: string;
  /** Whether the item should be shown (feature flag) */
  visible?: boolean;
  /** Required permission to view this item */
  permission?: PermissionKey;
  /** Required feature flag to view this item */
  featureFlag?: string;
  /** Child navigation items (for nested navigation) */
  children?: NavItem[];
  /** Whether children are expanded by default */
  defaultExpanded?: boolean;
}

export interface NavGroup {
  /** Group identifier (required for managing state) */
  id: string;
  /** Group title/header */
  title: string;
  /** Navigation items in this group */
  items: NavItem[];
  /** Whether the group should be shown */
  visible?: boolean;
  /** Whether the group is collapsible */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
  /** Required permission to view this group */
  permission?: PermissionKey;
}

/**
 * Navigation groups configuration
 * Organize navigation items into logical sections with advanced features
 */
export const navGroups: NavGroup[] = [
  // Main navigation - Always visible
  {
    id: "main",
    title: "Main",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: Home,
        description: "Overview and statistics",
        permission: PERMISSIONS.DASHBOARD_VIEW,
      },
      {
        title: "Analytics",
        href: "/analytics",
        icon: LayoutDashboard,
        description: "Asset statistics and charts",
        permission: PERMISSIONS.ASSETS_VIEW,
      },
      {
        title: "Reports",
        href: "/reports",
        icon: FileText,
        description: "Asset management reports",
        permission: PERMISSIONS.ASSETS_VIEW,
      },
      // Task entity - kept as architectural reference (hidden from UI)
      // Route still accessible at /tasks for code reference
      {
        title: "Tasks",
        href: "/tasks",
        icon: CheckSquare,
        description: "Manage your tasks",
        permission: PERMISSIONS.TASKS_VIEW,
        visible: false, // Hidden from navigation - reference implementation only
      },
    ],
    visible: true,
    collapsible: false, // Always visible
  },

  // Asset Management - Core asset entities
  {
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
  },

  // Asset Operations - Operational workflows
  {
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
  },

  // Inventory
  {
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
  },

  // Maintenance
  {
    id: "maintenance",
    title: "Maintenance",
    items: [
      {
        title: "Schedules",
        href: "/maintenance/schedules",
        icon: Wrench,
        description: "Preventive maintenance schedules",
        permission: PERMISSIONS.MAINTENANCE_SCHEDULES_VIEW,
        featureFlag: "MAINTENANCE",
      },
      {
        title: "Records",
        href: "/maintenance/records",
        icon: ClipboardList,
        description: "Maintenance history and work logs",
        permission: PERMISSIONS.MAINTENANCE_RECORDS_VIEW,
        featureFlag: "MAINTENANCE",
      },
    ],
    visible: true,
    collapsible: true,
    defaultCollapsed: false,
  },

  // CMDB (Configuration Management Database)
  {
    id: "cmdb",
    title: "CMDB",
    items: [
      {
        title: "CI Classes",
        href: "/ci-classes",
        icon: Database,
        description: "Configuration item class definitions",
        permission: PERMISSIONS.CI_CLASSES_VIEW,
        featureFlag: "CMDB",
      },
      {
        title: "Configuration Items",
        href: "/configuration-items",
        icon: Database,
        description: "Manage configuration items",
        permission: PERMISSIONS.CONFIGURATION_ITEMS_VIEW,
        featureFlag: "CMDB",
      },
      {
        title: "CI Relationships",
        href: "/ci-relationships",
        icon: GitBranch,
        description: "Manage CI dependencies and relationships",
        permission: PERMISSIONS.CI_RELATIONSHIPS_VIEW,
        featureFlag: "CMDB",
      },
      {
        title: "Relationship Types",
        href: "/relationship-types",
        icon: ArrowRightLeft,
        description: "Define relationship types",
        permission: PERMISSIONS.RELATIONSHIP_TYPES_VIEW,
        featureFlag: "CMDB",
      },
    ],
    visible: true,
    collapsible: true,
    defaultCollapsed: false,
  },

  // Service Management
  {
    id: "service-management",
    title: "Service Management",
    items: [
      {
        title: "Services",
        href: "/services",
        icon: Server,
        description: "IT services and application catalog",
        permission: PERMISSIONS.SERVICES_VIEW,
        featureFlag: "SERVICES",
      },
      {
        title: "Business Processes",
        href: "/business-processes",
        icon: GitPullRequest,
        description: "Business processes linked to services",
        permission: PERMISSIONS.BUSINESS_PROCESSES_VIEW,
        featureFlag: "SERVICES",
      },
    ],
    visible: true,
    collapsible: true,
    defaultCollapsed: false,
  },

  // Contracts
  {
    id: "contracts",
    title: "Contracts",
    items: [
      {
        title: "Contract Types",
        href: "/contract-types",
        icon: FileKey,
        description: "Manage contract types and templates",
        permission: PERMISSIONS.CONTRACT_TYPES_VIEW,
        featureFlag: "CONTRACTS",
      },
      {
        title: "Contracts",
        href: "/contracts",
        icon: FileSignature,
        description: "Manage vendor and service contracts",
        permission: PERMISSIONS.CONTRACTS_VIEW,
        featureFlag: "CONTRACTS",
      },
    ],
    visible: true,
    collapsible: true,
    defaultCollapsed: false,
  },

  // Licenses
  {
    id: "licenses",
    title: "Licenses",
    items: [
      {
        title: "License Products",
        href: "/license-products",
        icon: Key,
        description: "Manage software license products",
        permission: PERMISSIONS.LICENSE_PRODUCTS_VIEW,
        featureFlag: "LICENSES",
      },
      {
        title: "License Entitlements",
        href: "/license-entitlements",
        icon: Award,
        description: "Manage purchased license entitlements",
        permission: PERMISSIONS.LICENSE_ENTITLEMENTS_VIEW,
        featureFlag: "LICENSES",
      },
      {
        title: "License Allocations",
        href: "/license-allocations",
        icon: UserSquare2,
        description: "Track license allocations to users and assets",
        permission: PERMISSIONS.LICENSE_ALLOCATIONS_VIEW,
        featureFlag: "LICENSES",
      },
    ],
    visible: true,
    collapsible: true,
    defaultCollapsed: false,
  },

  // Governance - Data classification and compliance
  {
    id: "governance",
    title: "Governance",
    items: [
      {
        title: "Data Domains",
        href: "/data-domains",
        icon: FolderLock,
        description:
          "Manage data classification domains (PII, Financial, etc.)",
        permission: PERMISSIONS.DATA_DOMAINS_VIEW,
        featureFlag: "GOVERNANCE",
      },
      {
        title: "Data Ownerships",
        href: "/data-ownerships",
        icon: Users,
        description: "Assign data ownership for compliance",
        permission: PERMISSIONS.DATA_OWNERSHIPS_VIEW,
        featureFlag: "GOVERNANCE",
      },
      {
        title: "Verification Campaigns",
        href: "/verification-campaigns",
        icon: CheckCircle2,
        description: "Schedule and track compliance verification campaigns",
        permission: PERMISSIONS.VERIFICATION_CAMPAIGNS_VIEW,
        featureFlag: "GOVERNANCE",
      },
    ],
    visible: true,
    collapsible: true,
    defaultCollapsed: false,
  },

  // Attachments - File management
  {
    id: "attachments",
    title: "Attachments",
    items: [
      {
        title: "Attachment Types",
        href: "/attachment-types",
        icon: FileType,
        description: "Configure attachment types and validation rules",
        permission: PERMISSIONS.ATTACHMENT_TYPES_VIEW,
        featureFlag: "ATTACHMENTS",
      },
      {
        title: "All Attachments",
        href: "/attachments",
        icon: Paperclip,
        description: "View all attachments across entities",
        permission: PERMISSIONS.ATTACHMENTS_VIEW,
        featureFlag: "ATTACHMENTS",
      },
    ],
    visible: true,
    collapsible: true,
    defaultCollapsed: false,
  },

  // Lifecycle
  {
    id: "lifecycle",
    title: "Lifecycle",
    items: [
      {
        title: "Models",
        href: "/lifecycle-models",
        icon: GitBranch,
        description: "Manage lifecycle models",
        permission: PERMISSIONS.LIFECYCLE_MODELS_VIEW,
        featureFlag: "FOUNDATION",
      },
      {
        title: "States",
        href: "/lifecycle-states",
        icon: Activity,
        description: "Manage lifecycle states",
        permission: PERMISSIONS.LIFECYCLE_STATES_VIEW,
        featureFlag: "FOUNDATION",
      },
      {
        title: "Transitions",
        href: "/lifecycle-transitions",
        icon: ArrowRightLeft,
        description: "Manage state transitions",
        permission: PERMISSIONS.LIFECYCLE_TRANSITIONS_VIEW,
        featureFlag: "FOUNDATION",
      },
    ],
    visible: true,
    collapsible: true,
    defaultCollapsed: false,
  },

  // Organization - Consolidated foundation entities
  {
    id: "organization",
    title: "Organization",
    items: [
      {
        title: "Vendors",
        href: "/vendors",
        icon: Package,
        description: "Manage vendors",
        permission: PERMISSIONS.VENDORS_VIEW,
        featureFlag: "FOUNDATION",
      },
      {
        title: "Vendor Contacts",
        href: "/vendor-contacts",
        icon: ContactRound,
        description: "Manage vendor contacts",
        permission: PERMISSIONS.VENDOR_CONTACTS_VIEW,
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
        title: "Locations",
        href: "/locations",
        icon: MapPin,
        description: "Manage locations",
        permission: PERMISSIONS.LOCATIONS_VIEW,
        featureFlag: "FOUNDATION",
      },
      {
        title: "Persons",
        href: "/persons",
        icon: UserCircle,
        description: "Manage persons",
        permission: PERMISSIONS.PERSONS_VIEW,
        featureFlag: "FOUNDATION",
      },
      {
        title: "Role Assignments",
        href: "/person-role-assignments",
        icon: UserCog,
        description: "Manage person role assignments",
        permission: PERMISSIONS.PERSON_ROLE_ASSIGNMENTS_VIEW,
        featureFlag: "FOUNDATION",
      },
    ],
    visible: true,
    collapsible: true,
    defaultCollapsed: false,
  },

  // Configuration
  {
    id: "configuration",
    title: "Configuration",
    items: [
      {
        title: "Field Definitions",
        href: "/field-definitions",
        icon: Settings2,
        description: "Manage custom field definitions",
        permission: PERMISSIONS.FIELD_DEFINITIONS_VIEW,
        featureFlag: "FOUNDATION",
      },
      {
        title: "FX Rates",
        href: "/fx-rates",
        icon: TrendingUp,
        description: "Manage exchange rates for multi-currency support",
        permission: PERMISSIONS.FX_RATES_VIEW,
        featureFlag: "FX_RATES",
      },
    ],
    visible: true,
    collapsible: true,
    defaultCollapsed: false,
  },

  // System Settings - Platform configuration
  {
    id: "system-settings",
    title: "System Settings",
    items: [
      {
        title: "Platform Settings",
        href: "/settings/platform",
        icon: Globe2,
        description: "Platform identity and general configuration",
        permission: PERMISSIONS.SETTINGS_MANAGE,
      },
      {
        title: "Authentication",
        href: "/settings/authentication",
        icon: LockKeyhole,
        description: "Authentication and access control policies",
        permission: PERMISSIONS.SETTINGS_MANAGE,
      },
      {
        title: "Notifications",
        href: "/settings/notifications",
        icon: Bell,
        description: "Email and Slack notification settings",
        permission: PERMISSIONS.SETTINGS_MANAGE,
      },
      {
        title: "Operations",
        href: "/settings/operations",
        icon: ServerCog,
        description: "Maintenance windows and retention policies",
        permission: PERMISSIONS.SETTINGS_MANAGE,
      },
      {
        title: "Integrations",
        href: "/settings/integrations",
        icon: Cloud,
        description: "External system integrations and webhooks",
        permission: PERMISSIONS.SETTINGS_MANAGE,
      },
    ],
    visible: true,
    collapsible: true,
    defaultCollapsed: false,
    permission: PERMISSIONS.SETTINGS_MANAGE,
  },

  // Admin Section - Permission-based, collapsible
  {
    id: "admin",
    title: "Administration",
    items: [
      {
        title: "Admin Dashboard",
        href: "/admin",
        icon: Shield,
        description: "System administration and settings",
        permission: PERMISSIONS.USERS_MANAGE,
      },
      {
        title: "System Setup",
        href: "/admin/system-setup",
        icon: ServerCog,
        description: "System health, diagnostics, and database operations",
        permission: PERMISSIONS.USERS_MANAGE,
      },
      {
        title: "RBAC Analytics",
        href: "/rbac-analytics",
        icon: LayoutDashboard,
        description: "Role and permission usage statistics",
        permission: PERMISSIONS.ROLES_VIEW,
      },
      {
        title: "Data Import",
        href: "/data-import",
        icon: Database,
        description: "Universal data importer for all entities",
        permission: PERMISSIONS.DATA_IMPORT_MANAGE,
        featureFlag: "DATA_IMPORT",
      },
      {
        title: "Feature Flags",
        href: "/admin/features",
        icon: Settings2,
        description: "Manage feature flags and system capabilities",
        permission: PERMISSIONS.FEATURE_FLAGS_MANAGE,
      },
    ],
    visible: true,
    collapsible: true,
    defaultCollapsed: false,
  },

  // Documentation - Help and guides for users
  {
    id: "documentation",
    title: "Documentation",
    items: [
      {
        title: "Getting Started",
        href: "/docs/getting-started",
        icon: Lightbulb,
        description: "Foundation layer and data management basics",
      },
      {
        title: "Entity Reference",
        href: "/docs/entities",
        icon: Database,
        description: "Complete guide to all entities",
      },
      {
        title: "Workflows",
        href: "/docs/workflows",
        icon: GitBranch,
        description: "Common workflows and guides",
      },
      {
        title: "Admin Guide",
        href: "/docs/admin-guide",
        icon: ShieldCheck,
        description: "RBAC and user management",
      },
    ],
    visible: false,
    collapsible: true,
    defaultCollapsed: false,
  },
];

/**
 * Check if item should be visible based on permissions and feature flags
 * @param item - Navigation item to check
 * @param userPermissions - Array of user's permissions
 * @param enabledFeatures - Set of enabled feature names (optional)
 */
function checkItemPermission(
  item: NavItem,
  userPermissions: PermissionKey[],
  enabledFeatures?: Set<string>,
): boolean {
  // Check permission (if specified)
  if (item.permission && !userPermissions.includes(item.permission)) {
    return false;
  }

  // Check feature flag (if specified and enabledFeatures provided)
  if (item.featureFlag && enabledFeatures) {
    if (!enabledFeatures.has(item.featureFlag)) {
      return false;
    }
  }

  return true;
}

/**
 * Check if group should be visible based on permissions
 * @param group - Navigation group to check
 * @param userPermissions - Array of user's permissions
 */
function checkGroupPermission(
  group: NavGroup,
  userPermissions: PermissionKey[],
): boolean {
  if (!group.permission) return true;
  return userPermissions.includes(group.permission);
}

/**
 * Filter items recursively based on visibility, permissions, and feature flags
 * @param items - Navigation items to filter
 * @param userPermissions - Array of user's permissions
 * @param enabledFeatures - Set of enabled feature names (optional)
 */
function filterItems(
  items: NavItem[],
  userPermissions: PermissionKey[],
  enabledFeatures?: Set<string>,
): NavItem[] {
  return items
    .filter(
      (item) =>
        item.visible !== false &&
        checkItemPermission(item, userPermissions, enabledFeatures),
    )
    .map((item) => {
      if (item.children) {
        const filteredChildren = filterItems(
          item.children,
          userPermissions,
          enabledFeatures,
        );
        return {
          ...item,
          children: filteredChildren.length > 0 ? filteredChildren : undefined,
        };
      }
      return item;
    });
}

/**
 * Get visible navigation groups
 * Filters based on visibility, permissions, feature flags, and removes empty groups
 *
 * @param userPermissions - Array of user's permissions
 * @param options - Configuration options
 * @param options.showUnauthenticated - If true, shows all navigation (for unauthenticated/loading state)
 * @param options.enabledFeatures - Set of enabled feature names (for feature flag filtering)
 *
 * Behavior:
 * - If showUnauthenticated=true: Show all navigation (unauthenticated state)
 * - If userPermissions is empty array: Show nothing (user has no permissions)
 * - Otherwise: Filter by permissions and feature flags
 */
export const getVisibleNavGroups = (
  userPermissions: PermissionKey[],
  options: {
    showUnauthenticated?: boolean;
    enabledFeatures?: Set<string>;
  } = {},
): NavGroup[] => {
  // If explicitly showing unauthenticated state, return all navigation
  if (options.showUnauthenticated) {
    return navGroups.filter((group) => group.visible !== false);
  }

  // If empty permissions array (user loaded but has no permissions), show nothing
  // This prevents "show everything" behavior for users with zero permissions
  if (userPermissions.length === 0) {
    return [];
  }

  // Filter by permissions and feature flags
  return navGroups
    .filter(
      (group) =>
        group.visible !== false && checkGroupPermission(group, userPermissions),
    )
    .map((group) => ({
      ...group,
      items: filterItems(group.items, userPermissions, options.enabledFeatures),
    }))
    .filter((group) => group.items.length > 0); // Remove empty groups
};

/**
 * Legacy flat navigation items (for backward compatibility)
 * Flattens all groups into a single array, excluding children
 */
export const navItems: NavItem[] = navGroups.flatMap((group) =>
  group.items.map((item) => {
    // Remove children to keep flat structure
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { children, ...flatItem } = item;
    return flatItem;
  }),
);

/**
 * Get all navigation items including nested children (recursive)
 */
function getAllItemsRecursive(items: NavItem[]): NavItem[] {
  return items.flatMap((item) => {
    const { children, ...flatItem } = item;
    if (children) {
      return [flatItem, ...getAllItemsRecursive(children)];
    }
    return [flatItem];
  });
}

/**
 * Get all navigation items (flat, including nested children)
 */
export const getAllNavItems = (): NavItem[] => {
  return navGroups.flatMap((group) => getAllItemsRecursive(group.items));
};

/**
 * Get visible navigation items (flat)
 * Filters out items where visible is explicitly set to false
 *
 * @param userPermissions - Array of user's permissions
 * @param options - Configuration options
 * @param options.showUnauthenticated - If true, shows all navigation (for unauthenticated/loading state)
 */
export const getVisibleNavItems = (
  userPermissions: PermissionKey[],
  options: {
    showUnauthenticated?: boolean;
    enabledFeatures?: Set<string>;
  } = {},
): NavItem[] => {
  if (options.showUnauthenticated) {
    return navItems.filter((item) => item.visible !== false);
  }

  if (userPermissions.length === 0) {
    return [];
  }

  return navItems.filter(
    (item) =>
      item.visible !== false &&
      checkItemPermission(item, userPermissions, options.enabledFeatures),
  );
};

/**
 * Find navigation item by href (including nested items)
 */
export const getNavItemByHref = (href: string): NavItem | undefined => {
  return getAllNavItems().find((item) => item.href === href);
};

/**
 * Check if a path matches a navigation item
 * Handles both exact matches and path prefixes (e.g., /tasks matches /tasks/123)
 */
export const isNavItemActive = (
  navItemHref: string,
  currentPath: string,
): boolean => {
  // Exact match for home
  if (navItemHref === "/") {
    return currentPath === "/";
  }

  // For other routes, check if current path starts with nav item href
  return currentPath.startsWith(navItemHref);
};

/**
 * Check if a path is in the same section (parent route)
 * Used for section highlighting without exact match
 */
export const isNavItemSection = (
  navItemHref: string,
  currentPath: string,
): boolean => {
  // Don't highlight section for home
  if (navItemHref === "/") {
    return false;
  }

  // Check if in same section but not exact match
  return currentPath.startsWith(navItemHref) && currentPath !== navItemHref;
};

/**
 * Check if nav item has children
 */
export const hasChildren = (item: NavItem): boolean => {
  return !!item.children && item.children.length > 0;
};

/**
 * Get default collapsed state for a group
 */
export const getGroupDefaultState = (groupId: string): boolean => {
  const group = navGroups.find((g) => g.id === groupId);
  return group?.defaultCollapsed ?? false;
};

/**
 * Get default expanded state for an item
 */
export const getItemDefaultState = (itemHref: string): boolean => {
  const item = getNavItemByHref(itemHref);
  return item?.defaultExpanded ?? false;
};
