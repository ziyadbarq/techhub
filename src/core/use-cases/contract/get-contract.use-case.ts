/**
 * Get Contract Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IContractRepository } from "@/core/repositories/contract.repository.interface";
import type { Contract } from "@/core/domain/entities/contract.entity";

export interface GetContractRequest {
  id: string;
}

@injectable()
export class GetContractUseCase {
  constructor(
    @inject(DI_TOKENS.IContractRepository)
    private contractRepository: IContractRepository,
  ) {}

  async execute(request: GetContractRequest): Promise<Contract> {
    const contract = await this.contractRepository.findById(request.id);

    if (!contract) {
      throw new Error("Contract not found");
    }

    return contract;
  }
}
