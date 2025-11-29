/**
 * System & Administration Navigation Groups
 *
 * Groups:
 * - Admin & Settings: Admin dashboard, system setup, RBAC analytics, feature flags, and platform settings
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

export const adminSettingsGroup: NavGroup = {
  id: "admin-settings",
  title: "Admin & Settings",
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
      visible: false,
    },
    {
      title: "Feature Flags",
      href: "/admin/features",
      icon: Settings2,
      description: "Manage feature flags and system capabilities",
      permission: PERMISSIONS.FEATURE_FLAGS_MANAGE,
    },
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
  defaultCollapsed: true,
};

export const documentationGroup: NavGroup = {
  id: "documentation",
  title: "Documentation",
  items: [
    {
      title: "Getting Started",
      href: "/docs/getting-started/overview",
      icon: Lightbulb,
      description: "Foundation layer and data management basics",
    },
    {
      title: "Workflows",
      href: "/docs/user-guides/workflows",
      icon: GitBranch,
      description: "Common workflows and guides",
    },
    {
      title: "Admin Guide",
      href: "/docs/admin-guides/overview",
      icon: ShieldCheck,
      description: "RBAC and user management",
      permission: PERMISSIONS.USERS_MANAGE,
    },
    {
      title: "Entity Reference",
      href: "/docs/reference/entities",
      icon: Database,
      description: "Complete guide to all entities",
    },
  ],
  visible: true,
  collapsible: true,
  defaultCollapsed: true,
};
