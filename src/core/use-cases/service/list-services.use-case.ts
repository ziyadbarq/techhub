/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceRepository } from "@/core/repositories/service.repository.interface";
import type { Service } from "@/core/domain/entities/service.entity";

export interface ListServicesRequest {
  skip?: number;
  take?: number;
  orderBy?: "name" | "serviceType" | "currentStatus" | "createdAt";
  order?: "asc" | "desc";
}

@injectable()
export class ListServicesUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceRepository)
    private readonly serviceRepository: IServiceRepository,
  ) {}

  async execute(request: ListServicesRequest = {}): Promise<Service[]> {
    return this.serviceRepository.findAll({
      skip: request.skip,
      take: request.take,
      orderBy: request.orderBy,
      order: request.order,
    });
  }
}
