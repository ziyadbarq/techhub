/**
 * Get Intune Device Use Case
 *
 * Retrieves a single Intune device by ID.
 */

import { inject, injectable } from "inversify";
import { ValidationError } from "@/core/domain/errors/validation.error";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IIntuneDeviceRepository } from "@/core/repositories/intune-device.repository.interface";
import type { IntuneDevice } from "@/core/domain/entities/intune-device.entity";

export interface GetIntuneDeviceInput {
  /** Our internal device ID */
  id?: string;
  /** Intune device ID (from Microsoft) */
  intuneDeviceId?: string;
  /** Azure AD Device ID */
  azureAdDeviceId?: string;
  /** Serial number */
  serialNumber?: string;
}

@injectable()
export class GetIntuneDeviceUseCase {
  private readonly logger: ILoggerService;

  constructor(
    @inject(DI_TOKENS.ILoggerService) logger: ILoggerService,
    @inject(DI_TOKENS.IIntuneDeviceRepository)
    private readonly deviceRepository: IIntuneDeviceRepository,
  ) {
    this.logger = logger.child({ useCase: "GetIntuneDeviceUseCase" });
  }

  async execute(input: GetIntuneDeviceInput): Promise<IntuneDevice | null> {
    this.logger.debug("Getting Intune device", { ...input });

    let device: IntuneDevice | null = null;

    if (input.id) {
      device = await this.deviceRepository.findById(input.id);
    } else if (input.intuneDeviceId) {
      device = await this.deviceRepository.findByIntuneDeviceId(
        input.intuneDeviceId,
      );
    } else if (input.azureAdDeviceId) {
      device = await this.deviceRepository.findByAzureAdDeviceId(
        input.azureAdDeviceId,
      );
    } else if (input.serialNumber) {
      device = await this.deviceRepository.findBySerialNumber(
        input.serialNumber,
      );
    } else {
      throw new ValidationError(
        "At least one identifier (id, intuneDeviceId, azureAdDeviceId, serialNumber) is required",
      );
    }

    if (device) {
      this.logger.debug("Found Intune device", {
        id: device.id,
        intuneDeviceId: device.intuneDeviceId,
        deviceName: device.deviceName,
      });
    }

    return device;
  }
}
