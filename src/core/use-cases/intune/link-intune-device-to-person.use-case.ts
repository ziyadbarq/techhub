/**
 * Link Intune Device to Person Use Case
 *
 * Manually links an Intune device to a Person.
 * Used when auto-linking doesn't work (e.g., Intune userId doesn't match)
 * or for manual reconciliation.
 */

import { inject, injectable } from "inversify";
import { ConflictError } from "@/core/domain/errors/conflict.error";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IIntuneDeviceRepository } from "@/core/repositories/intune-device.repository.interface";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import type { IntuneDevice } from "@/core/domain/entities/intune-device.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface LinkDeviceToPersonInput {
  /** Intune device ID (our internal ID, not Intune's) */
  deviceId: string;
  /** Person ID to link to */
  personId: string;
}

export interface LinkDeviceToPersonOutput {
  device: IntuneDevice;
  message: string;
}

@injectable()
export class LinkIntuneDeviceToPersonUseCase {
  private readonly logger: ILoggerService;

  constructor(
    @inject(DI_TOKENS.ILoggerService) logger: ILoggerService,
    @inject(DI_TOKENS.IIntuneDeviceRepository)
    private readonly deviceRepository: IIntuneDeviceRepository,
    @inject(DI_TOKENS.IPersonRepository)
    private readonly personRepository: IPersonRepository,
  ) {
    this.logger = logger.child({ useCase: "LinkIntuneDeviceToPersonUseCase" });
  }

  async execute(
    input: LinkDeviceToPersonInput,
  ): Promise<LinkDeviceToPersonOutput> {
    this.logger.info("Linking Intune device to person", { ...input });

    // Find the device
    const device = await this.deviceRepository.findById(input.deviceId);
    if (!device) {
      throw new NotFoundError(`Intune device not found: ${input.deviceId}`);
    }

    // Find the person
    const person = await this.personRepository.findById(input.personId);
    if (!person) {
      throw new NotFoundError(`Person not found: ${input.personId}`);
    }

    // Check if device is already linked to a different person
    if (device.isLinkedToPerson() && device.linkedPersonId !== input.personId) {
      throw new ConflictError(
        `Device is already linked to person ${device.linkedPersonId}. Unlink first.`,
      );
    }

    // Link the device to the person (persons can have multiple devices)
    device.linkToPerson(input.personId, "manual");
    const updatedDevice = await this.deviceRepository.update(device);

    this.logger.info("Successfully linked device to person", {
      deviceId: input.deviceId,
      intuneDeviceId: device.intuneDeviceId,
      personId: input.personId,
      personName: `${person.firstName} ${person.lastName}`,
    });

    return {
      device: updatedDevice,
      message: `Successfully linked device "${device.deviceName}" to ${person.firstName} ${person.lastName}`,
    };
  }
}
