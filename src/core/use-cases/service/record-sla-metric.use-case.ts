/**
 * RecordSlaMetric Use Case
 *
 * Records a new SLA metric for a service
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceRepository } from "@/core/repositories/service.repository.interface";
import type { IServiceSlaMetricRepository } from "@/core/repositories/service-sla-metric.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import {
  ServiceSlaMetric,
  type CreateServiceSlaMetricProps,
} from "@/core/domain/entities/service-sla-metric.entity";
import type { SlaMetricType, SlaComplianceStatus } from "@/generated/prisma";

export interface RecordSlaMetricRequest {
  serviceId: string;
  metricType: SlaMetricType;
  periodStart: Date;
  periodEnd: Date;
  targetValue: number;
  actualValue: number;
  complianceStatus: SlaComplianceStatus;
  breachDuration?: number | null;
  incidentCount?: number;
  notes?: string | null;
}

@injectable()
export class RecordSlaMetricUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceRepository)
    private readonly serviceRepository: IServiceRepository,
    @inject(DI_TOKENS.IServiceSlaMetricRepository)
    private readonly slaMetricRepository: IServiceSlaMetricRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(request: RecordSlaMetricRequest): Promise<ServiceSlaMetric> {
    this.logger.info("Recording SLA metric", {
      serviceId: request.serviceId,
      metricType: request.metricType,
      complianceStatus: request.complianceStatus,
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

    // Create the SLA metric entity
    const createProps: CreateServiceSlaMetricProps = {
      serviceId: request.serviceId,
      metricType: request.metricType,
      periodStart: request.periodStart,
      periodEnd: request.periodEnd,
      targetValue: request.targetValue,
      actualValue: request.actualValue,
      complianceStatus: request.complianceStatus,
      breachDuration: request.breachDuration,
      incidentCount: request.incidentCount,
      notes: request.notes,
    };

    const metric = ServiceSlaMetric.create(createProps);

    // Persist the metric
    const savedMetric = await this.slaMetricRepository.create(metric);

    // If breach detected, trigger SLA compliance recalculation
    if (metric.isBreached()) {
      this.logger.warn("SLA metric breach detected", {
        serviceId: request.serviceId,
        metricType: request.metricType,
        targetValue: request.targetValue,
        actualValue: request.actualValue,
        breachPercentage: metric.getBreachPercentage(),
      });

      // Update service SLA compliance status
      service.updateSlaCompliance();
      await this.serviceRepository.update(service);
    }

    this.logger.info("SLA metric recorded successfully", {
      metricId: savedMetric.id,
      serviceId: request.serviceId,
      metricType: request.metricType,
      complianceStatus: request.complianceStatus,
    });

    return savedMetric;
  }
}
