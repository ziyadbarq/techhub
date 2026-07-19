/**
 * Delete ContractType Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IContractTypeRepository } from "@/core/repositories/contract-type.repository.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface DeleteContractTypeRequest {
  id: string;
}

@injectable()
export class DeleteContractTypeUseCase {
  constructor(
    @inject(DI_TOKENS.IContractTypeRepository)
    private contractTypeRepository: IContractTypeRepository,
  ) {}

  async execute(request: DeleteContractTypeRequest): Promise<void> {
    const contractType = await this.contractTypeRepository.findById(request.id);

    if (!contractType) {
      throw new NotFoundError("Contract type not found");
    }

    await this.contractTypeRepository.delete(request.id);
  }
}
