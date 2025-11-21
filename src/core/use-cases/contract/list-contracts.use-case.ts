/**
 * List Contracts Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IContractRepository } from "@/core/repositories/contract.repository.interface";
import type { Contract } from "@/core/domain/entities/contract.entity";

export interface ListContractsRequest {
  contractTypeId?: string;
  vendorId?: string;
  activeOnly?: boolean;
  asOfDate?: Date;
}

@injectable()
export class ListContractsUseCase {
  constructor(
    @inject(DI_TOKENS.IContractRepository)
    private contractRepository: IContractRepository,
  ) {}

  async execute(request: ListContractsRequest): Promise<Contract[]> {
    // Filter by contract type if specified
    if (request.contractTypeId) {
      return await this.contractRepository.findByContractTypeId(
        request.contractTypeId,
      );
    }

    // Filter by vendor if specified
    if (request.vendorId) {
      return await this.contractRepository.findByVendorId(request.vendorId);
    }

    // Filter by active status if specified
    if (request.activeOnly) {
      return await this.contractRepository.findAllActive(request.asOfDate);
    }

    // Return all contracts
    return await this.contractRepository.findAll();
  }
}
