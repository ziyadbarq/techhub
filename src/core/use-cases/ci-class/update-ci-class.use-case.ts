/**
 * Update CI Class Use Case
 */

import { injectable, inject } from "inversify";
import { ConflictError } from "@/core/domain/errors/conflict.error";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import { DI_TOKENS } from "@/di/types";
import type { ICIClassRepository } from "@/core/repositories/ci-class.repository.interface";
import type { CIClass } from "@/core/domain/entities/ci-class.entity";
import type {
  CriticalityLevel,
  EnvironmentType,
} from "@/core/domain/entities/ci-class.entity";

export interface UpdateCIClassRequest {
  ciClassId: string;
  name?: string;
  code?: string;
  parentClassId?: string | null;
  description?: string | null;
  lifecycleModelId?: string | null;
  defaultCriticality?: CriticalityLevel | null;
  defaultEnvironment?: EnvironmentType | null;
  isDiscoverable?: boolean;
}

@injectable()
export class UpdateCIClassUseCase {
  constructor(
    @inject(DI_TOKENS.ICIClassRepository)
    private readonly ciClassRepository: ICIClassRepository,
  ) {}

  async execute(request: UpdateCIClassRequest): Promise<CIClass> {
    // Get existing CI class
    const ciClass = await this.ciClassRepository.findById(request.ciClassId);
    if (!ciClass) {
      throw new NotFoundError(
        `CI class with ID "${request.ciClassId}" not found`,
      );
    }

    // Check for duplicate name
    if (request.name && request.name !== ciClass.name) {
      const existingByName = await this.ciClassRepository.existsByName(
        request.name,
        request.ciClassId,
      );
      if (existingByName) {
        throw new ConflictError(
          `CI class with name "${request.name}" already exists`,
        );
      }
    }

    // Check for duplicate code
    if (request.code && request.code !== ciClass.code) {
      const existingByCode = await this.ciClassRepository.existsByCode(
        request.code,
        request.ciClassId,
      );
      if (existingByCode) {
        throw new ConflictError(
          `CI class with code "${request.code}" already exists`,
        );
      }
    }

    // Update CI class
    ciClass.update({
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
    return this.ciClassRepository.update(ciClass);
  }
}
