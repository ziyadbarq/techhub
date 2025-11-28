/**
 * Bulk Create Assets From Intune Devices Use Case
 *
 * Creates ITAM Assets from multiple Intune devices.
 * Reuses the single-device creation logic for consistency.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IIntuneDeviceRepository } from "@/core/repositories/intune-device.repository.interface";
import type {
  CreateAssetFromIntuneDeviceOutput,
  CreateAssetFromIntuneDeviceUseCase,
} from "./create-asset-from-intune-device.use-case";

export interface BulkCreateAssetsInput {
  /** Array of Intune device IDs to create assets from */
  deviceIds: string[];
  /** Asset category ID (required, applies to all) */
  categoryId: string;
  /** Optional stock location ID (applies to all) */
  stockLocationId?: string;
  /** Optional lifecycle state ID (applies to all) */
  lifecycleStateId?: string;
  /** Whether to auto-create vendor from manufacturer (default: true) */
  autoCreateVendor?: boolean;
  /** Whether to auto-create asset model from model (default: true) */
  autoCreateModel?: boolean;
  /** Whether to auto-link created assets to devices (default: true) */
  autoLinkToDevice?: boolean;
}

export interface BulkCreateAssetResult {
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

export interface BulkCreateAssetsOutput {
  results: BulkCreateAssetResult[];
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

@injectable()
export class BulkCreateAssetsFromIntuneDevicesUseCase {
  private readonly logger: ILoggerService;

  constructor(
    @inject(DI_TOKENS.ILoggerService) logger: ILoggerService,
    @inject(DI_TOKENS.IIntuneDeviceRepository)
    private readonly deviceRepository: IIntuneDeviceRepository,
    @inject(DI_TOKENS.CreateAssetFromIntuneDeviceUseCase)
    private readonly createAssetUseCase: CreateAssetFromIntuneDeviceUseCase,
  ) {
    this.logger = logger.child({
      useCase: "BulkCreateAssetsFromIntuneDevicesUseCase",
    });
  }

  async execute(input: BulkCreateAssetsInput): Promise<BulkCreateAssetsOutput> {
    const startTime = Date.now();
    const {
      deviceIds,
      categoryId,
      stockLocationId,
      lifecycleStateId,
      autoCreateVendor = true,
      autoCreateModel = true,
      autoLinkToDevice = true,
    } = input;

    this.logger.info("Starting bulk asset creation", {
      deviceCount: deviceIds.length,
      categoryId,
    });

    const results: BulkCreateAssetResult[] = [];
    let created = 0;
    let skipped = 0;
    let failed = 0;
    let vendorsCreated = 0;
    let modelsCreated = 0;

    // Process each device
    for (const deviceId of deviceIds) {
      // First, get the device to check if it has a serial number
      const device = await this.deviceRepository.findById(deviceId);

      if (!device) {
        results.push({
          deviceId,
          deviceName: "Unknown",
          serialNumber: null,
          success: false,
          error: "Device not found",
        });
        failed++;
        continue;
      }

      // Skip devices without valid serial numbers
      if (!device.serialNumber || device.serialNumber === "0") {
        results.push({
          deviceId,
          deviceName: device.deviceName,
          serialNumber: device.serialNumber,
          success: false,
          error: "No valid serial number - skipped",
        });
        skipped++;
        continue;
      }

      // Skip devices that already have a linked asset
      if (device.linkedAssetId) {
        results.push({
          deviceId,
          deviceName: device.deviceName,
          serialNumber: device.serialNumber,
          success: false,
          error: "Device already linked to an asset - skipped",
        });
        skipped++;
        continue;
      }

      // Try to create the asset
      try {
        const result: CreateAssetFromIntuneDeviceOutput =
          await this.createAssetUseCase.execute({
            deviceId,
            categoryId,
            stockLocationId,
            lifecycleStateId,
            autoCreateVendor,
            autoCreateModel,
            autoLinkToDevice,
          });

        results.push({
          deviceId,
          deviceName: device.deviceName,
          serialNumber: device.serialNumber,
          success: true,
          assetTag: result.asset.assetTag,
          assetId: result.asset.id,
          vendorCreated: result.vendorCreated,
          modelCreated: result.modelCreated,
        });

        created++;
        if (result.vendorCreated) vendorsCreated++;
        if (result.modelCreated) modelsCreated++;

        this.logger.debug("Created asset for device", {
          deviceId,
          assetTag: result.asset.assetTag,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        results.push({
          deviceId,
          deviceName: device.deviceName,
          serialNumber: device.serialNumber,
          success: false,
          error: errorMessage,
        });
        failed++;

        this.logger.warn("Failed to create asset for device", {
          deviceId,
          error: errorMessage,
        });
      }
    }

    const durationMs = Date.now() - startTime;

    this.logger.info("Bulk asset creation completed", {
      total: deviceIds.length,
      created,
      skipped,
      failed,
      vendorsCreated,
      modelsCreated,
      durationMs,
    });

    return {
      results,
      summary: {
        total: deviceIds.length,
        created,
        skipped,
        failed,
        vendorsCreated,
        modelsCreated,
      },
      durationMs,
    };
  }
}
