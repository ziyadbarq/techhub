/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceRepository } from "@/core/repositories/service.repository.interface";
import type { Service } from "@/core/domain/entities/service.entity";

export interface GetRetiringServicesRequest {
  daysThreshold?: number;
  skip?: number;
  take?: number;
}

@injectable()
export class GetRetiringServicesUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceRepository)
    private readonly serviceRepository: IServiceRepository,
  ) {}

  async execute(request: GetRetiringServicesRequest = {}): Promise<Service[]> {
    const daysThreshold = request.daysThreshold ?? 90; // Default 90 days

    return this.serviceRepository.findRetiringSoon(daysThreshold, {
      skip: request.skip,
      take: request.take,
    });
  }
}
