/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceRepository } from "@/core/repositories/service.repository.interface";
import type { Service } from "@/core/domain/entities/service.entity";

export interface GetEssentialServicesRequest {
  skip?: number;
  take?: number;
}

@injectable()
export class GetEssentialServicesUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceRepository)
    private readonly serviceRepository: IServiceRepository,
  ) {}

  async execute(request: GetEssentialServicesRequest = {}): Promise<Service[]> {
    return this.serviceRepository.findEssentialServices({
      skip: request.skip,
      take: request.take,
    });
  }
}
