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
 * Valid ownership types from Graph API
 */
export type GraphOwnershipType = "company" | "personal" | "unknown";

/**
 * Ownership type as returned by Graph API
 * Maps to our IntuneDeviceOwnershipType enum
 *
 * Note: MS Graph API returns "company" (not "corporate")
 * Reference: https://learn.microsoft.com/en-us/graph/api/resources/intune-devices-manageddevice
 *
 * This schema is resilient to unexpected values - unknown values default to "unknown"
 */
export const GraphOwnershipTypeSchema = z
  .string()
  .nullable()
  .optional()
  .transform((val): GraphOwnershipType => {
    const normalized = val?.toLowerCase()?.trim();
    // Handle both "company" (Graph API) and "corporate" (legacy/alternative)
    if (normalized === "company" || normalized === "corporate")
      return "company";
    if (normalized === "personal") return "personal";
    return "unknown";
  });

/**
 * Valid compliance states from Graph API
 */
export type GraphComplianceState =
  | "compliant"
  | "noncompliant"
  | "conflict"
  | "error"
  | "inGracePeriod"
  | "configManager"
  | "unknown";

/**
 * Compliance state as returned by Graph API
 * Maps to our IntuneComplianceState enum
 *
 * This schema is resilient to unexpected values - unknown values default to "unknown"
 */
export const GraphComplianceStateSchema = z
  .string()
  .nullable()
  .optional()
  .transform((val): GraphComplianceState => {
    const normalized = val?.toLowerCase()?.trim();
    if (normalized === "compliant") return "compliant";
    if (normalized === "noncompliant" || normalized === "non-compliant")
      return "noncompliant";
    if (normalized === "conflict") return "conflict";
    if (normalized === "error") return "error";
    if (normalized === "ingraceperiod" || normalized === "in_grace_period")
      return "inGracePeriod";
    if (normalized === "configmanager" || normalized === "config_manager")
      return "configManager";
    return "unknown";
  });

/**
 * Valid management states from Graph API
 */
export type GraphManagementState =
  | "managed"
  | "retirePending"
  | "retireIssued"
  | "wipePending"
  | "wipeIssued"
  | "unhealthy"
  | "deletePending"
  | "discovered";

/**
 * Management state as returned by Graph API
 * Maps to our IntuneManagementState enum
 *
 * This schema is resilient to unexpected values - unknown values default to "managed"
 */
export const GraphManagementStateSchema = z
  .string()
  .nullable()
  .optional()
  .transform((val): GraphManagementState => {
    const normalized = val?.toLowerCase()?.trim();
    if (normalized === "managed") return "managed";
    if (normalized === "retirepending" || normalized === "retire_pending")
      return "retirePending";
    if (normalized === "retireissued" || normalized === "retire_issued")
      return "retireIssued";
    if (normalized === "wipepending" || normalized === "wipe_pending")
      return "wipePending";
    if (normalized === "wipeissued" || normalized === "wipe_issued")
      return "wipeIssued";
    if (normalized === "unhealthy") return "unhealthy";
    if (normalized === "deletepending" || normalized === "delete_pending")
      return "deletePending";
    if (normalized === "discovered") return "discovered";
    return "managed"; // Default to managed for unknown states
  });

/**
 * Valid jail broken statuses from Graph API
 */
export type GraphJailBroken = "Unknown" | "True" | "False";

/**
 * Jail broken status as returned by Graph API
 *
 * This schema is resilient to unexpected values - unknown values default to "Unknown"
 */
export const GraphJailBrokenSchema = z
  .string()
  .nullable()
  .optional()
  .transform((val): GraphJailBroken => {
    const normalized = val?.toLowerCase()?.trim();
    if (normalized === "true" || normalized === "yes") return "True";
    if (normalized === "false" || normalized === "no") return "False";
    return "Unknown";
  });

/**
 * Schema for a single managed device from Microsoft Graph Intune API
 *
 * Based on the /deviceManagement/managedDevices endpoint response
 */
export const GraphIntuneDeviceSchema = z.object({
  // Always present
  id: z.string(), // Intune device ID (GUID)
  // Device name can be empty/null in some edge cases, provide fallback
  deviceName: z
    .string()
    .nullable()
    .transform((val) => val?.trim() || null),
  managedDeviceOwnerType: GraphOwnershipTypeSchema,
  complianceState: GraphComplianceStateSchema,
  managementState: GraphManagementStateSchema,

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
  jailBroken: GraphJailBrokenSchema,

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
   * Note: Use "company" for corporate devices (Graph API terminology)
   */
  ownershipType?: "company" | "personal";

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
 * Note: Graph API uses "company" which maps to our "CORPORATE" enum
 */
export function mapOwnershipType(
  graphType: z.infer<typeof GraphOwnershipTypeSchema>,
): "CORPORATE" | "PERSONAL" | "UNKNOWN" {
  const mapping: Record<string, "CORPORATE" | "PERSONAL" | "UNKNOWN"> = {
    company: "CORPORATE", // Graph API uses "company", we use "CORPORATE"
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
 * - Provides fallback device name for edge cases
 *
 * @param graphDevice - Validated Graph Intune device data
 * @returns Data ready for IntuneDevice entity creation/update
 */
export function transformGraphDeviceToSyncInput(
  graphDevice: GraphIntuneDevice,
): IntuneDeviceSyncInput {
  // Generate fallback device name if missing
  // Use model, serial number, or ID as fallback
  const deviceName =
    graphDevice.deviceName ||
    graphDevice.model ||
    graphDevice.serialNumber ||
    `Device-${graphDevice.id.substring(0, 8)}`;

  return {
    intuneDeviceId: graphDevice.id,
    azureAdDeviceId: graphDevice.azureADDeviceId ?? null,
    deviceName,
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
