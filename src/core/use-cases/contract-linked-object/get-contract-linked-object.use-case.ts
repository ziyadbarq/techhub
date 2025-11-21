/**
 * Get ContractLinkedObject Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IContractLinkedObjectRepository } from "@/core/repositories/contract-linked-object.repository.interface";
import type { ContractLinkedObject } from "@/core/domain/entities/contract-linked-object.entity";

export interface GetContractLinkedObjectRequest {
  id: string;
}

@injectable()
export class GetContractLinkedObjectUseCase {
  constructor(
    @inject(DI_TOKENS.IContractLinkedObjectRepository)
    private linkedObjectRepository: IContractLinkedObjectRepository,
  ) {}

  async execute(
    request: GetContractLinkedObjectRequest,
  ): Promise<ContractLinkedObject> {
    const linkedObject = await this.linkedObjectRepository.findById(request.id);

    if (!linkedObject) {
      throw new Error("Contract linked object not found");
    }

    return linkedObject;
  }
}
