/**
 * Create CI Class Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ICIClassRepository } from "@/core/repositories/ci-class.repository.interface";
import {
  CIClass,
  type CriticalityLevel,
  type EnvironmentType,
} from "@/core/domain/entities/ci-class.entity";
import type { ICodeGeneratorService } from "@/core/services/code-generator.service.interface";

export interface CreateCIClassRequest {
  name: string;
  code?: string;
  parentClassId?: string | null;
  description?: string | null;
  lifecycleModelId?: string | null;
  defaultCriticality?: CriticalityLevel | null;
  defaultEnvironment?: EnvironmentType | null;
  isDiscoverable?: boolean;
}

@injectable()
export class CreateCIClassUseCase {
  constructor(
    @inject(DI_TOKENS.ICIClassRepository)
    private readonly ciClassRepository: ICIClassRepository,
    @inject(DI_TOKENS.ICodeGeneratorService)
    private readonly codeGenerator: ICodeGeneratorService,
  ) {}

  async execute(request: CreateCIClassRequest): Promise<CIClass> {
    // Auto-generate code if not provided
    const code =
      request.code ?? (await this.codeGenerator.generateCode("CI_CLASS", "CI"));

    // Check for duplicates
    const existingByName = await this.ciClassRepository.existsByName(
      request.name,
    );
    if (existingByName) {
      throw new Error(`CI class with name "${request.name}" already exists`);
    }

    const existingByCode = await this.ciClassRepository.existsByCode(code);
    if (existingByCode) {
      throw new Error(`CI class with code "${code}" already exists`);
    }

    // Create CI class entity
    const ciClass = CIClass.create({
      name: request.name,
      code,
      parentClassId: request.parentClassId,
      description: request.description,
      lifecycleModelId: request.lifecycleModelId,
      defaultCriticality: request.defaultCriticality,
      defaultEnvironment: request.defaultEnvironment,
      isDiscoverable: request.isDiscoverable,
    });

    // Persist
    return this.ciClassRepository.create(ciClass);
  }
}
