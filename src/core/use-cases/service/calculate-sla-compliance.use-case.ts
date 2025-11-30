/**
 * CalculateSlaCompliance Use Case
 *
 * Calculates SLA compliance status for a service based on current metrics
 * and updates the service's slaComplianceStatus field
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceRepository } from "@/core/repositories/service.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { Service } from "@/core/domain/entities/service.entity";
import type { SlaComplianceStatus } from "@/generated/prisma";

export interface CalculateSlaComplianceRequest {
  serviceId: string;
}

export interface CalculateSlaComplianceResponse {
  service: Service;
  previousStatus: SlaComplianceStatus;
  newStatus: SlaComplianceStatus;
  statusChanged: boolean;
  violationDetected: boolean;
}

@injectable()
export class CalculateSlaComplianceUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceRepository)
    private readonly serviceRepository: IServiceRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(
    request: CalculateSlaComplianceRequest,
  ): Promise<CalculateSlaComplianceResponse> {
    this.logger.info("Calculating SLA compliance", {
      serviceId: request.serviceId,
    });

    // Find the service
    const service = await this.serviceRepository.findById(request.serviceId);

    if (!service) {
      const error = new Error("Service not found");
      this.logger.error("Service not found", error, {
        serviceId: request.serviceId,
      });
      throw error;
    }

    // Capture current status
    const previousStatus = service.slaComplianceStatus;

    // Calculate new compliance status using domain logic
    const newStatus = service.calculateSlaCompliance();

    // Update service with new status
    service.updateSlaCompliance();

    // Check if violation was detected
    const violationDetected =
      previousStatus !== "BREACHED" && newStatus === "BREACHED";

    // Record violation if detected
    if (violationDetected) {
      service.recordSlaViolation();
      this.logger.warn("SLA violation detected", {
        serviceId: request.serviceId,
        previousStatus,
        newStatus,
        slaViolationCount: service.slaViolationCount,
      });
    }

    // Persist the updated service
    const updatedService = await this.serviceRepository.update(service);

    const statusChanged = previousStatus !== newStatus;

    this.logger.info("SLA compliance calculated successfully", {
      serviceId: request.serviceId,
      previousStatus,
      newStatus,
      statusChanged,
      violationDetected,
    });

    return {
      service: updatedService,
      previousStatus,
      newStatus,
      statusChanged,
      violationDetected,
    };
  }
}
