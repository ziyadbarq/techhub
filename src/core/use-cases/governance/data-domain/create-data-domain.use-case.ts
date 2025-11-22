/**
 * Create DataDomain Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IDataDomainRepository } from "@/core/repositories/data-domain.repository.interface";
import type { ICodeGeneratorService } from "@/core/services/code-generator.service.interface";
import { DataDomain } from "@/core/domain/entities/data-domain.entity";

export interface CreateDataDomainRequest {
  name: string;
  code?: string;
  description?: string | null;
  isActive?: boolean;
}

@injectable()
export class CreateDataDomainUseCase {
  constructor(
    @inject(DI_TOKENS.IDataDomainRepository)
    private dataDomainRepository: IDataDomainRepository,
    @inject(DI_TOKENS.ICodeGeneratorService)
    private readonly codeGenerator: ICodeGeneratorService,
  ) {}

  async execute(request: CreateDataDomainRequest): Promise<DataDomain> {
    // Auto-generate code if not provided
    const code =
      request.code ??
      (await this.codeGenerator.generateCode("DATA_DOMAIN", "DD"));

    // Check for duplicate name
    const existingByName = await this.dataDomainRepository.existsByName(
      request.name,
    );
    if (existingByName) {
      throw new Error("A data domain with this name already exists");
    }

    // Check for duplicate code
    const existingByCode = await this.dataDomainRepository.existsByCode(code);
    if (existingByCode) {
      throw new Error("A data domain with this code already exists");
    }

    // Create data domain entity
    const dataDomain = DataDomain.create({
      name: request.name,
      code,
      description: request.description,
      isActive: request.isActive,
    });

    return await this.dataDomainRepository.create(dataDomain);
  }
}
