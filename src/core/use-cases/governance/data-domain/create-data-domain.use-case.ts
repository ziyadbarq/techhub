/**
 * Create DataDomain Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IDataDomainRepository } from "@/core/repositories/data-domain.repository.interface";
import type { ICodeGeneratorService } from "@/core/services/code-generator.service.interface";
import { DataDomain } from "@/core/domain/entities/data-domain.entity";
import { ValidationError } from "@/core/domain/errors/validation.error";

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
    const trimmedName = request.name?.trim();
    const providedCode = request.code?.trim();

    // Auto-generate code if not provided
    const code =
      providedCode ??
      (await this.codeGenerator.generateCode("DATA_DOMAIN", "DD"));

    // Check for duplicate name
    const existingByName = trimmedName
      ? await this.dataDomainRepository.existsByName(trimmedName)
      : false;
    if (existingByName) {
      throw new ValidationError(
        `Data domain with name ${trimmedName} already exists`,
      );
    }

    // Check for duplicate code
    const existingByCode = await this.dataDomainRepository.existsByCode(
      code.toUpperCase(),
    );
    if (existingByCode) {
      throw new ValidationError(
        `Data domain with code ${code.toUpperCase()} already exists`,
      );
    }

    // Create data domain entity
    const dataDomain = DataDomain.create({
      name: trimmedName ?? request.name,
      code,
      description: request.description,
      isActive: request.isActive,
    });

    return await this.dataDomainRepository.create(dataDomain);
  }
}
