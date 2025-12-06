/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IBusinessProcessRepository } from "@/core/repositories/business-process.repository.interface";
import { BusinessProcess } from "@/core/domain/entities/business-process.entity";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export interface CreateBusinessProcessRequest {
  code: string;
  name: string;
  description?: string;
  category?: string;
  metadata?: Record<string, unknown>;
}

@injectable()
export class CreateBusinessProcessUseCase {
  constructor(
    @inject(DI_TOKENS.IBusinessProcessRepository)
    private readonly businessProcessRepository: IBusinessProcessRepository,

    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(
    request: CreateBusinessProcessRequest,
  ): Promise<BusinessProcess> {
    // Check if code already exists
    const codeExists = await this.businessProcessRepository.existsByCode(
      request.code,
    );
    if (codeExists) {
      throw new Error(
        `Business process with code "${request.code}" already exists`,
      );
    }

    const businessProcess = BusinessProcess.create(
      {
        code: request.code,
        name: request.name,
        description: request.description,
        category: request.category,
        metadata: request.metadata,
      },
      this.idGenerator,
    );

    return this.businessProcessRepository.create(
      businessProcess,
      this.idGenerator,
    );
  }
}
