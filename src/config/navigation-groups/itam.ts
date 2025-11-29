/**
 * Services & CMDB Navigation Group
 *
 * Combines service management, CMDB, and maintenance into a single section.
 */

import {
  Database,
  GitBranch,
  ArrowRightLeft,
  Server,
  GitPullRequest,
  Wrench,
  ClipboardList,
} from "lucide-react";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { NavGroup } from "../navigation.types";

export const servicesCmdbGroup: NavGroup = {
  id: "services-cmdb",
  title: "Services & CMDB",
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
  collapsible: true,
  defaultCollapsed: false,
  visible: true,
};
