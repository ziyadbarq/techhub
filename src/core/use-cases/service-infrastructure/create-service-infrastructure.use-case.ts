/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceInfrastructureRepository } from "@/core/repositories/service-infrastructure.repository.interface";
import type { IServiceRepository } from "@/core/repositories/service.repository.interface";
import { ServiceInfrastructure } from "@/core/domain/entities/service-infrastructure.entity";
import type { ServiceLocation } from "@/generated/prisma";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export interface CreateServiceInfrastructureRequest {
  serviceId: string;
  location: ServiceLocation;
  cloudProvider?: string;
  compartment?: string;
  project?: string;
  region?: string;
  ipAddress?: string;
  hostname?: string;
  backupEnabled?: boolean;
  backupSchedule?: string;
  lastBackupDate?: Date;
  cloudProviderDetails?: Record<string, unknown>;
}

@injectable()
export class CreateServiceInfrastructureUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceInfrastructureRepository)
    private readonly infrastructureRepository: IServiceInfrastructureRepository,
    @inject(DI_TOKENS.IServiceRepository)
    private readonly serviceRepository: IServiceRepository,

    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(
    request: CreateServiceInfrastructureRequest,
  ): Promise<ServiceInfrastructure> {
    // Check if service exists
    const service = await this.serviceRepository.findById(request.serviceId);
    if (!service) {
      throw new Error(`Service with ID ${request.serviceId} not found`);
    }

    const infrastructure = ServiceInfrastructure.create(
      {
        serviceId: request.serviceId,
        location: request.location,
        cloudProvider: request.cloudProvider,
        compartment: request.compartment,
        project: request.project,
        region: request.region,
        ipAddress: request.ipAddress,
        hostname: request.hostname,
        backupEnabled: request.backupEnabled,
        backupSchedule: request.backupSchedule,
        lastBackupDate: request.lastBackupDate,
        cloudProviderDetails: request.cloudProviderDetails,
      },
      this.idGenerator,
    );

    return this.infrastructureRepository.create(
      infrastructure,
      this.idGenerator,
    );
  }
}
