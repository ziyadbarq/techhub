/**
 * Link Intune Device to Asset Use Case
 *
 * Manually links an Intune device to an ITAM Asset.
 * Used when auto-linking doesn't work (e.g., serial number mismatch)
 * or for manual reconciliation.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IIntuneDeviceRepository } from "@/core/repositories/intune-device.repository.interface";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import type { IntuneDevice } from "@/core/domain/entities/intune-device.entity";
import { SyncAssetAssignmentFromIntuneDeviceUseCase } from "./sync-asset-assignment-from-intune-device.use-case";

export interface LinkDeviceToAssetInput {
  /** Intune device ID (our internal ID, not Intune's) */
  deviceId: string;
  /** ITAM Asset ID to link to */
  assetId: string;
}

export interface LinkDeviceToAssetOutput {
  device: IntuneDevice;
  message: string;
}

@injectable()
export class LinkIntuneDeviceToAssetUseCase {
  private readonly logger: ILoggerService;

  constructor(
    @inject(DI_TOKENS.ILoggerService) logger: ILoggerService,
    @inject(DI_TOKENS.IIntuneDeviceRepository)
    private readonly deviceRepository: IIntuneDeviceRepository,
    @inject(DI_TOKENS.IAssetRepository)
    private readonly assetRepository: IAssetRepository,
    @inject(SyncAssetAssignmentFromIntuneDeviceUseCase)
    private readonly syncAssignmentUseCase: SyncAssetAssignmentFromIntuneDeviceUseCase,
  ) {
    this.logger = logger.child({ useCase: "LinkIntuneDeviceToAssetUseCase" });
  }

  async execute(
    input: LinkDeviceToAssetInput,
  ): Promise<LinkDeviceToAssetOutput> {
    this.logger.info("Linking Intune device to asset", { ...input });

    // Find the device
    const device = await this.deviceRepository.findById(input.deviceId);
    if (!device) {
      throw new Error(`Intune device not found: ${input.deviceId}`);
    }

    // Find the asset
    const asset = await this.assetRepository.findById(input.assetId);
    if (!asset) {
      throw new Error(`Asset not found: ${input.assetId}`);
    }

    // Check if device is already linked to a different asset
    if (device.isLinkedToAsset() && device.linkedAssetId !== input.assetId) {
      throw new Error(
        `Device is already linked to asset ${device.linkedAssetId}. Unlink first.`,
      );
    }

    // Check if asset already has a linked Intune device
    const existingDeviceForAsset =
      await this.deviceRepository.findByLinkedAsset(input.assetId);
    if (
      existingDeviceForAsset &&
      existingDeviceForAsset.id !== input.deviceId
    ) {
      throw new Error(
        `Asset is already linked to device ${existingDeviceForAsset.intuneDeviceId}. Unlink that device first.`,
      );
    }

    // Link the device to the asset
    device.linkToAsset(input.assetId, "manual");
    const updatedDevice = await this.deviceRepository.update(device);

    this.logger.info("Successfully linked device to asset", {
      deviceId: input.deviceId,
      intuneDeviceId: device.intuneDeviceId,
      assetId: input.assetId,
      assetTag: asset.assetTag,
    });

    // Sync asset assignment if device also has person link
    if (updatedDevice.isLinkedToPerson()) {
      try {
        const syncResult = await this.syncAssignmentUseCase.execute({
          deviceId: updatedDevice.id,
          source: "INTUNE_MANUAL",
        });

        this.logger.info("Asset assignment synced after asset link", {
          deviceId: updatedDevice.id,
          syncAction: syncResult.action,
          assignmentId: syncResult.assignmentId,
        });
      } catch (err) {
        this.logger.error(
          `Failed to sync asset assignment after asset link for device ${updatedDevice.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    return {
      device: updatedDevice,
      message: `Successfully linked device "${device.deviceName}" to asset "${asset.assetTag}"`,
    };
  }
}
