/**
 * Delete Contract Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IContractRepository } from "@/core/repositories/contract.repository.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface DeleteContractRequest {
  id: string;
}

@injectable()
export class DeleteContractUseCase {
  constructor(
    @inject(DI_TOKENS.IContractRepository)
    private contractRepository: IContractRepository,
  ) {}

  async execute(request: DeleteContractRequest): Promise<void> {
    const contract = await this.contractRepository.findById(request.id);

    if (!contract) {
      throw new NotFoundError("Contract not found");
    }

    await this.contractRepository.delete(request.id);
  }
}
