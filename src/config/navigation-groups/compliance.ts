/**
 * Compliance & Documentation Navigation Groups
 *
 * Groups:
 * - Intune: Microsoft Intune device management and compliance
 * - Contracts: Contract types and management
 * - Licenses: License products, entitlements, and allocations
 * - Governance: Data domains, ownership, and verification campaigns
 * - Attachments: Attachment types and file management
 */

import {
  FileKey,
  FileSignature,
  Key,
  Award,
  UserSquare2,
  FolderLock,
  Users,
  CheckCircle2,
  FileType,
  Paperclip,
  Laptop,
  Shield,
} from "lucide-react";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { NavGroup } from "../navigation.types";

export const intuneGroup: NavGroup = {
  id: "intune",
  title: "Intune",
  items: [
    {
      title: "Managed Devices",
      href: "/intune/devices",
      icon: Laptop,
      description: "View and manage Microsoft Intune devices",
      permission: PERMISSIONS.INTUNE_DEVICES_VIEW,
      featureFlag: "INTUNE",
    },
    {
      title: "Compliance Status",
      href: "/intune/compliance",
      icon: Shield,
      description: "Device compliance monitoring and reports",
      permission: PERMISSIONS.INTUNE_COMPLIANCE_VIEW,
      featureFlag: "INTUNE",
      visible: false, // Coming soon
    },
  ],
  visible: false,
  collapsible: true,
  defaultCollapsed: false,
};

export const contractsGroup: NavGroup = {
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
  visible: false,
  collapsible: true,
  defaultCollapsed: false,
};

export const licensesGroup: NavGroup = {
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
  visible: false,
  collapsible: true,
  defaultCollapsed: false,
};

export const governanceGroup: NavGroup = {
  id: "governance",
  title: "Governance",
  items: [
    {
      title: "Data Domains",
      href: "/data-domains",
      icon: FolderLock,
      description: "Manage data classification domains (PII, Financial, etc.)",
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
      visible: false,
    },
  ],
  visible: false, // Hidden for initial deployment
  collapsible: true,
  defaultCollapsed: true,
};

export const attachmentsGroup: NavGroup = {
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
  visible: false,
  collapsible: true,
  defaultCollapsed: false,
};
