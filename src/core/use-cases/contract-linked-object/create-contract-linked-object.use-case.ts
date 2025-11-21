/**
 * Create ContractLinkedObject Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IContractLinkedObjectRepository } from "@/core/repositories/contract-linked-object.repository.interface";
import type { IContractRepository } from "@/core/repositories/contract.repository.interface";
import { ContractLinkedObject } from "@/core/domain/entities/contract-linked-object.entity";
import type { TargetObjectType } from "@/core/domain/entities/contract-linked-object.entity";

export interface CreateContractLinkedObjectRequest {
  contractId: string;
  targetType: TargetObjectType;
  targetId: string;
  note?: string | null;
}

@injectable()
export class CreateContractLinkedObjectUseCase {
  constructor(
    @inject(DI_TOKENS.IContractLinkedObjectRepository)
    private linkedObjectRepository: IContractLinkedObjectRepository,
    @inject(DI_TOKENS.IContractRepository)
    private contractRepository: IContractRepository,
  ) {}

  async execute(
    request: CreateContractLinkedObjectRequest,
  ): Promise<ContractLinkedObject> {
    // Validate contract exists
    const contract = await this.contractRepository.findById(request.contractId);
    if (!contract) {
      throw new Error("Contract not found");
    }

    // Check for duplicate link
    const existing = await this.linkedObjectRepository.exists(
      request.contractId,
      request.targetType,
      request.targetId,
    );
    if (existing) {
      throw new Error("This object is already linked to the contract");
    }

    // Note: We don't validate targetId existence because it's polymorphic
    // The application layer should validate before calling this use case

    // Create linked object
    const linkedObject = ContractLinkedObject.create({
      contractId: request.contractId,
      targetType: request.targetType,
      targetId: request.targetId,
      note: request.note,
    });

    return await this.linkedObjectRepository.create(linkedObject);
  }
}
