/**
 * Clone Field Template Use Case
 *
 * Business logic for cloning an existing field template.
 */

import { inject, injectable } from "inversify";
import { ConflictError } from "@/core/domain/errors/conflict.error";
import { DI_TOKENS } from "@/di/types";
import type { FieldTemplate } from "@/core/domain/entities/field-template.entity";
import type { IFieldTemplateRepository } from "@/core/repositories/field-template.repository.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface CloneFieldTemplateInput {
  sourceTemplateId: string;
  newName: string;
  newCode: string;
  createdById: string;
}

@injectable()
export class CloneFieldTemplateUseCase {
  constructor(
    @inject(DI_TOKENS.IFieldTemplateRepository)
    private readonly fieldTemplateRepository: IFieldTemplateRepository,
  ) {}

  /**
   * Execute clone field template use case
   *
   * @param input - Clone input
   * @returns Cloned field template
   * @throws NotFoundError if source template not found
   * @throws Error if new name or code already exists
   */
  async execute(input: CloneFieldTemplateInput): Promise<FieldTemplate> {
    // Verify source template exists
    const sourceTemplate = await this.fieldTemplateRepository.findById(
      input.sourceTemplateId,
    );
    if (!sourceTemplate) {
      throw new NotFoundError(
        "Source template not found",
        "FieldTemplate",
        input.sourceTemplateId,
      );
    }

    // Check for duplicate name
    const existsByName = await this.fieldTemplateRepository.existsByName(
      input.newName,
    );
    if (existsByName) {
      throw new ConflictError(
        `Field template with name "${input.newName}" already exists`,
      );
    }

    // Check for duplicate code
    const existsByCode = await this.fieldTemplateRepository.existsByCode(
      input.newCode,
    );
    if (existsByCode) {
      throw new ConflictError(
        `Field template with code "${input.newCode}" already exists`,
      );
    }

    return this.fieldTemplateRepository.clone(
      input.sourceTemplateId,
      input.newName,
      input.newCode,
      input.createdById,
    );
  }
}
