/**
 * Seed Configuration - Main Barrel Export
 *
 * Central configuration for all seed scripts.
 * Data arrays have been split into domain-specific modules for better maintainability.
 *
 * Structure:
 * - seed-config-foundation.ts - Foundation layer data
 * - seed-config-assets.ts - Asset layer data
 * - seed-config-layer3.ts - Layer 3 ITAM data
 * - seed-config-governance.ts - Governance data
 * - seed-config-system.ts - System/service data
 */

// ==============================================
// Seeder Quantities Configuration
// ==============================================

export const SEED_QUANTITIES = {
  // Foundation Layer
  VENDORS: 9,
  LOCATIONS: 5, // Barq actual locations
  ORGANIZATION_UNITS: 223, // 1 company + 17 departments + 55 sub-departments + 150 teams
  PERSONS: 0, // Persons come from Microsoft Graph sync
  LIFECYCLE_STATUSES: 6,
  FIELD_DEFINITIONS: 8,
  EXCHANGE_RATES: 14, // All supported currencies except SAR

  // Asset Layer
  ASSET_CATEGORIES: 8,
  ASSET_MODELS: 15,
  ASSETS_PER_CATEGORY: {
    LAPTOP: 15,
    DESKTOP: 8,
    MONITOR: 10,
    SERVER: 5,
    NETWORK: 6,
    PRINTER: 4,
    PHONE: 10,
    TABLET: 6,
  },
  STOCK_LOCATIONS: 5,
  STOCK_MOVEMENTS_PER_LOCATION: 3,
  ASSET_ASSIGNMENTS_PERCENTAGE: 0.7, // 70% of assets assigned
  WARRANTIES_PERCENTAGE: 0.8, // 80% of assets have warranties
  MAINTENANCE_SCHEDULES_PERCENTAGE: 0.6, // 60% of assets have schedules
  MAINTENANCE_RECORDS_PER_ASSET: 3,

  // Layer 3 ITAM
  ASSET_DISPOSALS: 8,
  DISPOSAL_APPROVALS_PER_DISPOSAL: 2,
  ASSET_KITS: 5,
  KIT_ITEMS_PER_KIT: 4,
  KIT_CHECKOUTS: 6,
  ASSET_RESERVATIONS: 10,
  RESERVATION_CONFLICTS: 3,
  CONFIGURATION_ITEMS: 20,
  RELATIONSHIP_TYPES: 8,
  CI_RELATIONSHIPS: 15,
} as const;

// ==============================================
// Re-export Domain-Specific Configurations
// ==============================================

// Foundation Layer
export * from "./seed-config-foundation.js";

// Asset Layer
export * from "./seed-config-assets.js";

// Layer 3 ITAM
export * from "./seed-config-layer3.js";

// Governance
export * from "./seed-config-governance.js";

// System & Services (split into multiple domain files)
export * from "./seed-config-system/index.js";

// ==============================================
// Aggregate Configuration (Legacy Compat)
// ==============================================

import {
  VENDOR_DATA,
  VENDOR_CONTACT_DATA,
  LOCATION_DATA,
  ORG_UNIT_DATA,
  PERSON_DATA,
  PERSON_ROLE_ASSIGNMENTS,
  LIFECYCLE_STATUS_DATA,
} from "./seed-config-foundation.js";

import {
  ASSET_CATEGORY_DATA,
  ASSET_MODEL_DATA,
  WARRANTY_CONFIG,
  MAINTENANCE_TEMPLATES,
} from "./seed-config-assets.js";

import {
  ASSET_KIT_TEMPLATES,
  CI_CLASS_DATA,
  RELATIONSHIP_TYPE_DATA,
  DISPOSAL_TYPES,
  DISPOSAL_STATUSES,
  DISPOSAL_REASONS,
  KIT_TYPES,
  RESERVATION_PURPOSES,
} from "./seed-config-layer3.js";

import {
  DATA_DOMAINS,
  DATA_OWNERSHIPS,
  VERIFICATION_CAMPAIGNS,
} from "./seed-config-governance.js";

import {
  ATTACHMENT_TYPES,
  SERVICE_DATA,
  BUSINESS_PROCESS_DATA,
  EXCHANGE_RATE_DATA,
} from "./seed-config-system/index.js";

/**
 * Aggregate configuration object
 * Maintains backward compatibility with existing seed scripts
 */
export const SEED_CONFIG = {
  QUANTITIES: SEED_QUANTITIES,
  VENDORS: VENDOR_DATA,
  VENDOR_CONTACTS: VENDOR_CONTACT_DATA,
  LOCATIONS: LOCATION_DATA,
  ORG_UNITS: ORG_UNIT_DATA,
  PERSONS: PERSON_DATA,
  PERSON_ROLE_ASSIGNMENTS,
  LIFECYCLE_STATUSES: LIFECYCLE_STATUS_DATA,
  EXCHANGE_RATES: EXCHANGE_RATE_DATA,
  ASSET_CATEGORIES: ASSET_CATEGORY_DATA,
  ASSET_MODELS: ASSET_MODEL_DATA,
  WARRANTY_CONFIG,
  MAINTENANCE_TEMPLATES,
  ASSET_KIT_TEMPLATES,
  CI_CLASSES: CI_CLASS_DATA,
  RELATIONSHIP_TYPES: RELATIONSHIP_TYPE_DATA,
  DISPOSAL_TYPES,
  DISPOSAL_STATUSES,
  DISPOSAL_REASONS,
  KIT_TYPES,
  RESERVATION_PURPOSES,
  ATTACHMENT_TYPES,
  DATA_DOMAINS,
  DATA_OWNERSHIPS,
  VERIFICATION_CAMPAIGNS,
  BUSINESS_PROCESSES: BUSINESS_PROCESS_DATA,
  SERVICES: SERVICE_DATA,
} as const;
