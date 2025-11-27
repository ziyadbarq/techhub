/**
 * Sync Devices from Intune Use Case
 *
 * Orchestrates device synchronization from Microsoft Intune via Graph API.
 * Handles:
 * - Full sync of all managed devices
 * - Auto-linking to Assets (by serial number)
 * - Auto-linking to Persons (by Intune userId → Azure AD ID)
 * - Compliance history tracking
 * - Deactivation of removed devices
 *
 * Identity Strategy:
 * - Uses intuneDeviceId (immutable GUID) as source of truth
 * - Serial number used for Asset matching (when available)
 * - Intune userId (Azure AD ID) used for Person matching
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { IMicrosoftGraphService } from "@/core/services/microsoft-graph.service.interface";
import type { IIntuneDeviceRepository } from "@/core/repositories/intune-device.repository.interface";
import type { IIntuneComplianceHistoryRepository } from "@/core/repositories/intune-device.repository.interface";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import {
  IntuneDevice,
  type IntuneComplianceState,
} from "@/core/domain/entities/intune-device.entity";
import { IntuneComplianceHistory } from "@/core/domain/entities/intune-compliance-history.entity";
import {
  transformGraphDeviceToSyncInput,
  type FetchDevicesOptions,
} from "@/lib/schemas/graph-intune-device.schema";

/**
 * Result of a sync operation
 */
export interface IntuneSyncResult {
  /** Devices created (new to our system) */
  created: number;
  /** Devices updated (already existed) */
  updated: number;
  /** Devices deactivated (removed from Intune) */
  deactivated: number;
  /** Devices auto-linked to Assets */
  linkedToAssets: number;
  /** Devices auto-linked to Persons */
  linkedToPersons: number;
  /** Compliance state changes recorded */
  complianceChanges: number;
  /** Errors encountered */
  errors: Array<{
    intuneDeviceId: string;
    deviceName?: string;
    error: string;
  }>;
  /** Duration in milliseconds */
  durationMs: number;
}

/**
 * Options for the sync operation
 */
export interface SyncDevicesOptions extends FetchDevicesOptions {
  /**
   * Automatically link devices to Assets by serial number
   * @default true
   */
  autoLinkToAssets?: boolean;

  /**
   * Automatically link devices to Persons by Intune userId (Azure AD ID)
   * @default true
   */
  autoLinkToPersons?: boolean;

  /**
   * Track compliance state changes in history
   * @default true
   */
  trackComplianceHistory?: boolean;

  /**
   * Deactivate devices not found in Intune
   * @default true
   */
  deactivateMissing?: boolean;

  /**
   * Dry run - don't actually make changes
   * @default false
   */
  dryRun?: boolean;
}

@injectable()
export class SyncDevicesFromIntuneUseCase {
  private readonly logger: ILoggerService;

  constructor(
    @inject(DI_TOKENS.ILoggerService) logger: ILoggerService,
    @inject(DI_TOKENS.IIntuneDeviceRepository)
    private readonly deviceRepository: IIntuneDeviceRepository,
    @inject(DI_TOKENS.IIntuneComplianceHistoryRepository)
    private readonly complianceHistoryRepository: IIntuneComplianceHistoryRepository,
    @inject(DI_TOKENS.IAssetRepository)
    private readonly assetRepository: IAssetRepository,
    @inject(DI_TOKENS.IPersonRepository)
    private readonly personRepository: IPersonRepository,
    @inject(IMicrosoftGraphService)
    private readonly graphService: IMicrosoftGraphService,
  ) {
    this.logger = logger.child({ useCase: "SyncDevicesFromIntuneUseCase" });
  }

  /**
   * Execute device sync from Microsoft Intune
   */
  async execute(options?: SyncDevicesOptions): Promise<IntuneSyncResult> {
    const startTime = Date.now();
    const result: IntuneSyncResult = {
      created: 0,
      updated: 0,
      deactivated: 0,
      linkedToAssets: 0,
      linkedToPersons: 0,
      complianceChanges: 0,
      errors: [],
      durationMs: 0,
    };

    const opts = {
      autoLinkToAssets: options?.autoLinkToAssets ?? true,
      autoLinkToPersons: options?.autoLinkToPersons ?? true,
      trackComplianceHistory: options?.trackComplianceHistory ?? true,
      deactivateMissing: options?.deactivateMissing ?? true,
      dryRun: options?.dryRun ?? false,
      ownershipType: options?.ownershipType,
      complianceState: options?.complianceState,
      operatingSystem: options?.operatingSystem,
    };

    this.logger.info("Starting device sync from Microsoft Intune", {
      options: opts,
    });

    try {
      // Fetch all devices from Intune
      this.logger.info("Fetching devices from Microsoft Intune...");
      const graphDevices = await this.graphService.fetchAllManagedDevices({
        ownershipType: opts.ownershipType,
        complianceState: opts.complianceState,
        operatingSystem: opts.operatingSystem,
      });
      this.logger.info("Fetched devices from Intune", {
        count: graphDevices.length,
      });

      // Track all Intune device IDs for deactivation pass
      const currentIntuneIds: string[] = [];

      // Process each device
      for (const graphDevice of graphDevices) {
        try {
          const syncInput = transformGraphDeviceToSyncInput(graphDevice);
          currentIntuneIds.push(syncInput.intuneDeviceId);

          // Find existing device by Intune Device ID or Azure AD Device ID
          // (handles re-enrolled devices where intuneDeviceId changes but azureAdDeviceId remains)
          let existingDevice = await this.deviceRepository.findByIntuneDeviceId(
            syncInput.intuneDeviceId,
          );

          // If not found by intuneDeviceId, try azureAdDeviceId (re-enrollment case)
          if (!existingDevice && syncInput.azureAdDeviceId) {
            existingDevice = await this.deviceRepository.findByAzureAdDeviceId(
              syncInput.azureAdDeviceId,
            );
          }

          if (existingDevice) {
            // Track compliance changes before update
            if (
              opts.trackComplianceHistory &&
              existingDevice.hasComplianceChanged(syncInput.complianceState)
            ) {
              await this.recordComplianceChange(
                existingDevice.id,
                existingDevice.complianceState,
                syncInput.complianceState,
                opts.dryRun,
              );
              result.complianceChanges++;
            }

            // Update existing device
            if (!opts.dryRun) {
              existingDevice.update({
                // Update intuneDeviceId in case of re-enrollment
                intuneDeviceId: syncInput.intuneDeviceId,
                azureAdDeviceId: syncInput.azureAdDeviceId,
                deviceName: syncInput.deviceName,
                serialNumber: syncInput.serialNumber,
                manufacturer: syncInput.manufacturer,
                model: syncInput.model,
                operatingSystem: syncInput.operatingSystem,
                osVersion: syncInput.osVersion,
                imei: syncInput.imei,
                wiFiMacAddress: syncInput.wiFiMacAddress,
                ethernetMacAddress: syncInput.ethernetMacAddress,
                intuneUserId: syncInput.intuneUserId,
                userPrincipalName: syncInput.userPrincipalName,
                userDisplayName: syncInput.userDisplayName,
                ownershipType: syncInput.ownershipType,
                complianceState: syncInput.complianceState,
                managementState: syncInput.managementState,
                isEncrypted: syncInput.isEncrypted,
                isSupervised: syncInput.isSupervised,
                isJailBroken: syncInput.isJailBroken,
                enrolledDateTime: syncInput.enrolledDateTime,
                lastSyncDateTime: syncInput.lastSyncDateTime,
                isActive: true, // Re-activate if was deactivated
              });
              await this.deviceRepository.update(existingDevice);
            }
            result.updated++;

            // Auto-link to Asset if not already linked
            if (
              opts.autoLinkToAssets &&
              !existingDevice.isLinkedToAsset() &&
              syncInput.serialNumber
            ) {
              const linked = await this.tryLinkToAsset(
                existingDevice,
                syncInput.serialNumber,
                opts.dryRun,
              );
              if (linked) result.linkedToAssets++;
            }

            // Auto-link to Person if not already linked
            if (
              opts.autoLinkToPersons &&
              !existingDevice.isLinkedToPerson() &&
              syncInput.intuneUserId
            ) {
              const linked = await this.tryLinkToPerson(
                existingDevice,
                syncInput.intuneUserId,
                opts.dryRun,
              );
              if (linked) result.linkedToPersons++;
            }
          } else {
            // Create new device
            if (!opts.dryRun) {
              const newDevice = IntuneDevice.create({
                intuneDeviceId: syncInput.intuneDeviceId,
                azureAdDeviceId: syncInput.azureAdDeviceId,
                deviceName: syncInput.deviceName,
                serialNumber: syncInput.serialNumber,
                manufacturer: syncInput.manufacturer,
                model: syncInput.model,
                operatingSystem: syncInput.operatingSystem,
                osVersion: syncInput.osVersion,
                imei: syncInput.imei,
                wiFiMacAddress: syncInput.wiFiMacAddress,
                ethernetMacAddress: syncInput.ethernetMacAddress,
                intuneUserId: syncInput.intuneUserId,
                userPrincipalName: syncInput.userPrincipalName,
                userDisplayName: syncInput.userDisplayName,
                ownershipType: syncInput.ownershipType,
                complianceState: syncInput.complianceState,
                managementState: syncInput.managementState,
                isEncrypted: syncInput.isEncrypted,
                isSupervised: syncInput.isSupervised,
                isJailBroken: syncInput.isJailBroken,
                enrolledDateTime: syncInput.enrolledDateTime,
                lastSyncDateTime: syncInput.lastSyncDateTime,
              });

              const createdDevice =
                await this.deviceRepository.create(newDevice);

              // Auto-link to Asset
              if (opts.autoLinkToAssets && syncInput.serialNumber) {
                const linked = await this.tryLinkToAsset(
                  createdDevice,
                  syncInput.serialNumber,
                  opts.dryRun,
                );
                if (linked) result.linkedToAssets++;
              }

              // Auto-link to Person
              if (opts.autoLinkToPersons && syncInput.intuneUserId) {
                const linked = await this.tryLinkToPerson(
                  createdDevice,
                  syncInput.intuneUserId,
                  opts.dryRun,
                );
                if (linked) result.linkedToPersons++;
              }
            }
            result.created++;
          }
        } catch (error) {
          result.errors.push({
            intuneDeviceId: graphDevice.id,
            deviceName: graphDevice.deviceName ?? undefined,
            error: error instanceof Error ? error.message : String(error),
          });
          this.logger.warn("Failed to sync device", {
            intuneDeviceId: graphDevice.id,
            deviceName: graphDevice.deviceName ?? "Unknown",
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Deactivate devices no longer in Intune
      if (opts.deactivateMissing && !opts.dryRun) {
        this.logger.info("Deactivating devices removed from Intune...");
        const deactivatedCount =
          await this.deviceRepository.deactivateNotIn(currentIntuneIds);
        result.deactivated = deactivatedCount;
      }

      result.durationMs = Date.now() - startTime;

      this.logger.info("Device sync completed", {
        created: result.created,
        updated: result.updated,
        deactivated: result.deactivated,
        linkedToAssets: result.linkedToAssets,
        linkedToPersons: result.linkedToPersons,
        complianceChanges: result.complianceChanges,
        errors: result.errors.length,
        durationMs: result.durationMs,
      });

      return result;
    } catch (error) {
      result.durationMs = Date.now() - startTime;
      this.logger.error(
        "Device sync failed",
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  }

  /**
   * Try to auto-link device to Asset by serial number
   */
  private async tryLinkToAsset(
    device: IntuneDevice,
    serialNumber: string,
    dryRun?: boolean,
  ): Promise<boolean> {
    try {
      const asset = await this.assetRepository.findBySerialNumber(serialNumber);
      if (asset) {
        if (!dryRun) {
          device.linkToAsset(asset.id, "auto_serial");
          await this.deviceRepository.update(device);
        }
        this.logger.debug("Auto-linked device to asset", {
          intuneDeviceId: device.intuneDeviceId,
          assetId: asset.id,
          serialNumber,
        });
        return true;
      }
    } catch (error) {
      this.logger.warn("Failed to auto-link device to asset", {
        intuneDeviceId: device.intuneDeviceId,
        serialNumber,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return false;
  }

  /**
   * Try to auto-link device to Person by Intune userId (Azure AD ID)
   */
  private async tryLinkToPerson(
    device: IntuneDevice,
    intuneUserId: string,
    dryRun?: boolean,
  ): Promise<boolean> {
    try {
      // Intune userId is the Azure AD Object ID
      const person = await this.personRepository.findByAzureAdId(intuneUserId);
      if (person) {
        if (!dryRun) {
          device.linkToPerson(person.id, "auto_azuread");
          await this.deviceRepository.update(device);
        }
        this.logger.debug("Auto-linked device to person", {
          intuneDeviceId: device.intuneDeviceId,
          personId: person.id,
          intuneUserId,
        });
        return true;
      }
    } catch (error) {
      this.logger.warn("Failed to auto-link device to person", {
        intuneDeviceId: device.intuneDeviceId,
        intuneUserId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return false;
  }

  /**
   * Record compliance state change in history
   */
  private async recordComplianceChange(
    deviceId: string,
    previousState: IntuneComplianceState,
    newState: IntuneComplianceState,
    dryRun?: boolean,
  ): Promise<void> {
    if (dryRun) return;

    try {
      const history = IntuneComplianceHistory.create({
        intuneDeviceId: deviceId,
        previousState,
        newState,
      });
      await this.complianceHistoryRepository.create(history);
      this.logger.debug("Recorded compliance change", {
        deviceId,
        previousState,
        newState,
      });
    } catch (error) {
      this.logger.warn("Failed to record compliance change", {
        deviceId,
        previousState,
        newState,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
