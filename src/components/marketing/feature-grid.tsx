"use client";

import type { LucideIcon } from "lucide-react";
import {
  Package,
  Warehouse,
  ShieldCheck,
  Workflow,
  Lock,
  Wrench,
  FileText,
  Trash2,
  Network,
  FileSignature,
  PackageCheck,
  CalendarClock,
  Key,
  Settings,
  Webhook,
  RefreshCw,
} from "lucide-react";
import { FeatureCard } from "./feature-card";

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
}

const features: Feature[] = [
  // Compliance & Governance
  {
    icon: Trash2,
    title: "Secure Asset Disposals",
    description:
      "Multi-step approval workflow with sanitization tracking and certificates.",
    features: [
      "Workflow: PENDING → APPROVED → SANITIZED → COMPLETED",
      "Data sanitization checklists",
      "Auto-generated disposal certificates",
      "Multiple approvers support",
    ],
  },
  {
    icon: Network,
    title: "CMDB & Dependencies",
    description: "Map infrastructure relationships for impact analysis.",
    features: [
      "Configuration Items with CI classes",
      "Relationship types (DEPENDS_ON, RUNS_ON, CONNECTED_TO)",
      "Impact analysis for changes",
      "Active/inactive relationship states",
    ],
  },
  {
    icon: FileSignature,
    title: "Contract Management",
    description: "Track vendor agreements and renewal dates.",
    features: [
      "Customizable contract types",
      "Link to Assets, CIs, or Licenses",
      "Renewal alerts",
      "Financial value tracking",
    ],
  },
  {
    icon: Key,
    title: "License Management",
    description: "Track software entitlements and allocations.",
    features: [
      "Metrics: per_device, per_user, per_core, per_vm",
      "Purchased quantities and validity",
      "Allocate to Persons, CIs, or Assets",
      "Available vs. allocated tracking",
    ],
  },

  // Operational Excellence
  {
    icon: Package,
    title: "Asset Tracking",
    description: "Complete lifecycle from procurement to retirement.",
    features: [
      "Tags, serials, purchase details",
      "Assignment history",
      "Depreciation and warranty",
      "Maintenance and disposal integration",
    ],
  },
  {
    icon: PackageCheck,
    title: "Asset Kits",
    description: "Predefined bundles for consistent deployments.",
    features: [
      "Kit templates (New Hire, Conference Room)",
      "Checkout and return workflows",
      "Item status tracking",
      "Partial return support",
    ],
  },
  {
    icon: CalendarClock,
    title: "Asset Reservations",
    description: "Future booking with conflict detection.",
    features: [
      "Date/time range reservations",
      "Conflict detection",
      "Availability checker",
      "Calendar view",
    ],
  },
  {
    icon: Warehouse,
    title: "Inventory Management",
    description: "Real-time stock visibility across locations.",
    features: [
      "Hierarchical stock locations",
      "Movement types: IN, OUT, TRANSFER, ADJUSTMENT",
      "Reason codes and references",
      "Real-time stock levels",
    ],
  },
  {
    icon: Settings,
    title: "Maintenance System",
    description: "Preventive schedules and corrective maintenance tracking.",
    features: [
      "Recurring schedules (daily, weekly, monthly, quarterly, annual)",
      "Auto-generation of maintenance records",
      "Priority levels and resolution tracking",
      "Workflow states with technician assignment",
    ],
  },
  {
    icon: RefreshCw,
    title: "Live MDM Integration",
    description:
      "Real-time sync with Intune and MDM for automated laptop and device tracking.",
    features: [
      "Auto-sync devices from Intune/MDM platforms",
      "Real-time compliance status and policy enforcement",
      "Automated asset creation and updates",
      "Device health monitoring and patch status",
    ],
  },
  {
    icon: Webhook,
    title: "Webhook Automation",
    description:
      "Event-driven integrations for real-time infrastructure asset updates.",
    features: [
      "Configurable webhooks for asset lifecycle events",
      "Real-time notifications to external systems",
      "Custom payload formatting and filtering",
      "Integration with monitoring and ticketing systems",
    ],
  },

  // Security & Access
  {
    icon: FileText,
    title: "Audit Trail",
    description: "Immutable change logs for compliance.",
    features: [
      "26+ entity types tracked",
      "Who, what, when, why documentation",
      "Exportable reports",
      "Tamper-proof logs",
    ],
  },
  {
    icon: Lock,
    title: "RBAC & Permissions",
    description: "Granular access control with temporal roles.",
    features: [
      "Levels: VIEW, CREATE, UPDATE, DELETE, MANAGE",
      "Temporal role assignments",
      "Auto-filtered navigation",
      "Permission inheritance",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Vendor & Warranty",
    description: "Vendor database with warranty tracking.",
    features: [
      "Vendor types and contacts",
      "30-day expiration alerts",
      "Link to assets and contracts",
      "Warranty lifecycle management",
    ],
  },

  // Customization
  {
    icon: Wrench,
    title: "Custom Fields",
    description: "Extend schema without code changes.",
    features: [
      "Data types: text, number, date, boolean, reference",
      "Validation rules (required, min/max, regex)",
      "UI grouping and ordering",
      "Category-specific definitions",
    ],
  },
  {
    icon: Workflow,
    title: "Lifecycle Workflows",
    description: "Customizable state machines.",
    features: [
      "Custom states and transitions",
      "Role-based permissions",
      "Reason codes",
      "Visual designer (planned)",
    ],
  },
];

/**
 * Feature Grid Component
 * Grid layout displaying all key features organized by category
 */
export function FeatureGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {features.map((feature, index) => (
        <FeatureCard key={feature.title} {...feature} index={index} />
      ))}
    </div>
  );
}
