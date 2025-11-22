/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IBusinessProcessRepository } from "@/core/repositories/business-process.repository.interface";
import type { BusinessProcess } from "@/core/domain/entities/business-process.entity";

export interface GetBusinessProcessRequest {
  businessProcessId: string;
}

@injectable()
export class GetBusinessProcessUseCase {
  constructor(
    @inject(DI_TOKENS.IBusinessProcessRepository)
    private readonly businessProcessRepository: IBusinessProcessRepository,
  ) {}

  async execute(request: GetBusinessProcessRequest): Promise<BusinessProcess> {
    const businessProcess = await this.businessProcessRepository.findById(
      request.businessProcessId,
    );
    if (!businessProcess) {
      throw new Error(
        `Business process with ID ${request.businessProcessId} not found`,
      );
    }

    return businessProcess;
  }
}
