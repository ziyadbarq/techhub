/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceRepository } from "@/core/repositories/service.repository.interface";
import type { Service } from "@/core/domain/entities/service.entity";
import type {
  ServiceType,
  ServiceStatus,
  DataConfidentiality,
  BusinessImpactLevel,
  CriticalityLevel,
} from "@/generated/prisma";

export interface UpdateServiceRequest {
  serviceId: string;
  name?: string;
  serviceType?: ServiceType;
  description?: string;
  businessPurpose?: string;
  gitlabRepoUrl?: string;
  dataConfidentiality?: DataConfidentiality;
  businessImpactLevel?: BusinessImpactLevel;
  criticality?: CriticalityLevel;
  isEssentialService?: boolean;
  deploymentDate?: Date;
  currentStatus?: ServiceStatus;
  lastPatchDate?: Date;
  plannedDecommissionDate?: Date;
  vendorId?: string;
  slaDetails?: Record<string, unknown>;
  businessProcessId?: string;
  isInCentralRegister?: boolean;
  complianceNotes?: string;
  metadata?: Record<string, unknown>;
  updatedBy?: string;

  // SLA Fields
  slaResponseTimeP50?: number;
  slaResponseTimeP95?: number;
  slaResponseTimeP99?: number;
  slaResolutionTimeCritical?: number;
  slaResolutionTimeHigh?: number;
  slaResolutionTimeMedium?: number;
  slaUptimePercentage?: number;
  slaErrorRateThreshold?: number;
  slaSupportTier?: string;
  slaContactEmail?: string;
  slaEscalationPath?: string;

  // Health Monitoring Fields
  healthCheckUrl?: string;
  healthCheckInterval?: number;
  healthCheckTimeout?: number;
  healthCheckEnabled?: boolean;
}

@injectable()
export class UpdateServiceUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceRepository)
    private readonly serviceRepository: IServiceRepository,
  ) {}

  async execute(request: UpdateServiceRequest): Promise<Service> {
    const service = await this.serviceRepository.findById(request.serviceId);
    if (!service) {
      throw new Error(`Service with ID ${request.serviceId} not found`);
    }

    // Check if name is being changed and if new name already exists
    if (request.name && request.name !== service.name) {
      const nameExists = await this.serviceRepository.existsByName(
        request.name,
        request.serviceId,
      );
      if (nameExists) {
        throw new Error(`Service with name "${request.name}" already exists`);
      }
    }

    service.update(
      {
        name: request.name,
        serviceType: request.serviceType,
        description: request.description,
        businessPurpose: request.businessPurpose,
        gitlabRepoUrl: request.gitlabRepoUrl,
        dataConfidentiality: request.dataConfidentiality,
        businessImpactLevel: request.businessImpactLevel,
        criticality: request.criticality,
        isEssentialService: request.isEssentialService,
        deploymentDate: request.deploymentDate,
        currentStatus: request.currentStatus,
        lastPatchDate: request.lastPatchDate,
        plannedDecommissionDate: request.plannedDecommissionDate,
        vendorId: request.vendorId,
        slaDetails: request.slaDetails,
        businessProcessId: request.businessProcessId,
        isInCentralRegister: request.isInCentralRegister,
        complianceNotes: request.complianceNotes,
        metadata: request.metadata,

        // SLA Fields
        slaResponseTimeP50: request.slaResponseTimeP50,
        slaResponseTimeP95: request.slaResponseTimeP95,
        slaResponseTimeP99: request.slaResponseTimeP99,
        slaResolutionTimeCritical: request.slaResolutionTimeCritical,
        slaResolutionTimeHigh: request.slaResolutionTimeHigh,
        slaResolutionTimeMedium: request.slaResolutionTimeMedium,
        slaUptimePercentage: request.slaUptimePercentage,
        slaErrorRateThreshold: request.slaErrorRateThreshold,
        slaSupportTier: request.slaSupportTier,
        slaContactEmail: request.slaContactEmail,
        slaEscalationPath: request.slaEscalationPath,

        // Health Monitoring Fields
        healthCheckUrl: request.healthCheckUrl,
        healthCheckInterval: request.healthCheckInterval,
        healthCheckTimeout: request.healthCheckTimeout,
        healthCheckEnabled: request.healthCheckEnabled,
      },
      request.updatedBy,
    );

    return this.serviceRepository.update(service);
  }
}
