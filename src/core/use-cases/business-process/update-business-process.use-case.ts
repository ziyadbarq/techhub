/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IBusinessProcessRepository } from "@/core/repositories/business-process.repository.interface";
import type { BusinessProcess } from "@/core/domain/entities/business-process.entity";

export interface UpdateBusinessProcessRequest {
  businessProcessId: string;
  code?: string;
  name?: string;
  description?: string;
  category?: string;
  metadata?: Record<string, unknown>;
}

@injectable()
export class UpdateBusinessProcessUseCase {
  constructor(
    @inject(DI_TOKENS.IBusinessProcessRepository)
    private readonly businessProcessRepository: IBusinessProcessRepository,
  ) {}

  async execute(
    request: UpdateBusinessProcessRequest,
  ): Promise<BusinessProcess> {
    const businessProcess = await this.businessProcessRepository.findById(
      request.businessProcessId,
    );
    if (!businessProcess) {
      throw new Error(
        `Business process with ID ${request.businessProcessId} not found`,
      );
    }

    // Check if code is being changed and if new code already exists
    if (request.code && request.code !== businessProcess.code) {
      const codeExists = await this.businessProcessRepository.existsByCode(
        request.code,
        request.businessProcessId,
      );
      if (codeExists) {
        throw new Error(
          `Business process with code "${request.code}" already exists`,
        );
      }
    }

    businessProcess.update({
      code: request.code,
      name: request.name,
      description: request.description,
      category: request.category,
      metadata: request.metadata,
    });

    return this.businessProcessRepository.update(businessProcess);
  }
}
