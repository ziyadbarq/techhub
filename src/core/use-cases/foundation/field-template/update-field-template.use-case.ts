/**
 * Update Field Template Use Case
 *
 * Business logic for updating an existing field template.
 */

import { inject, injectable } from "inversify";
import { ConflictError } from "@/core/domain/errors/conflict.error";
import { DI_TOKENS } from "@/di/types";
import type { FieldTemplate } from "@/core/domain/entities/field-template.entity";
import type { IFieldTemplateRepository } from "@/core/repositories/field-template.repository.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface UpdateFieldTemplateInput {
  id: string;
  name?: string;
  description?: string | null;
  category?: string | null;
  standard?: string | null;
  isActive?: boolean;
  metadata?: Record<string, unknown> | null;
}

@injectable()
export class UpdateFieldTemplateUseCase {
  constructor(
    @inject(DI_TOKENS.IFieldTemplateRepository)
    private readonly fieldTemplateRepository: IFieldTemplateRepository,
  ) {}

  /**
   * Execute update field template use case
   *
   * @param input - Update input
   * @returns Updated field template
   * @throws NotFoundError if not found
   * @throws Error if name already exists
   */
  async execute(input: UpdateFieldTemplateInput): Promise<FieldTemplate> {
    const template = await this.fieldTemplateRepository.findById(input.id);
    if (!template) {
      throw new NotFoundError(
        "Field template not found",
        "FieldTemplate",
        input.id,
      );
    }

    // Check for duplicate name if changing
    if (input.name && input.name !== template.name) {
      const existsByName = await this.fieldTemplateRepository.existsByName(
        input.name,
        input.id,
      );
      if (existsByName) {
        throw new ConflictError(
          `Field template with name "${input.name}" already exists`,
        );
      }
    }

    // Update the template
    template.update({
      name: input.name,
      description: input.description,
      category: input.category,
      standard: input.standard,
      metadata: input.metadata,
    });

    // Handle activation/deactivation
    if (input.isActive !== undefined) {
      if (input.isActive) {
        template.activate();
      } else {
        template.deactivate();
      }
    }

    return this.fieldTemplateRepository.update(template);
  }
}
