/**
 * GetServiceSlaMetrics Use Case
 *
 * Retrieves SLA metric records for a service
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceRepository } from "@/core/repositories/service.repository.interface";
import type { IServiceSlaMetricRepository } from "@/core/repositories/service-sla-metric.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { ServiceSlaMetric } from "@/core/domain/entities/service-sla-metric.entity";

export interface GetServiceSlaMetricsRequest {
  serviceId: string;
  limit?: number;
  skip?: number;
}

@injectable()
export class GetServiceSlaMetricsUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceRepository)
    private readonly serviceRepository: IServiceRepository,
    @inject(DI_TOKENS.IServiceSlaMetricRepository)
    private readonly slaMetricRepository: IServiceSlaMetricRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(
    request: GetServiceSlaMetricsRequest,
  ): Promise<ServiceSlaMetric[]> {
    this.logger.info("Getting service SLA metrics", {
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

    // Get SLA metric records
    const metrics = await this.slaMetricRepository.findByServiceId(
      request.serviceId,
      {
        skip: request.skip,
        take: request.limit,
      },
    );

    this.logger.info("Service SLA metrics retrieved", {
      serviceId: request.serviceId,
      count: metrics.length,
    });

    return metrics;
  }
}
