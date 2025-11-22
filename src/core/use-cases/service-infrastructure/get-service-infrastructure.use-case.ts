/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceInfrastructureRepository } from "@/core/repositories/service-infrastructure.repository.interface";
import type { IServiceRepository } from "@/core/repositories/service.repository.interface";
import type { ServiceInfrastructure } from "@/core/domain/entities/service-infrastructure.entity";

export interface GetServiceInfrastructureRequest {
  serviceId: string;
}

@injectable()
export class GetServiceInfrastructureUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceInfrastructureRepository)
    private readonly infrastructureRepository: IServiceInfrastructureRepository,
    @inject(DI_TOKENS.IServiceRepository)
    private readonly serviceRepository: IServiceRepository,
  ) {}

  async execute(
    request: GetServiceInfrastructureRequest,
  ): Promise<ServiceInfrastructure[]> {
    // Check if service exists
    const service = await this.serviceRepository.findById(request.serviceId);
    if (!service) {
      throw new Error(`Service with ID ${request.serviceId} not found`);
    }

    return this.infrastructureRepository.findByServiceId(request.serviceId);
  }
}
