/**
 * IntuneDevice Presenter
 *
 * Transforms IntuneDevice domain entities into DTOs for presentation.
 */

import type { IntuneDevice } from "@/core/domain/entities/intune-device.entity";
import type { IntuneComplianceHistory } from "@/core/domain/entities/intune-compliance-history.entity";
import type {
  IntuneDeviceDTO,
  IntuneComplianceStatsDTO,
  IntuneSyncResultDTO,
  IntuneComplianceHistoryDTO,
} from "@/interface-adapters/dtos/generated/intune-device.dto";

/**
 * Present a single IntuneDevice entity as a DTO
 */
export function presentIntuneDevice(device: IntuneDevice): IntuneDeviceDTO {
  return {
    id: device.id,
    intuneDeviceId: device.intuneDeviceId,
    azureAdDeviceId: device.azureAdDeviceId,
    deviceName: device.deviceName,
    serialNumber: device.serialNumber,
    manufacturer: device.manufacturer,
    model: device.model,
    operatingSystem: device.operatingSystem,
    osVersion: device.osVersion,
    imei: device.imei,
    wiFiMacAddress: device.wiFiMacAddress,
    ethernetMacAddress: device.ethernetMacAddress,
    intuneUserId: device.intuneUserId,
    userPrincipalName: device.userPrincipalName,
    userDisplayName: device.userDisplayName,
    ownershipType: device.ownershipType,
    complianceState: device.complianceState,
    managementState: device.managementState,
    isEncrypted: device.isEncrypted,
    isSupervised: device.isSupervised,
    isJailBroken: device.isJailBroken,
    enrolledDateTime: device.enrolledDateTime?.toISOString() ?? null,
    lastSyncDateTime: device.lastSyncDateTime?.toISOString() ?? null,
    linkedAssetId: device.linkedAssetId,
    linkedPersonId: device.linkedPersonId,
    assetLinkMethod: device.assetLinkMethod,
    assetLinkedAt: device.assetLinkedAt?.toISOString() ?? null,
    personLinkMethod: device.personLinkMethod,
    personLinkedAt: device.personLinkedAt?.toISOString() ?? null,
    lastSyncedFromIntune: device.lastSyncedFromIntune?.toISOString() ?? null,
    isActive: device.isActive,
    createdAt: device.createdAt.toISOString(),
    updatedAt: device.updatedAt.toISOString(),
  };
}

/**
 * Present multiple IntuneDevice entities as DTOs
 */
export function presentIntuneDevices(
  devices: IntuneDevice[],
): IntuneDeviceDTO[] {
  return devices.map(presentIntuneDevice);
}

/**
 * Present compliance statistics from use case output
 */
export function presentComplianceStats(stats: {
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
}): IntuneComplianceStatsDTO {
  return {
    compliance: stats.compliance,
    ownership: stats.ownership,
    linkStatus: stats.linkStatus,
    byOperatingSystem: stats.byOperatingSystem,
  };
}

/**
 * Present sync result
 */
export function presentSyncResult(result: {
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
}): IntuneSyncResultDTO {
  return {
    created: result.created,
    updated: result.updated,
    deactivated: result.deactivated,
    linkedToAssets: result.linkedToAssets,
    linkedToPersons: result.linkedToPersons,
    complianceChanges: result.complianceChanges,
    errors: result.errors,
    durationMs: result.durationMs,
  };
}

/**
 * Get human-readable compliance state label
 */
export function getComplianceStateLabel(
  state: IntuneDeviceDTO["complianceState"],
): string {
  const labels: Record<IntuneDeviceDTO["complianceState"], string> = {
    COMPLIANT: "Compliant",
    NON_COMPLIANT: "Non-Compliant",
    CONFLICT: "Conflict",
    ERROR: "Error",
    IN_GRACE_PERIOD: "In Grace Period",
    CONFIG_MANAGER: "Config Manager",
    UNKNOWN: "Unknown",
  };
  return labels[state];
}

/**
 * Get human-readable ownership type label
 */
export function getOwnershipTypeLabel(
  type: IntuneDeviceDTO["ownershipType"],
): string {
  const labels: Record<IntuneDeviceDTO["ownershipType"], string> = {
    CORPORATE: "Corporate",
    PERSONAL: "Personal",
    UNKNOWN: "Unknown",
  };
  return labels[type];
}

/**
 * Get human-readable management state label
 */
export function getManagementStateLabel(
  state: IntuneDeviceDTO["managementState"],
): string {
  const labels: Record<IntuneDeviceDTO["managementState"], string> = {
    MANAGED: "Managed",
    RETIRE_PENDING: "Retire Pending",
    RETIRE_ISSUED: "Retire Issued",
    WIPE_PENDING: "Wipe Pending",
    WIPE_ISSUED: "Wipe Issued",
    UNHEALTHY: "Unhealthy",
    DELETE_PENDING: "Delete Pending",
    DISCOVERED: "Discovered",
  };
  return labels[state];
}

/**
 * Get compliance state color for badges
 * Note: Badge component supports: default, secondary, destructive, outline
 */
export function getComplianceStateColor(
  state: IntuneDeviceDTO["complianceState"],
): "default" | "destructive" | "secondary" | "outline" {
  const colors: Record<
    IntuneDeviceDTO["complianceState"],
    "default" | "destructive" | "secondary" | "outline"
  > = {
    COMPLIANT: "default", // Primary color for compliant
    NON_COMPLIANT: "destructive",
    CONFLICT: "outline",
    ERROR: "destructive",
    IN_GRACE_PERIOD: "secondary",
    CONFIG_MANAGER: "secondary",
    UNKNOWN: "outline",
  };
  return colors[state];
}

/**
 * Get ownership type color for badges
 * Note: Badge component supports: default, secondary, destructive, outline
 */
export function getOwnershipTypeColor(
  type: IntuneDeviceDTO["ownershipType"],
): "default" | "secondary" | "outline" {
  const colors: Record<
    IntuneDeviceDTO["ownershipType"],
    "default" | "secondary" | "outline"
  > = {
    CORPORATE: "default", // Primary color for corporate
    PERSONAL: "secondary",
    UNKNOWN: "outline",
  };
  return colors[type];
}

/**
 * Present a single IntuneComplianceHistory entity as a DTO
 */
export function presentComplianceHistory(
  history: IntuneComplianceHistory,
): IntuneComplianceHistoryDTO {
  return {
    id: history.id,
    intuneDeviceId: history.intuneDeviceId,
    previousState: history.previousState,
    newState: history.newState,
    changedAt: history.changedAt.toISOString(),
    policyName: history.policyName,
    policyId: history.policyId,
    reason: history.reason,
  };
}

/**
 * Present multiple IntuneComplianceHistory entities as DTOs
 */
export function presentComplianceHistories(
  histories: IntuneComplianceHistory[],
): IntuneComplianceHistoryDTO[] {
  return histories.map(presentComplianceHistory);
}
