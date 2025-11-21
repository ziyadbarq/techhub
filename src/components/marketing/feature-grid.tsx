"use client";

import type { LucideIcon } from "lucide-react";
import {
  Package,
  Warehouse,
  Building2,
  ShieldCheck,
  Workflow,
  Lock,
  Wrench,
  FileText,
} from "lucide-react";
import { FeatureCard } from "./feature-card";

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
}

const features: Feature[] = [
  {
    icon: Package,
    title: "Complete Asset Tracking",
    description:
      "Track devices from procurement to disposal with full lifecycle visibility.",
    features: [
      "Asset tags, serial numbers, and purchase details",
      "Depreciation and financial tracking",
      "Warranty management with expiration alerts",
      "Complete asset history and audit trail",
    ],
  },
  {
    icon: Warehouse,
    title: "Inventory Management",
    description:
      "Real-time visibility into stock levels, locations, and movements.",
    features: [
      "Stock locations and warehouses",
      "Stock movements (IN/OUT/TRANSFER/ADJUSTMENT)",
      "Real-time inventory visibility",
      "Audit trail for every transaction",
    ],
  },
  {
    icon: Building2,
    title: "Organization & Locations",
    description:
      "Manage hierarchical organizational structure and geographical locations.",
    features: [
      "Hierarchical structure (Company → Department → Team)",
      "Geographical locations (Country → Building → Room)",
      "Assignment tracking (who has what, where)",
      "Multi-dimensional asset organization",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Vendor & Warranty Management",
    description:
      "Centralized vendor database with warranty and contract tracking.",
    features: [
      "Vendor database (suppliers, manufacturers, service providers)",
      "Warranty tracking with automated expiration alerts",
      "Contract management and SLA tracking",
      "Vendor contact management",
    ],
  },
  {
    icon: Workflow,
    title: "Lifecycle Management",
    description:
      "Customizable workflows for asset lifecycle states and transitions.",
    features: [
      "Customizable state machines for asset workflows",
      "Automated transitions with approval rules",
      "Status tracking (In Stock, Deployed, Maintenance, Retired)",
      "Role-based transition permissions",
    ],
  },
  {
    icon: Lock,
    title: "Role-Based Access Control",
    description: "Enterprise-grade security with granular permissions.",
    features: [
      "Granular permissions system",
      "Temporal role assignments",
      "Secure access based on organizational role",
      "Complete audit trail of access and changes",
    ],
  },
  {
    icon: Wrench,
    title: "Custom Field Definitions",
    description: "Extend your data model without writing code.",
    features: [
      "Dynamic schema extension",
      "Custom attributes per asset category",
      "Multiple data types (text, number, date, reference)",
      "Validation rules and UI grouping",
    ],
  },
  {
    icon: FileText,
    title: "Full Audit Trail",
    description: "Complete change history for compliance and accountability.",
    features: [
      "Track all changes (who, what, when)",
      "Compliance-ready reporting",
      "Detailed change logs",
      "Exportable audit reports",
    ],
  },
];

/**
 * Feature Grid Component
 * Grid layout displaying all key features
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
