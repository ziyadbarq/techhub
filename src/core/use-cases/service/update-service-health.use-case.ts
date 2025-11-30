/**
 * UpdateServiceHealth Use Case
 *
 * Updates a service's health status and related monitoring metrics
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceRepository } from "@/core/repositories/service.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { Service } from "@/core/domain/entities/service.entity";
import type { ServiceHealthStatus } from "@/generated/prisma";

export interface UpdateServiceHealthRequest {
  serviceId: string;
  healthStatus: ServiceHealthStatus;
  responseTime?: number;
  errorRate?: number;
  lastIncidentDate?: Date;
  lastDowntimeDate?: Date;
  lastDowntimeDuration?: number;
  mttrMinutes?: number;
  mtbfHours?: number;
}

@injectable()
export class UpdateServiceHealthUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceRepository)
    private readonly serviceRepository: IServiceRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(request: UpdateServiceHealthRequest): Promise<Service> {
    this.logger.info("Updating service health", {
      serviceId: request.serviceId,
      healthStatus: request.healthStatus,
    });

    // Find the service
    let service = await this.serviceRepository.findById(request.serviceId);

    if (!service) {
      const error = new Error("Service not found");
      this.logger.error("Service not found", error, {
        serviceId: request.serviceId,
      });
      throw error;
    }

    // Update health status using domain method
    service.updateHealthStatus(request.healthStatus, request.responseTime);

    // Update additional metrics if provided
    if (request.errorRate !== undefined) {
      // Access private props via toObject() and update
      const props = service.toObject();
      const updatedService = await this.serviceRepository.update(
        Object.assign(service, {
          ...props,
          currentErrorRate: request.errorRate,
        }),
      );
      service = updatedService;
    }

    if (request.lastIncidentDate !== undefined) {
      const props = service.toObject();
      const updatedService = await this.serviceRepository.update(
        Object.assign(service, {
          ...props,
          lastIncidentDate: request.lastIncidentDate,
        }),
      );
      service = updatedService;
    }

    if (request.lastDowntimeDate !== undefined) {
      const props = service.toObject();
      const updatedService = await this.serviceRepository.update(
        Object.assign(service, {
          ...props,
          lastDowntimeDate: request.lastDowntimeDate,
        }),
      );
      service = updatedService;
    }

    if (request.lastDowntimeDuration !== undefined) {
      const props = service.toObject();
      const updatedService = await this.serviceRepository.update(
        Object.assign(service, {
          ...props,
          lastDowntimeDuration: request.lastDowntimeDuration,
        }),
      );
      service = updatedService;
    }

    if (request.mttrMinutes !== undefined) {
      const props = service.toObject();
      const updatedService = await this.serviceRepository.update(
        Object.assign(service, {
          ...props,
          mttrMinutes: request.mttrMinutes,
        }),
      );
      service = updatedService;
    }

    if (request.mtbfHours !== undefined) {
      const props = service.toObject();
      const updatedService = await this.serviceRepository.update(
        Object.assign(service, {
          ...props,
          mtbfHours: request.mtbfHours,
        }),
      );
      service = updatedService;
    }

    // Update uptime metrics
    service.updateUptimeMetrics();

    // Persist the updated service
    const updatedService = await this.serviceRepository.update(service);

    this.logger.info("Service health updated successfully", {
      serviceId: request.serviceId,
      healthStatus: request.healthStatus,
      nextScheduledHealthCheck: updatedService.nextScheduledHealthCheck,
    });

    return updatedService;
  }
}
