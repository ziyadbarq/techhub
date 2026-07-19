/**
 * Get CI Class Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ICIClassRepository } from "@/core/repositories/ci-class.repository.interface";
import type { CIClass } from "@/core/domain/entities/ci-class.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface GetCIClassRequest {
  ciClassId: string;
}

@injectable()
export class GetCIClassUseCase {
  constructor(
    @inject(DI_TOKENS.ICIClassRepository)
    private readonly ciClassRepository: ICIClassRepository,
  ) {}

  async execute(request: GetCIClassRequest): Promise<CIClass> {
    const ciClass = await this.ciClassRepository.findById(request.ciClassId);

    if (!ciClass) {
      throw new NotFoundError(
        `CI class with ID "${request.ciClassId}" not found`,
      );
    }

    return ciClass;
  }
}
