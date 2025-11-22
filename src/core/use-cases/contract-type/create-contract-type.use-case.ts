/**
 * Create ContractType Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IContractTypeRepository } from "@/core/repositories/contract-type.repository.interface";
import type { ICodeGeneratorService } from "@/core/services/code-generator.service.interface";
import { ContractType } from "@/core/domain/entities/contract-type.entity";

export interface CreateContractTypeRequest {
  name: string;
  code?: string;
  description?: string | null;
  isActive?: boolean;
}

@injectable()
export class CreateContractTypeUseCase {
  constructor(
    @inject(DI_TOKENS.IContractTypeRepository)
    private contractTypeRepository: IContractTypeRepository,
    @inject(DI_TOKENS.ICodeGeneratorService)
    private readonly codeGenerator: ICodeGeneratorService,
  ) {}

  async execute(request: CreateContractTypeRequest): Promise<ContractType> {
    // Auto-generate code if not provided
    const code =
      request.code ??
      (await this.codeGenerator.generateCode("CONTRACT_TYPE", "CTYPE"));

    // Check for duplicate name
    const existingByName = await this.contractTypeRepository.existsByName(
      request.name,
    );
    if (existingByName) {
      throw new Error("A contract type with this name already exists");
    }

    // Check for duplicate code
    const existingByCode = await this.contractTypeRepository.existsByCode(code);
    if (existingByCode) {
      throw new Error("A contract type with this code already exists");
    }

    // Create entity
    const contractType = ContractType.create({
      name: request.name,
      code,
      description: request.description,
      isActive: request.isActive,
    });

    // Persist
    return await this.contractTypeRepository.create(contractType);
  }
}
