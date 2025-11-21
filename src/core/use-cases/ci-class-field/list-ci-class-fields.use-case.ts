/**
 * List CIClassFields Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ICIClassFieldRepository } from "@/core/repositories/ci-class-field.repository.interface";
import type { CIClassField } from "@/core/domain/entities/ci-class-field.entity";

export interface ListCIClassFieldsRequest {
  ciClassId?: string;
  fieldDefinitionId?: string;
}

@injectable()
export class ListCIClassFieldsUseCase {
  constructor(
    @inject(DI_TOKENS.ICIClassFieldRepository)
    private ciClassFieldRepository: ICIClassFieldRepository,
  ) {}

  async execute(request: ListCIClassFieldsRequest): Promise<CIClassField[]> {
    // Filter by CI class if specified
    if (request.ciClassId) {
      return await this.ciClassFieldRepository.findByCIClassId(
        request.ciClassId,
      );
    }

    // Filter by field definition if specified
    if (request.fieldDefinitionId) {
      return await this.ciClassFieldRepository.findByFieldDefinitionId(
        request.fieldDefinitionId,
      );
    }

    // Return all if no filters
    return await this.ciClassFieldRepository.findAll();
  }
}
