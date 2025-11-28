/**
 * Get Field Template Use Case
 *
 * Business logic for retrieving a field template by ID or code.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { FieldTemplate } from "@/core/domain/entities/field-template.entity";
import type { IFieldTemplateRepository } from "@/core/repositories/field-template.repository.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

@injectable()
export class GetFieldTemplateUseCase {
  constructor(
    @inject(DI_TOKENS.IFieldTemplateRepository)
    private readonly fieldTemplateRepository: IFieldTemplateRepository,
  ) {}

  /**
   * Execute get field template by ID
   *
   * @param id - Field template ID
   * @returns Field template
   * @throws NotFoundError if not found
   */
  async execute(id: string): Promise<FieldTemplate> {
    const template = await this.fieldTemplateRepository.findById(id);
    if (!template) {
      throw new NotFoundError("Field template not found", "FieldTemplate", id);
    }
    return template;
  }

  /**
   * Get field template by code
   *
   * @param code - Field template code
   * @returns Field template
   * @throws NotFoundError if not found
   */
  async executeByCode(code: string): Promise<FieldTemplate> {
    const template = await this.fieldTemplateRepository.findByCode(code);
    if (!template) {
      throw new NotFoundError(
        "Field template not found",
        "FieldTemplate",
        code,
      );
    }
    return template;
  }
}
