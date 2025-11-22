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
    });

    return this.serviceRepository.create(service);
  }
}
