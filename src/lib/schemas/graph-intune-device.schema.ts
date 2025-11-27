/**
 * Microsoft Graph Intune Device Schema
 *
 * Zod validation schemas for Microsoft Graph API Intune managed device responses.
 * These schemas validate data from the /deviceManagement/managedDevices endpoint.
 *
 * Reference: https://learn.microsoft.com/en-us/graph/api/intune-devices-manageddevice-list
 *
 * Required Azure AD Permissions (Application type):
 * - DeviceManagementManagedDevices.Read.All - Read Microsoft Intune devices
 */

import { z } from "zod";

/**
 * Ownership type as returned by Graph API
 * Maps to our IntuneDeviceOwnershipType enum
 */
export const GraphOwnershipTypeSchema = z.enum([
  "corporate",
  "personal",
  "unknown",
]);

/**
 * Compliance state as returned by Graph API
 * Maps to our IntuneComplianceState enum
 */
export const GraphComplianceStateSchema = z.enum([
  "compliant",
  "noncompliant",
  "conflict",
  "error",
  "inGracePeriod",
  "configManager",
  "unknown",
]);

/**
 * Management state as returned by Graph API
 * Maps to our IntuneManagementState enum
 */
export const GraphManagementStateSchema = z.enum([
  "managed",
  "retirePending",
  "retireIssued",
  "wipePending",
  "wipeIssued",
  "unhealthy",
  "deletePending",
  "discovered",
]);

/**
 * Jail broken status as returned by Graph API
 */
export const GraphJailBrokenSchema = z.enum(["Unknown", "True", "False"]);

/**
 * Schema for a single managed device from Microsoft Graph Intune API
 *
 * Based on the /deviceManagement/managedDevices endpoint response
 */
export const GraphIntuneDeviceSchema = z.object({
  // Always present
  id: z.string(), // Intune device ID (GUID)
  deviceName: z.string(),
  managedDeviceOwnerType: GraphOwnershipTypeSchema.default("unknown"),
  complianceState: GraphComplianceStateSchema.default("unknown"),
  managementState: GraphManagementStateSchema.default("managed"),

  // Usually present
  azureADDeviceId: z.string().nullable().default(null),
  serialNumber: z.string().nullable().default(null),
  manufacturer: z.string().nullable().default(null),
  model: z.string().nullable().default(null),
  operatingSystem: z.string().nullable().default(null),
  osVersion: z.string().nullable().default(null),
  imei: z.string().nullable().default(null),
  wiFiMacAddress: z.string().nullable().default(null),
  ethernetMacAddress: z.string().nullable().default(null),

  // User assignment
  userId: z.string().nullable().default(null), // Intune user ID
  userPrincipalName: z.string().nullable().default(null),
  userDisplayName: z.string().nullable().default(null),

  // Security status
  isEncrypted: z.boolean().default(false),
  isSupervised: z.boolean().default(false),
  jailBroken: GraphJailBrokenSchema.default("Unknown"),

  // Timestamps
  enrolledDateTime: z.string().datetime().nullable().default(null),
  lastSyncDateTime: z.string().datetime().nullable().default(null),
});

/**
 * Schema for paginated Graph API Intune devices response
 */
export const GraphIntuneDevicesResponseSchema = z.object({
  "@odata.context": z.string().optional(),
  "@odata.nextLink": z.string().optional(),
  "@odata.count": z.number().optional(),
  value: z.array(GraphIntuneDeviceSchema),
});

/**
 * Type for a validated Graph Intune device
 */
export type GraphIntuneDevice = z.infer<typeof GraphIntuneDeviceSchema>;

/**
 * Type for paginated Graph API response
 */
export type GraphIntuneDevicesResponse = z.infer<
  typeof GraphIntuneDevicesResponseSchema
>;

/**
 * Options for fetching devices from Graph API
 */
export interface FetchDevicesOptions {
  /**
   * Include only devices with specific ownership type
   */
  ownershipType?: "corporate" | "personal";

  /**
   * Include only devices with specific compliance state
   */
  complianceState?: "compliant" | "noncompliant";

  /**
   * Filter by operating system (e.g., "Windows", "iOS", "Android")
   */
  operatingSystem?: string;
}

/**
 * Maps Graph API ownership type to our Prisma enum value
 */
export function mapOwnershipType(
  graphType: z.infer<typeof GraphOwnershipTypeSchema>,
): "CORPORATE" | "PERSONAL" | "UNKNOWN" {
  const mapping: Record<string, "CORPORATE" | "PERSONAL" | "UNKNOWN"> = {
    corporate: "CORPORATE",
    personal: "PERSONAL",
    unknown: "UNKNOWN",
  };
  return mapping[graphType] ?? "UNKNOWN";
}

/**
 * Maps Graph API compliance state to our Prisma enum value
 */
export function mapComplianceState(
  graphState: z.infer<typeof GraphComplianceStateSchema>,
):
  | "COMPLIANT"
  | "NON_COMPLIANT"
  | "CONFLICT"
  | "ERROR"
  | "IN_GRACE_PERIOD"
  | "CONFIG_MANAGER"
  | "UNKNOWN" {
  const mapping: Record<
    string,
    | "COMPLIANT"
    | "NON_COMPLIANT"
    | "CONFLICT"
    | "ERROR"
    | "IN_GRACE_PERIOD"
    | "CONFIG_MANAGER"
    | "UNKNOWN"
  > = {
    compliant: "COMPLIANT",
    noncompliant: "NON_COMPLIANT",
    conflict: "CONFLICT",
    error: "ERROR",
    inGracePeriod: "IN_GRACE_PERIOD",
    configManager: "CONFIG_MANAGER",
    unknown: "UNKNOWN",
  };
  return mapping[graphState] ?? "UNKNOWN";
}

/**
 * Maps Graph API management state to our Prisma enum value
 */
export function mapManagementState(
  graphState: z.infer<typeof GraphManagementStateSchema>,
):
  | "MANAGED"
  | "RETIRE_PENDING"
  | "RETIRE_ISSUED"
  | "WIPE_PENDING"
  | "WIPE_ISSUED"
  | "UNHEALTHY"
  | "DELETE_PENDING"
  | "DISCOVERED" {
  const mapping: Record<
    string,
    | "MANAGED"
    | "RETIRE_PENDING"
    | "RETIRE_ISSUED"
    | "WIPE_PENDING"
    | "WIPE_ISSUED"
    | "UNHEALTHY"
    | "DELETE_PENDING"
    | "DISCOVERED"
  > = {
    managed: "MANAGED",
    retirePending: "RETIRE_PENDING",
    retireIssued: "RETIRE_ISSUED",
    wipePending: "WIPE_PENDING",
    wipeIssued: "WIPE_ISSUED",
    unhealthy: "UNHEALTHY",
    deletePending: "DELETE_PENDING",
    discovered: "DISCOVERED",
  };
  return mapping[graphState] ?? "MANAGED";
}

/**
 * Maps Graph API jail broken status to boolean
 */
export function mapJailBroken(
  graphValue: z.infer<typeof GraphJailBrokenSchema>,
): boolean {
  return graphValue === "True";
}

/**
 * Input for creating/updating an IntuneDevice from Graph API data
 * Compatible with IntuneDevice.create() and domain entity update methods
 */
export interface IntuneDeviceSyncInput {
  intuneDeviceId: string;
  azureAdDeviceId: string | null;
  deviceName: string;
  serialNumber: string | null;
  manufacturer: string | null;
  model: string | null;
  operatingSystem: string | null;
  osVersion: string | null;
  imei: string | null;
  wiFiMacAddress: string | null;
  ethernetMacAddress: string | null;
  intuneUserId: string | null;
  userPrincipalName: string | null;
  userDisplayName: string | null;
  ownershipType: "CORPORATE" | "PERSONAL" | "UNKNOWN";
  complianceState:
    | "COMPLIANT"
    | "NON_COMPLIANT"
    | "CONFLICT"
    | "ERROR"
    | "IN_GRACE_PERIOD"
    | "CONFIG_MANAGER"
    | "UNKNOWN";
  managementState:
    | "MANAGED"
    | "RETIRE_PENDING"
    | "RETIRE_ISSUED"
    | "WIPE_PENDING"
    | "WIPE_ISSUED"
    | "UNHEALTHY"
    | "DELETE_PENDING"
    | "DISCOVERED";
  isEncrypted: boolean;
  isSupervised: boolean;
  isJailBroken: boolean;
  enrolledDateTime: Date | null;
  lastSyncDateTime: Date | null;
}

/**
 * Transforms a Microsoft Graph Intune device to sync input format
 *
 * Features:
 * - Maps Graph API enum values to our Prisma enum format
 * - Converts ISO datetime strings to Date objects
 * - Normalizes null/undefined values
 *
 * @param graphDevice - Validated Graph Intune device data
 * @returns Data ready for IntuneDevice entity creation/update
 */
export function transformGraphDeviceToSyncInput(
  graphDevice: GraphIntuneDevice,
): IntuneDeviceSyncInput {
  return {
    intuneDeviceId: graphDevice.id,
    azureAdDeviceId: graphDevice.azureADDeviceId ?? null,
    deviceName: graphDevice.deviceName,
    serialNumber: graphDevice.serialNumber ?? null,
    manufacturer: graphDevice.manufacturer ?? null,
    model: graphDevice.model ?? null,
    operatingSystem: graphDevice.operatingSystem ?? null,
    osVersion: graphDevice.osVersion ?? null,
    imei: graphDevice.imei ?? null,
    wiFiMacAddress: graphDevice.wiFiMacAddress ?? null,
    ethernetMacAddress: graphDevice.ethernetMacAddress ?? null,
    intuneUserId: graphDevice.userId ?? null,
    userPrincipalName: graphDevice.userPrincipalName ?? null,
    userDisplayName: graphDevice.userDisplayName ?? null,
    ownershipType: mapOwnershipType(graphDevice.managedDeviceOwnerType),
    complianceState: mapComplianceState(graphDevice.complianceState),
    managementState: mapManagementState(graphDevice.managementState),
    isEncrypted: graphDevice.isEncrypted,
    isSupervised: graphDevice.isSupervised,
    isJailBroken: mapJailBroken(graphDevice.jailBroken),
    enrolledDateTime: graphDevice.enrolledDateTime
      ? new Date(graphDevice.enrolledDateTime)
      : null,
    lastSyncDateTime: graphDevice.lastSyncDateTime
      ? new Date(graphDevice.lastSyncDateTime)
      : null,
  };
}
