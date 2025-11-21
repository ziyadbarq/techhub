/**
 * List ContractTypes Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IContractTypeRepository } from "@/core/repositories/contract-type.repository.interface";
import type { ContractType } from "@/core/domain/entities/contract-type.entity";

export interface ListContractTypesRequest {
  activeOnly?: boolean;
}

@injectable()
export class ListContractTypesUseCase {
  constructor(
    @inject(DI_TOKENS.IContractTypeRepository)
    private contractTypeRepository: IContractTypeRepository,
  ) {}

  async execute(request: ListContractTypesRequest): Promise<ContractType[]> {
    if (request.activeOnly) {
      return await this.contractTypeRepository.findAllActive();
    }

    return await this.contractTypeRepository.findAll();
  }
}
