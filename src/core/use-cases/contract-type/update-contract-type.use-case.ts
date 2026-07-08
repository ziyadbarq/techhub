/**
 * Update ContractType Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IContractTypeRepository } from "@/core/repositories/contract-type.repository.interface";
import type { ContractType } from "@/core/domain/entities/contract-type.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface UpdateContractTypeRequest {
  id: string;
  name?: string;
  code?: string;
  description?: string | null;
  isActive?: boolean;
}

@injectable()
export class UpdateContractTypeUseCase {
  constructor(
    @inject(DI_TOKENS.IContractTypeRepository)
    private contractTypeRepository: IContractTypeRepository,
  ) {}

  async execute(request: UpdateContractTypeRequest): Promise<ContractType> {
    const contractType = await this.contractTypeRepository.findById(request.id);

    if (!contractType) {
      throw new NotFoundError("Contract type not found");
    }

    // Check for duplicate name if name is being updated
    if (request.name !== undefined && request.name !== contractType.name) {
      const existingByName = await this.contractTypeRepository.existsByName(
        request.name,
        request.id,
      );
      if (existingByName) {
        throw new Error("A contract type with this name already exists");
      }
    }

    // Check for duplicate code if code is being updated
    if (request.code !== undefined && request.code !== contractType.code) {
      const existingByCode = await this.contractTypeRepository.existsByCode(
        request.code,
        request.id,
      );
      if (existingByCode) {
        throw new Error("A contract type with this code already exists");
      }
    }

    contractType.update({
      name: request.name,
      code: request.code,
      description:
        request.description === undefined
          ? undefined
          : request.description?.trim() || null,
      isActive: request.isActive,
    });

    return await this.contractTypeRepository.update(contractType);
  }
}
