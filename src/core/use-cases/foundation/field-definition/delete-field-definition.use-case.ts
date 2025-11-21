/**
 * Delete Field Definition Use Case
 *
 * Business logic for deleting a field definition.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import type { IFieldDefinitionRepository } from "@/core/repositories/field-definition.repository.interface";

@injectable()
export class DeleteFieldDefinitionUseCase {
  constructor(
    @inject(DI_TOKENS.IFieldDefinitionRepository)
    private readonly fieldDefinitionRepository: IFieldDefinitionRepository,
  ) {}

  /**
   * Execute delete field definition use case
   *
   * @param id - Field definition ID to delete
   * @throws NotFoundError if field definition not found
   * @throws Error if field definition is in use
   */
  async execute(id: string): Promise<void> {
    // Check if exists
    const fieldDefinition = await this.fieldDefinitionRepository.findById(id);
    if (!fieldDefinition) {
      throw new NotFoundError(
        "Field definition not found",
        "FieldDefinition",
        id,
      );
    }

    // Check if in use
    const inUse = await this.fieldDefinitionRepository.isInUse(id);
    if (inUse) {
      throw new Error(
        "Cannot delete field definition because it is in use by CI classes, asset categories, or other entities",
      );
    }

    await this.fieldDefinitionRepository.delete(id);
  }
}
