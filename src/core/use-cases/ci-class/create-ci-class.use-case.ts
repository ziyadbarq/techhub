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

export interface CreateCIClassRequest {
  name: string;
  code: string;
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
  ) {}

  async execute(request: CreateCIClassRequest): Promise<CIClass> {
    // Check for duplicates
    const existingByName = await this.ciClassRepository.existsByName(
      request.name,
    );
    if (existingByName) {
      throw new Error(`CI class with name "${request.name}" already exists`);
    }

    const existingByCode = await this.ciClassRepository.existsByCode(
      request.code,
    );
    if (existingByCode) {
      throw new Error(`CI class with code "${request.code}" already exists`);
    }

    // Create CI class entity
    const ciClass = CIClass.create({
      name: request.name,
      code: request.code,
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
