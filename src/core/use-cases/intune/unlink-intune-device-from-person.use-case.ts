/**
 * Unlink Intune Device from Person Use Case
 *
 * Removes the link between an Intune device and a Person.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IIntuneDeviceRepository } from "@/core/repositories/intune-device.repository.interface";
import type { IntuneDevice } from "@/core/domain/entities/intune-device.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface UnlinkDeviceFromPersonInput {
  /** Intune device ID (our internal ID, not Intune's) */
  deviceId: string;
}

export interface UnlinkDeviceFromPersonOutput {
  device: IntuneDevice;
  message: string;
}

@injectable()
export class UnlinkIntuneDeviceFromPersonUseCase {
  private readonly logger: ILoggerService;

  constructor(
    @inject(DI_TOKENS.ILoggerService) logger: ILoggerService,
    @inject(DI_TOKENS.IIntuneDeviceRepository)
    private readonly deviceRepository: IIntuneDeviceRepository,
  ) {
    this.logger = logger.child({
      useCase: "UnlinkIntuneDeviceFromPersonUseCase",
    });
  }

  async execute(
    input: UnlinkDeviceFromPersonInput,
  ): Promise<UnlinkDeviceFromPersonOutput> {
    this.logger.info("Unlinking Intune device from person", { ...input });

    // Find the device
    const device = await this.deviceRepository.findById(input.deviceId);
    if (!device) {
      throw new NotFoundError(`Intune device not found: ${input.deviceId}`);
    }

    // Check if device is linked to a person
    if (!device.isLinkedToPerson()) {
      throw new Error("Device is not linked to any person");
    }

    const previousPersonId = device.linkedPersonId;

    // Unlink the device from the person
    device.unlinkFromPerson();
    const updatedDevice = await this.deviceRepository.update(device);

    this.logger.info("Successfully unlinked device from person", {
      deviceId: input.deviceId,
      intuneDeviceId: device.intuneDeviceId,
      previousPersonId,
    });

    return {
      device: updatedDevice,
      message: `Successfully unlinked device "${device.deviceName}" from person`,
    };
  }
}
