/**
 * Layer 3 ITAM Seed Configuration - Kits, CIs, Disposals, Reservations
 */

import { WarrantyCoverageType } from "@/generated/prisma/enums";

// ==============================================
// Asset Kit Templates
// ==============================================

export const ASSET_KIT_TEMPLATES = [
  {
    name: "New Hire - Developer Kit",
    code: "KIT-DEV-001",
    description: "Complete setup for new software developers",
    items: [
      { categoryCode: "LAPTOP", quantity: 1 },
      { categoryCode: "MONITOR", quantity: 2 },
      { categoryCode: "PHONE", quantity: 1 },
    ],
  },
  {
    name: "New Hire - Standard Office Kit",
    code: "KIT-OFF-001",
    description: "Standard setup for office employees",
    items: [
      { categoryCode: "LAPTOP", quantity: 1 },
      { categoryCode: "MONITOR", quantity: 1 },
    ],
  },
  {
    name: "Remote Worker Kit",
    code: "KIT-REM-001",
    description: "Complete home office setup",
    items: [
      { categoryCode: "LAPTOP", quantity: 1 },
      { categoryCode: "MONITOR", quantity: 1 },
      { categoryCode: "PHONE", quantity: 1 },
    ],
  },
  {
    name: "Conference Room Kit",
    code: "KIT-CONF-001",
    description: "Conference room equipment bundle",
    items: [
      { categoryCode: "MONITOR", quantity: 1 },
      { categoryCode: "TABLET", quantity: 1 },
    ],
  },
  {
    name: "Executive Kit",
    code: "KIT-EXEC-001",
    description: "Premium executive setup",
    items: [
      { categoryCode: "LAPTOP", quantity: 1 },
      { categoryCode: "MONITOR", quantity: 2 },
      { categoryCode: "PHONE", quantity: 1 },
      { categoryCode: "TABLET", quantity: 1 },
    ],
  },
] as const;

// ==============================================
// Configuration Item Classes
// ==============================================

export const CI_CLASS_DATA = [
  "Server",
  "Network Device",
  "Storage System",
  "Database",
  "Application",
  "Service",
  "Virtual Machine",
  "Cloud Resource",
] as const;

// ==============================================
// CMDB Relationship Types
// ==============================================

export const RELATIONSHIP_TYPE_DATA = [
  {
    name: "Depends On",
    code: "DEPENDS_ON",
    description: "Source depends on target for operation",
    reverseCode: "REQUIRED_BY",
    reverseName: "Required By",
    isImpacting: true,
  },
  {
    name: "Runs On",
    code: "RUNS_ON",
    description: "Source runs on target infrastructure",
    reverseCode: "HOSTS",
    reverseName: "Hosts",
    isImpacting: true,
  },
  {
    name: "Connects To",
    code: "CONNECTS_TO",
    description: "Source connects to target",
    reverseCode: "CONNECTED_BY",
    reverseName: "Connected By",
    isImpacting: false,
  },
  {
    name: "Uses",
    code: "USES",
    description: "Source uses target service/resource",
    reverseCode: "USED_BY",
    reverseName: "Used By",
    isImpacting: true,
  },
  {
    name: "Contains",
    code: "CONTAINS",
    description: "Source contains target component",
    reverseCode: "PART_OF",
    reverseName: "Part Of",
    isImpacting: true,
  },
  {
    name: "Monitors",
    code: "MONITORS",
    description: "Source monitors target",
    reverseCode: "MONITORED_BY",
    reverseName: "Monitored By",
    isImpacting: false,
  },
  {
    name: "Backs Up",
    code: "BACKS_UP",
    description: "Source backs up target",
    reverseCode: "BACKED_UP_BY",
    reverseName: "Backed Up By",
    isImpacting: false,
  },
  {
    name: "Provides Service To",
    code: "PROVIDES_TO",
    description: "Source provides service to target",
    reverseCode: "RECEIVES_FROM",
    reverseName: "Receives Service From",
    isImpacting: true,
  },
] as const;

// ==============================================
// Disposal Types and Statuses
// ==============================================

export const DISPOSAL_TYPES = {
  DONATION: "DONATION",
  SALE: "SALE",
  RECYCLING: "RECYCLING",
  DESTRUCTION: "DESTRUCTION",
  OTHER: "OTHER",
} as const;

export const DISPOSAL_STATUSES = {
  PENDING_APPROVAL: "PENDING_APPROVAL",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export const DISPOSAL_REASONS = [
  "End of useful life - hardware failure",
  "Obsolete technology - no longer supported",
  "Upgrade to newer model",
  "Excessive repair costs",
  "Security compliance requirement",
  "Lease return",
  "Damaged beyond repair",
  "No longer needed - organizational change",
] as const;

// ==============================================
// Asset Kit Types
// ==============================================

export const KIT_TYPES = {
  NEW_HIRE: "NEW_HIRE",
  CONTRACTOR: "CONTRACTOR",
  EXECUTIVE: "EXECUTIVE",
  PROJECT: "PROJECT",
  TEMPORARY: "TEMPORARY",
  OTHER: "OTHER",
} as const;

// ==============================================
// Reservation Purposes
// ==============================================

export const RESERVATION_PURPOSES = [
  "Business travel - conference attendance",
  "Temporary project assignment",
  "Equipment testing and evaluation",
  "Training session",
  "Backup equipment during maintenance",
  "Short-term contractor use",
  "Department demo and presentation",
  "Capacity planning - load testing",
] as const;