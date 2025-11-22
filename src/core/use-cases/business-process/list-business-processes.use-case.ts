/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IBusinessProcessRepository } from "@/core/repositories/business-process.repository.interface";
import type { BusinessProcess } from "@/core/domain/entities/business-process.entity";

export interface ListBusinessProcessesRequest {
  skip?: number;
  take?: number;
  orderBy?: "name" | "code" | "category" | "createdAt";
  order?: "asc" | "desc";
}

@injectable()
export class ListBusinessProcessesUseCase {
  constructor(
    @inject(DI_TOKENS.IBusinessProcessRepository)
    private readonly businessProcessRepository: IBusinessProcessRepository,
  ) {}

  async execute(
    request: ListBusinessProcessesRequest = {},
  ): Promise<BusinessProcess[]> {
    return this.businessProcessRepository.findAll({
      skip: request.skip,
      take: request.take,
      orderBy: request.orderBy,
      order: request.order,
    });
  }
}
