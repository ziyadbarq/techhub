/**
 * Delete ContractLinkedObject Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IContractLinkedObjectRepository } from "@/core/repositories/contract-linked-object.repository.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface DeleteContractLinkedObjectRequest {
  id: string;
}

@injectable()
export class DeleteContractLinkedObjectUseCase {
  constructor(
    @inject(DI_TOKENS.IContractLinkedObjectRepository)
    private linkedObjectRepository: IContractLinkedObjectRepository,
  ) {}

  async execute(request: DeleteContractLinkedObjectRequest): Promise<void> {
    const linkedObject = await this.linkedObjectRepository.findById(request.id);

    if (!linkedObject) {
      throw new NotFoundError("Contract linked object not found");
    }

    await this.linkedObjectRepository.delete(request.id);
  }
}
