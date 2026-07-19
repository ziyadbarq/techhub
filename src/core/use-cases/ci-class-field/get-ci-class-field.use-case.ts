/**
 * Get CIClassField Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ICIClassFieldRepository } from "@/core/repositories/ci-class-field.repository.interface";
import type { CIClassField } from "@/core/domain/entities/ci-class-field.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface GetCIClassFieldRequest {
  id: string;
}

@injectable()
export class GetCIClassFieldUseCase {
  constructor(
    @inject(DI_TOKENS.ICIClassFieldRepository)
    private ciClassFieldRepository: ICIClassFieldRepository,
  ) {}

  async execute(request: GetCIClassFieldRequest): Promise<CIClassField> {
    const ciClassField = await this.ciClassFieldRepository.findById(request.id);

    if (!ciClassField) {
      throw new NotFoundError("CI class field not found");
    }

    return ciClassField;
  }
}
