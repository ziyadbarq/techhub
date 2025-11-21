/**
 * List ContractLinkedObjects Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IContractLinkedObjectRepository } from "@/core/repositories/contract-linked-object.repository.interface";
import type {
  ContractLinkedObject,
  TargetObjectType,
} from "@/core/domain/entities/contract-linked-object.entity";

export interface ListContractLinkedObjectsRequest {
  contractId?: string;
  targetType?: TargetObjectType;
  targetId?: string;
}

@injectable()
export class ListContractLinkedObjectsUseCase {
  constructor(
    @inject(DI_TOKENS.IContractLinkedObjectRepository)
    private linkedObjectRepository: IContractLinkedObjectRepository,
  ) {}

  async execute(
    request: ListContractLinkedObjectsRequest,
  ): Promise<ContractLinkedObject[]> {
    // Filter by contract ID if specified
    if (request.contractId) {
      return await this.linkedObjectRepository.findByContractId(
        request.contractId,
      );
    }

    // Filter by specific target if both type and ID are specified
    if (request.targetType && request.targetId) {
      return await this.linkedObjectRepository.findByTarget(
        request.targetType,
        request.targetId,
      );
    }

    // Filter by target type only if specified
    if (request.targetType) {
      return await this.linkedObjectRepository.findByTargetType(
        request.targetType,
      );
    }

    // If no filters, return empty array (better than returning all)
    return [];
  }
}
