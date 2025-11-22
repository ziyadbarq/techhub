/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceRepository } from "@/core/repositories/service.repository.interface";
import type { Service } from "@/core/domain/entities/service.entity";

export interface SearchServicesRequest {
  query: string;
  skip?: number;
  take?: number;
}

@injectable()
export class SearchServicesUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceRepository)
    private readonly serviceRepository: IServiceRepository,
  ) {}

  async execute(request: SearchServicesRequest): Promise<Service[]> {
    if (!request.query || request.query.trim().length === 0) {
      throw new Error("Search query is required");
    }

    return this.serviceRepository.search(request.query, {
      skip: request.skip,
      take: request.take,
    });
  }
}
