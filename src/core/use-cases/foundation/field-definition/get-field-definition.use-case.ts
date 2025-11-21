/**
 * Get Field Definition Use Case
 *
 * Business logic for retrieving a single field definition by ID.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { FieldDefinition } from "@/core/domain/entities/field-definition.entity";
import type { IFieldDefinitionRepository } from "@/core/repositories/field-definition.repository.interface";

@injectable()
export class GetFieldDefinitionUseCase {
  constructor(
    @inject(DI_TOKENS.IFieldDefinitionRepository)
    private readonly fieldDefinitionRepository: IFieldDefinitionRepository,
  ) {}

  /**
   * Execute get field definition use case
   *
   * @param id - Field definition ID
   * @returns Field definition or null if not found
   */
  async execute(id: string): Promise<FieldDefinition | null> {
    return await this.fieldDefinitionRepository.findById(id);
  }
}
