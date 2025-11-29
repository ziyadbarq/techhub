/**
 * System & Administration Navigation Groups
 *
 * Groups:
 * - Admin & Settings: Admin dashboard, system setup, RBAC analytics, feature flags, platform settings, and docs link
 */

import {
  Shield,
  Globe2,
  LockKeyhole,
  Bell,
  ServerCog,
  Cloud,
  LayoutDashboard,
  Settings2,
  BookOpen,
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
    {
      title: "Documentation",
      href: "/docs/getting-started/overview",
      icon: BookOpen,
      description: "Guides, workflows, and references",
      permission: PERMISSIONS.DASHBOARD_VIEW,
      visible: false,
    },
  ],
  visible: true,
  collapsible: true,
  defaultCollapsed: true,
};
