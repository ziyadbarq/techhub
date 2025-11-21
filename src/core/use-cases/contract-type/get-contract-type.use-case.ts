/**
 * Get ContractType Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IContractTypeRepository } from "@/core/repositories/contract-type.repository.interface";
import type { ContractType } from "@/core/domain/entities/contract-type.entity";

export interface GetContractTypeRequest {
  id: string;
}

@injectable()
export class GetContractTypeUseCase {
  constructor(
    @inject(DI_TOKENS.IContractTypeRepository)
    private contractTypeRepository: IContractTypeRepository,
  ) {}

  async execute(request: GetContractTypeRequest): Promise<ContractType> {
    const contractType = await this.contractTypeRepository.findById(request.id);

    if (!contractType) {
      throw new Error("Contract type not found");
    }

    return contractType;
  }
}
