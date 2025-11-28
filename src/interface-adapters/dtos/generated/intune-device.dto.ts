/**
 * IntuneDevice DTOs
 *
 * Data Transfer Objects for Intune device operations.
 */

import { z } from "zod";

// ==========================================
// Type Definitions
// ==========================================

export const IntuneDeviceOwnershipTypeSchema = z.enum([
  "CORPORATE",
  "PERSONAL",
  "UNKNOWN",
]);

export const IntuneComplianceStateSchema = z.enum([
  "COMPLIANT",
  "NON_COMPLIANT",
  "CONFLICT",
  "ERROR",
  "IN_GRACE_PERIOD",
  "CONFIG_MANAGER",
  "UNKNOWN",
]);

export const IntuneManagementStateSchema = z.enum([
  "MANAGED",
  "RETIRE_PENDING",
  "RETIRE_ISSUED",
  "WIPE_PENDING",
  "WIPE_ISSUED",
  "UNHEALTHY",
  "DELETE_PENDING",
  "DISCOVERED",
]);

export const AssetLinkMethodSchema = z.enum(["auto_serial", "manual"]);
export const PersonLinkMethodSchema = z.enum(["auto_azuread", "manual"]);

// ==========================================
// IntuneDevice DTO
// ==========================================

export interface IntuneDeviceDTO {
  id: string;

  // Intune Identity
  intuneDeviceId: string;
  azureAdDeviceId: string | null;

  // Device Info
  deviceName: string;
  serialNumber: string | null;
  manufacturer: string | null;
  model: string | null;
  operatingSystem: string | null;
  osVersion: string | null;
  imei: string | null;
  wiFiMacAddress: string | null;
  ethernetMacAddress: string | null;

  // User Assignment (from Intune)
  intuneUserId: string | null;
  userPrincipalName: string | null;
  userDisplayName: string | null;

  // Compliance & Management
  ownershipType: z.infer<typeof IntuneDeviceOwnershipTypeSchema>;
  complianceState: z.infer<typeof IntuneComplianceStateSchema>;
  managementState: z.infer<typeof IntuneManagementStateSchema>;
  isEncrypted: boolean;
  isSupervised: boolean;
  isJailBroken: boolean;

  // Timestamps from Intune
  enrolledDateTime: string | null;
  lastSyncDateTime: string | null;

  // ITAM Links
  linkedAssetId: string | null;
  linkedPersonId: string | null;

  // Enriched data (populated by controller)
  linkedAssetTag?: string | null;
  linkedPersonName?: string | null;

  // Link Metadata
  assetLinkMethod: z.infer<typeof AssetLinkMethodSchema> | null;
  assetLinkedAt: string | null;
  personLinkMethod: z.infer<typeof PersonLinkMethodSchema> | null;
  personLinkedAt: string | null;

  // Sync Tracking
  lastSyncedFromIntune: string | null;
  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Link/Unlink Schemas
// ==========================================

export const LinkDeviceToAssetSchema = z.object({
  deviceId: z.string().min(1, "Device ID is required"),
  assetId: z.string().min(1, "Asset ID is required"),
});

export const LinkDeviceToPersonSchema = z.object({
  deviceId: z.string().min(1, "Device ID is required"),
  personId: z.string().min(1, "Person ID is required"),
});

export const UnlinkDeviceSchema = z.object({
  deviceId: z.string().min(1, "Device ID is required"),
});

// ==========================================
// Sync Options Schema
// ==========================================

export const TriggerIntuneSyncSchema = z.object({
  autoLinkToAssets: z.boolean().default(true),
  autoLinkToPersons: z.boolean().default(true),
  trackComplianceHistory: z.boolean().default(true),
  deactivateMissing: z.boolean().default(true),
  // Note: Graph API uses "company" for corporate-owned devices
  ownershipType: z.enum(["company", "personal"]).optional(),
  complianceState: z.enum(["compliant", "noncompliant"]).optional(),
  operatingSystem: z.string().optional(),
  dryRun: z.boolean().default(false),
});

// ==========================================
// List Filter Schema
// ==========================================

export const IntuneDeviceFiltersSchema = z.object({
  search: z.string().optional(),
  complianceState: IntuneComplianceStateSchema.optional(),
  ownershipType: IntuneDeviceOwnershipTypeSchema.optional(),
  managementState: IntuneManagementStateSchema.optional(),
  operatingSystem: z.string().optional(),
  isActive: z.boolean().optional(),
  linkedToAsset: z.boolean().optional(),
  linkedToPerson: z.boolean().optional(),
});

// ==========================================
// Compliance Stats DTO
// ==========================================

export interface IntuneComplianceStatsDTO {
  compliance: {
    total: number;
    compliant: number;
    nonCompliant: number;
    inGracePeriod: number;
    conflict: number;
    error: number;
    configManager: number;
    unknown: number;
  };
  ownership: {
    total: number;
    corporate: number;
    personal: number;
    unknown: number;
  };
  linkStatus: {
    total: number;
    linkedToAsset: number;
    unlinkedFromAsset: number;
    linkedToPerson: number;
    unlinkedFromPerson: number;
  };
  byOperatingSystem: Record<string, number>;
}

// ==========================================
// Sync Result DTO
// ==========================================

export interface IntuneSyncResultDTO {
  created: number;
  updated: number;
  deactivated: number;
  linkedToAssets: number;
  linkedToPersons: number;
  complianceChanges: number;
  errors: Array<{
    intuneDeviceId: string;
    deviceName?: string;
    error: string;
  }>;
  durationMs: number;
}

// ==========================================
// Compliance History DTO
// ==========================================

export interface IntuneComplianceHistoryDTO {
  id: string;
  intuneDeviceId: string;
  previousState: z.infer<typeof IntuneComplianceStateSchema>;
  newState: z.infer<typeof IntuneComplianceStateSchema>;
  changedAt: string;
  policyName: string | null;
  policyId: string | null;
  reason: string | null;
}

// ==========================================
// Type Exports
// ==========================================

export type LinkDeviceToAssetDTO = z.infer<typeof LinkDeviceToAssetSchema>;
export type LinkDeviceToPersonDTO = z.infer<typeof LinkDeviceToPersonSchema>;
export type UnlinkDeviceDTO = z.infer<typeof UnlinkDeviceSchema>;
export type TriggerIntuneSyncDTO = z.infer<typeof TriggerIntuneSyncSchema>;
export type IntuneDeviceFiltersDTO = z.infer<typeof IntuneDeviceFiltersSchema>;

// ==========================================
// Create Asset from Device Schema
// ==========================================

export const CreateAssetFromDeviceSchema = z.object({
  deviceId: z.string().min(1, "Device ID is required"),
  categoryId: z.string().min(1, "Category ID is required"),
  stockLocationId: z.string().optional(),
  lifecycleStateId: z.string().optional(),
  autoCreateVendor: z.boolean().default(true),
  autoCreateModel: z.boolean().default(true),
  autoLinkToDevice: z.boolean().default(true),
});

export type CreateAssetFromDeviceDTO = z.infer<
  typeof CreateAssetFromDeviceSchema
>;

// ==========================================
// Create Asset Result DTO
// ==========================================

export interface CreateAssetFromDeviceResultDTO {
  assetId: string;
  assetTag: string;
  serialNumber: string;
  vendorCreated: boolean;
  modelCreated: boolean;
  linkedToDevice: boolean;
}

// ==========================================
// Bulk Create Assets Schema
// ==========================================

export const BulkCreateAssetsFromDevicesSchema = z.object({
  deviceIds: z
    .array(z.string().min(1))
    .min(1, "At least one device is required"),
  categoryId: z.string().min(1, "Category ID is required"),
  stockLocationId: z.string().optional(),
  lifecycleStateId: z.string().optional(),
  autoCreateVendor: z.boolean().default(true),
  autoCreateModel: z.boolean().default(true),
  autoLinkToDevice: z.boolean().default(true),
});

export type BulkCreateAssetsFromDevicesDTO = z.infer<
  typeof BulkCreateAssetsFromDevicesSchema
>;

// ==========================================
// Bulk Create Result DTOs
// ==========================================

export interface BulkCreateAssetResultDTO {
  deviceId: string;
  deviceName: string;
  serialNumber: string | null;
  success: boolean;
  assetTag?: string;
  assetId?: string;
  error?: string;
  vendorCreated?: boolean;
  modelCreated?: boolean;
}

export interface BulkCreateAssetsResultDTO {
  results: BulkCreateAssetResultDTO[];
  summary: {
    total: number;
    created: number;
    skipped: number;
    failed: number;
    vendorsCreated: number;
    modelsCreated: number;
  };
  durationMs: number;
}
