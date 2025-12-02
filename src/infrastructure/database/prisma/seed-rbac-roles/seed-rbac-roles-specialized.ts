/**
 * Specialized Roles
 *
 * Domain-specific specialist roles:
 * - security-officer: Information security and governance
 * - service-owner: IT service catalog management
 * - data-steward: Data quality and classification
 */

import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { RoleDefinition } from "./types";

export const SPECIALIZED_ROLES: Record<string, RoleDefinition> = {
  /**
   * Security Officer - Information security and governance
   * Data governance, security compliance, InfoSec
   */
  "security-officer": {
    name: "security-officer",
    displayName: "Security Officer",
    description:
      "Information security - governance, data domains, security compliance",
    permissions: [
      // Governance - Full access
      PERMISSIONS.DATA_DOMAINS_VIEW,
      PERMISSIONS.DATA_DOMAINS_CREATE,
      PERMISSIONS.DATA_DOMAINS_UPDATE,
      PERMISSIONS.DATA_DOMAINS_DELETE,
      PERMISSIONS.DATA_DOMAINS_MANAGE,
      PERMISSIONS.DATA_OWNERSHIPS_VIEW,
      PERMISSIONS.DATA_OWNERSHIPS_CREATE,
      PERMISSIONS.DATA_OWNERSHIPS_UPDATE,
      PERMISSIONS.DATA_OWNERSHIPS_DELETE,
      PERMISSIONS.DATA_OWNERSHIPS_MANAGE,
      PERMISSIONS.VERIFICATION_CAMPAIGNS_VIEW,
      PERMISSIONS.VERIFICATION_CAMPAIGNS_CREATE,
      PERMISSIONS.VERIFICATION_CAMPAIGNS_UPDATE,
      PERMISSIONS.VERIFICATION_CAMPAIGNS_DELETE,
      PERMISSIONS.VERIFICATION_CAMPAIGNS_START,
      PERMISSIONS.VERIFICATION_CAMPAIGNS_COMPLETE,
      PERMISSIONS.VERIFICATION_CAMPAIGNS_MANAGE,
      PERMISSIONS.VERIFICATION_ITEMS_VIEW,
      PERMISSIONS.VERIFICATION_ITEMS_UPDATE,
      PERMISSIONS.VERIFICATION_ITEMS_VERIFY,
      PERMISSIONS.VERIFICATION_ITEMS_FLAG_EXCEPTION,
      PERMISSIONS.VERIFICATION_ITEMS_MANAGE,

      // Configuration Items - Create + Update (security assets)
      PERMISSIONS.CI_CLASSES_VIEW,
      PERMISSIONS.CONFIGURATION_ITEMS_VIEW,
      PERMISSIONS.CONFIGURATION_ITEMS_CREATE,
      PERMISSIONS.CONFIGURATION_ITEMS_UPDATE,
      PERMISSIONS.CI_RELATIONSHIPS_VIEW,
      PERMISSIONS.CI_RELATIONSHIPS_CREATE,
      PERMISSIONS.CI_RELATIONSHIPS_UPDATE,
      PERMISSIONS.RELATIONSHIP_TYPES_VIEW,

      // Services - Read-only (identify critical services)
      PERMISSIONS.SERVICES_VIEW,
      PERMISSIONS.BUSINESS_PROCESSES_VIEW,

      // Assets - Read-only (security inventory)
      PERMISSIONS.ASSETS_VIEW,
      PERMISSIONS.ASSET_CATEGORIES_VIEW,
      PERMISSIONS.ASSET_MODELS_VIEW,

      // Licenses - Read-only (software compliance)
      PERMISSIONS.LICENSE_PRODUCTS_VIEW,
      PERMISSIONS.LICENSE_ENTITLEMENTS_VIEW,
      PERMISSIONS.LICENSE_ALLOCATIONS_VIEW,

      // Attachments - Full access (security documentation)
      PERMISSIONS.ATTACHMENT_TYPES_VIEW,
      PERMISSIONS.ATTACHMENT_TYPES_CREATE,
      PERMISSIONS.ATTACHMENT_TYPES_UPDATE,
      PERMISSIONS.ATTACHMENT_TYPES_DELETE,
      PERMISSIONS.ATTACHMENT_TYPES_MANAGE,
      PERMISSIONS.ATTACHMENTS_VIEW,
      PERMISSIONS.ATTACHMENTS_CREATE,
      PERMISSIONS.ATTACHMENTS_UPDATE,
      PERMISSIONS.ATTACHMENTS_DELETE,
      PERMISSIONS.ATTACHMENTS_MANAGE,

      // Audit Logs - Read + Export
      PERMISSIONS.AUDIT_LOGS_VIEW,
      PERMISSIONS.AUDIT_LOGS_EXPORT,

      // Users & Roles - Read-only (security review)
      PERMISSIONS.USERS_VIEW,
      PERMISSIONS.ROLES_VIEW,
      PERMISSIONS.PERMISSIONS_VIEW,

      // Organization Units & Persons
      PERMISSIONS.ORGANIZATION_UNITS_VIEW,
      PERMISSIONS.PERSONS_VIEW,

      // Dashboard
      PERMISSIONS.DASHBOARD_VIEW,

      // Settings
      PERMISSIONS.SETTINGS_VIEW,
    ],
  },

  /**
   * Service Owner - IT service catalog management
   * Service management, CMDB, business alignment
   */
  "service-owner": {
    name: "service-owner",
    displayName: "Service Owner",
    description:
      "IT service management - service catalog, CMDB, business alignment",
    permissions: [
      // Services - Full access
      PERMISSIONS.SERVICES_VIEW,
      PERMISSIONS.SERVICES_CREATE,
      PERMISSIONS.SERVICES_UPDATE,
      PERMISSIONS.SERVICES_DELETE,
      PERMISSIONS.SERVICES_RETIRE,
      PERMISSIONS.SERVICES_MANAGE,

      // Business Processes - Full access
      PERMISSIONS.BUSINESS_PROCESSES_VIEW,
      PERMISSIONS.BUSINESS_PROCESSES_CREATE,
      PERMISSIONS.BUSINESS_PROCESSES_UPDATE,
      PERMISSIONS.BUSINESS_PROCESSES_DELETE,
      PERMISSIONS.BUSINESS_PROCESSES_MANAGE,

      // Configuration Items - Full access
      PERMISSIONS.CI_CLASSES_VIEW,
      PERMISSIONS.CI_CLASS_FIELDS_VIEW,
      PERMISSIONS.CONFIGURATION_ITEMS_VIEW,
      PERMISSIONS.CONFIGURATION_ITEMS_CREATE,
      PERMISSIONS.CONFIGURATION_ITEMS_UPDATE,
      PERMISSIONS.CONFIGURATION_ITEMS_DELETE,
      PERMISSIONS.CONFIGURATION_ITEMS_MANAGE,

      // CI Relationships - Full access
      PERMISSIONS.CI_RELATIONSHIPS_VIEW,
      PERMISSIONS.CI_RELATIONSHIPS_CREATE,
      PERMISSIONS.CI_RELATIONSHIPS_UPDATE,
      PERMISSIONS.CI_RELATIONSHIPS_DELETE,
      PERMISSIONS.CI_RELATIONSHIPS_MANAGE,
      PERMISSIONS.RELATIONSHIP_TYPES_VIEW,
      PERMISSIONS.RELATIONSHIP_TYPES_CREATE,
      PERMISSIONS.RELATIONSHIP_TYPES_UPDATE,
      PERMISSIONS.RELATIONSHIP_TYPE_SCOPES_VIEW,

      // Assets - Read-only (infrastructure supporting services)
      PERMISSIONS.ASSETS_VIEW,
      PERMISSIONS.ASSET_CATEGORIES_VIEW,
      PERMISSIONS.ASSET_MODELS_VIEW,

      // Contracts - Read-only (service contracts)
      PERMISSIONS.CONTRACTS_VIEW,
      PERMISSIONS.CONTRACT_TYPES_VIEW,

      // Licenses - Read-only (software licenses for services)
      PERMISSIONS.LICENSE_PRODUCTS_VIEW,
      PERMISSIONS.LICENSE_ENTITLEMENTS_VIEW,
      PERMISSIONS.LICENSE_ALLOCATIONS_VIEW,

      // Attachments - Full access (service documentation)
      PERMISSIONS.ATTACHMENTS_VIEW,
      PERMISSIONS.ATTACHMENTS_CREATE,
      PERMISSIONS.ATTACHMENTS_UPDATE,
      PERMISSIONS.ATTACHMENTS_DELETE,

      // Data Ownerships - Read-only (understand data ownership)
      PERMISSIONS.DATA_OWNERSHIPS_VIEW,

      // Organization Units & Persons
      PERMISSIONS.ORGANIZATION_UNITS_VIEW,
      PERMISSIONS.PERSONS_VIEW,
      PERMISSIONS.LOCATIONS_VIEW,

      // Dashboard
      PERMISSIONS.DASHBOARD_VIEW,

      // Settings
      PERMISSIONS.SETTINGS_VIEW,
    ],
  },

  /**
   * Data Steward - Data quality and classification
   * Data governance specialist (SAMA compliance)
   */
  "data-steward": {
    name: "data-steward",
    displayName: "Data Steward",
    description:
      "Data quality specialist - data classification, ownership tracking (SAMA)",
    permissions: [
      // Data Domains - Full access
      PERMISSIONS.DATA_DOMAINS_VIEW,
      PERMISSIONS.DATA_DOMAINS_CREATE,
      PERMISSIONS.DATA_DOMAINS_UPDATE,
      PERMISSIONS.DATA_DOMAINS_DELETE,
      PERMISSIONS.DATA_DOMAINS_MANAGE,

      // Data Ownerships - Full access
      PERMISSIONS.DATA_OWNERSHIPS_VIEW,
      PERMISSIONS.DATA_OWNERSHIPS_CREATE,
      PERMISSIONS.DATA_OWNERSHIPS_UPDATE,
      PERMISSIONS.DATA_OWNERSHIPS_DELETE,
      PERMISSIONS.DATA_OWNERSHIPS_MANAGE,

      // Verification Campaigns - Create + Update
      PERMISSIONS.VERIFICATION_CAMPAIGNS_VIEW,
      PERMISSIONS.VERIFICATION_CAMPAIGNS_CREATE,
      PERMISSIONS.VERIFICATION_CAMPAIGNS_UPDATE,

      // Verification Items - Update + Verify
      PERMISSIONS.VERIFICATION_ITEMS_VIEW,
      PERMISSIONS.VERIFICATION_ITEMS_UPDATE,
      PERMISSIONS.VERIFICATION_ITEMS_VERIFY,

      // Organization Units & Persons - Read-only
      PERMISSIONS.ORGANIZATION_UNITS_VIEW,
      PERMISSIONS.PERSONS_VIEW,

      // CI Classes - Read-only (data classification mapping)
      PERMISSIONS.CI_CLASSES_VIEW,

      // Asset Categories - Read-only (data classification mapping)
      PERMISSIONS.ASSET_CATEGORIES_VIEW,

      // Attachments - View + Create (governance docs)
      PERMISSIONS.ATTACHMENTS_VIEW,
      PERMISSIONS.ATTACHMENTS_CREATE,

      // Audit Logs - Read-only
      PERMISSIONS.AUDIT_LOGS_VIEW,

      // Dashboard
      PERMISSIONS.DASHBOARD_VIEW,

      // Settings
      PERMISSIONS.SETTINGS_VIEW,
    ],
  },

  /**
   * HR Manager - Human Resources and People Operations
   * People & Culture team - employee data access for HR functions
   * NOTE: Minimal permissions for now; will expand when HR features are added
   */
  "hr-manager": {
    name: "hr-manager",
    displayName: "HR Manager",
    description:
      "Human Resources - employee data, org structure, people management",
    permissions: [
      // Organization Units - Read-only (org structure visibility)
      PERMISSIONS.ORGANIZATION_UNITS_VIEW,

      // Persons - Read-only (employee directory and info)
      PERMISSIONS.PERSONS_VIEW,

      // Locations - Read-only (office locations for HR planning)
      PERMISSIONS.LOCATIONS_VIEW,

      // Dashboard
      PERMISSIONS.DASHBOARD_VIEW,

      // Settings
      PERMISSIONS.SETTINGS_VIEW,
    ],
  },
} as const;
