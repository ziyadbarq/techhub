/**
 * List Intune Devices Use Case
 *
 * Retrieves a paginated list of Intune devices with optional filters.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type {
  IIntuneDeviceRepository,
  IntuneDeviceFilters,
  PaginationOptions,
} from "@/core/repositories/intune-device.repository.interface";
import type { IntuneDevice } from "@/core/domain/entities/intune-device.entity";

export interface ListIntuneDevicesInput {
  filters?: IntuneDeviceFilters;
  pagination?: PaginationOptions;
}

export interface ListIntuneDevicesOutput {
  devices: IntuneDevice[];
  total: number;
  hasMore: boolean;
}

@injectable()
export class ListIntuneDevicesUseCase {
  private readonly logger: ILoggerService;

  constructor(
    @inject(DI_TOKENS.ILoggerService) logger: ILoggerService,
    @inject(DI_TOKENS.IIntuneDeviceRepository)
    private readonly deviceRepository: IIntuneDeviceRepository,
  ) {
    this.logger = logger.child({ useCase: "ListIntuneDevicesUseCase" });
  }

  async execute(
    input: ListIntuneDevicesInput,
  ): Promise<ListIntuneDevicesOutput> {
    this.logger.debug("Listing Intune devices", { ...input });

    const [devices, total] = await Promise.all([
      this.deviceRepository.findAll(input.filters, input.pagination),
      this.deviceRepository.count(input.filters),
    ]);

    const skip = input.pagination?.skip ?? 0;
    const hasMore = skip + devices.length < total;

    this.logger.debug("Listed Intune devices", {
      count: devices.length,
      total,
      hasMore,
    });

    return {
      devices,
      total,
      hasMore,
    };
  }
}
