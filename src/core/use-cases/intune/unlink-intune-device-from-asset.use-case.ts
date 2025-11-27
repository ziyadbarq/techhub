/**
 * Unlink Intune Device from Asset Use Case
 *
 * Removes the link between an Intune device and an ITAM Asset.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IIntuneDeviceRepository } from "@/core/repositories/intune-device.repository.interface";
import type { IntuneDevice } from "@/core/domain/entities/intune-device.entity";

export interface UnlinkDeviceFromAssetInput {
  /** Intune device ID (our internal ID, not Intune's) */
  deviceId: string;
}

export interface UnlinkDeviceFromAssetOutput {
  device: IntuneDevice;
  message: string;
}

@injectable()
export class UnlinkIntuneDeviceFromAssetUseCase {
  private readonly logger: ILoggerService;

  constructor(
    @inject(DI_TOKENS.ILoggerService) logger: ILoggerService,
    @inject(DI_TOKENS.IIntuneDeviceRepository)
    private readonly deviceRepository: IIntuneDeviceRepository,
  ) {
    this.logger = logger.child({
      useCase: "UnlinkIntuneDeviceFromAssetUseCase",
    });
  }

  async execute(
    input: UnlinkDeviceFromAssetInput,
  ): Promise<UnlinkDeviceFromAssetOutput> {
    this.logger.info("Unlinking Intune device from asset", { ...input });

    // Find the device
    const device = await this.deviceRepository.findById(input.deviceId);
    if (!device) {
      throw new Error(`Intune device not found: ${input.deviceId}`);
    }

    // Check if device is linked to an asset
    if (!device.isLinkedToAsset()) {
      throw new Error("Device is not linked to any asset");
    }

    const previousAssetId = device.linkedAssetId;

    // Unlink the device from the asset
    device.unlinkFromAsset();
    const updatedDevice = await this.deviceRepository.update(device);

    this.logger.info("Successfully unlinked device from asset", {
      deviceId: input.deviceId,
      intuneDeviceId: device.intuneDeviceId,
      previousAssetId,
    });

    return {
      device: updatedDevice,
      message: `Successfully unlinked device "${device.deviceName}" from asset`,
    };
  }
}
