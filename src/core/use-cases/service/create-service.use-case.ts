/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceRepository } from "@/core/repositories/service.repository.interface";
import { Service } from "@/core/domain/entities/service.entity";
import type {
  ServiceType,
  ServiceStatus,
  DataConfidentiality,
  BusinessImpactLevel,
  CriticalityLevel,
} from "@/generated/prisma";

export interface CreateServiceRequest {
  name: string;
  serviceType: ServiceType;
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
  createdBy?: string;

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
export class CreateServiceUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceRepository)
    private readonly serviceRepository: IServiceRepository,
  ) {}

  async execute(request: CreateServiceRequest): Promise<Service> {
    // Check if service name already exists
    const nameExists = await this.serviceRepository.existsByName(request.name);
    if (nameExists) {
      throw new Error(`Service with name "${request.name}" already exists`);
    }

    const service = Service.create({
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
      createdBy: request.createdBy,

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
    });

    return this.serviceRepository.create(service);
  }
}
