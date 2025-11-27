/**
 * Foundation Layer Navigation Groups
 *
 * Groups:
 * - Lifecycle: Lifecycle models, states, and transitions
 * - Organization: Vendors, org units, locations, persons, and role assignments
 * - Configuration: Field definitions and FX rates
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

export const lifecycleGroup: NavGroup = {
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
  visible: false, // Hidden for initial deployment - items moved to Setup group
  collapsible: true,
  defaultCollapsed: true,
};

export const organizationGroup: NavGroup = {
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
      visible: false, // Hidden until vendor contacts module is implemented
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
  ],
  visible: false, // Hidden for initial deployment - items moved to Setup group
  collapsible: true,
  defaultCollapsed: true,
};

export const configurationGroup: NavGroup = {
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
      visible: false,
    },
  ],
  visible: false, // Hidden for initial deployment - Field Definitions moved to Setup group
  collapsible: true,
  defaultCollapsed: true,
};
