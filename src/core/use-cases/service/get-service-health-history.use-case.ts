/**
 * GetServiceHealthHistory Use Case
 *
 * Retrieves health history records for a service
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceRepository } from "@/core/repositories/service.repository.interface";
import type { IServiceHealthHistoryRepository } from "@/core/repositories/service-health-history.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { ServiceHealthHistory } from "@/core/domain/entities/service-health-history.entity";

export interface GetServiceHealthHistoryRequest {
  serviceId: string;
  limit?: number;
  skip?: number;
}

@injectable()
export class GetServiceHealthHistoryUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceRepository)
    private readonly serviceRepository: IServiceRepository,
    @inject(DI_TOKENS.IServiceHealthHistoryRepository)
    private readonly healthHistoryRepository: IServiceHealthHistoryRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(
    request: GetServiceHealthHistoryRequest,
  ): Promise<ServiceHealthHistory[]> {
    this.logger.info("Getting service health history", {
      serviceId: request.serviceId,
      limit: request.limit,
    });

    // Verify service exists
    const service = await this.serviceRepository.findById(request.serviceId);

    if (!service) {
      const error = new Error("Service not found");
      this.logger.error("Service not found", error, {
        serviceId: request.serviceId,
      });
      throw error;
    }

    // Get health history records
    const histories = await this.healthHistoryRepository.findByServiceId(
      request.serviceId,
      {
        skip: request.skip,
        take: request.limit,
      },
    );

    this.logger.info("Service health history retrieved", {
      serviceId: request.serviceId,
      count: histories.length,
    });

    return histories;
  }
}
