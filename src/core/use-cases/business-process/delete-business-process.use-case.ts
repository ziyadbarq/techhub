/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IBusinessProcessRepository } from "@/core/repositories/business-process.repository.interface";

export interface DeleteBusinessProcessRequest {
  businessProcessId: string;
}

@injectable()
export class DeleteBusinessProcessUseCase {
  constructor(
    @inject(DI_TOKENS.IBusinessProcessRepository)
    private readonly businessProcessRepository: IBusinessProcessRepository,
  ) {}

  async execute(request: DeleteBusinessProcessRequest): Promise<void> {
    const businessProcess = await this.businessProcessRepository.findById(
      request.businessProcessId,
    );
    if (!businessProcess) {
      throw new Error(
        `Business process with ID ${request.businessProcessId} not found`,
      );
    }

    await this.businessProcessRepository.delete(request.businessProcessId);
  }
}
