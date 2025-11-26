/**
 * System & Administration Navigation Groups
 *
 * Groups:
 * - System Settings: Platform configuration, authentication, notifications, operations, integrations
 * - Administration: Admin dashboard, system setup, RBAC analytics, data import, feature flags
 * - Documentation: Getting started, entity reference, workflows, admin guide
 */

import {
  Shield,
  Globe2,
  LockKeyhole,
  Bell,
  ServerCog,
  Cloud,
  LayoutDashboard,
  Database,
  Settings2,
  Lightbulb,
  GitBranch,
  ShieldCheck,
} from "lucide-react";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { NavGroup } from "../navigation.types";

export const systemSettingsGroup: NavGroup = {
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
  visible: false,
  collapsible: true,
  defaultCollapsed: true,
  permission: PERMISSIONS.SETTINGS_MANAGE,
};

export const adminGroup: NavGroup = {
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
  defaultCollapsed: true,
};

export const documentationGroup: NavGroup = {
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
  defaultCollapsed: true,
};
