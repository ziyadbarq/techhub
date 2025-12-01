/**
 * Foundation Navigation Group
 *
 * Consolidated foundational setup data (organization, vendors, lifecycle, configuration)
 * ordered by the typical data-entry flow. Asset-only catalog items live in the
 * Asset Catalog group to keep scopes narrow.
 */

import {
  GitBranch,
  Activity,
  ArrowRightLeft,
  Package,
  ContactRound,
  Building2,
  MapPin,
  UserCircle,
  UserCog,
  Settings2,
  TrendingUp,
} from "lucide-react";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { NavGroup } from "../navigation.types";

export const foundationGroup: NavGroup = {
  id: "foundation",
  title: "Foundation",
  items: [
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
    {
      title: "Role Assignments",
      href: "/person-role-assignments",
      icon: UserCog,
      description: "Manage person role assignments",
      permission: PERMISSIONS.PERSON_ROLE_ASSIGNMENTS_VIEW,
      featureFlag: "FOUNDATION",
    },
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
      title: "Lifecycle Models",
      href: "/lifecycle-models",
      icon: GitBranch,
      description: "Manage lifecycle models",
      permission: PERMISSIONS.LIFECYCLE_MODELS_VIEW,
      featureFlag: "FOUNDATION",
    },
    {
      title: "Lifecycle States",
      href: "/lifecycle-states",
      icon: Activity,
      description: "Manage lifecycle states",
      permission: PERMISSIONS.LIFECYCLE_STATES_VIEW,
      featureFlag: "FOUNDATION",
    },
    {
      title: "Lifecycle Transitions",
      href: "/lifecycle-transitions",
      icon: ArrowRightLeft,
      description: "Manage state transitions",
      permission: PERMISSIONS.LIFECYCLE_TRANSITIONS_VIEW,
      featureFlag: "FOUNDATION",
    },
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
};
