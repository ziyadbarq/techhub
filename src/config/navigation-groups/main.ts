/**
 * Main Navigation Group
 *
 * Core navigation items (Dashboard, Analytics, Reports, etc.)
 * Always visible - not collapsible
 */

import { Home, CheckSquare, LayoutDashboard, FileText } from "lucide-react";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { NavGroup } from "../navigation.types";

export const mainNavGroup: NavGroup = {
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
      visible: false, // Hidden until analytics module is implemented
    },
    {
      title: "Reports",
      href: "/reports",
      icon: FileText,
      description: "Asset management reports",
      permission: PERMISSIONS.ASSETS_VIEW,
      visible: false, // Hidden until reporting module is implemented
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
};
