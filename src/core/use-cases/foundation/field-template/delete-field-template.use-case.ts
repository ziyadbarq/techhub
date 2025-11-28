/**
 * Delete Field Template Use Case
 *
 * Business logic for deleting a field template.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IFieldTemplateRepository } from "@/core/repositories/field-template.repository.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

/**
 * Error thrown when attempting to delete a built-in template
 */
export class BuiltInTemplateError extends Error {
  constructor(templateId: string) {
    super(
      `Cannot delete built-in template "${templateId}". Built-in templates are system-managed.`,
    );
    this.name = "BuiltInTemplateError";
  }
}

@injectable()
export class DeleteFieldTemplateUseCase {
  constructor(
    @inject(DI_TOKENS.IFieldTemplateRepository)
    private readonly fieldTemplateRepository: IFieldTemplateRepository,
  ) {}

  /**
   * Execute delete field template use case
   *
   * @param id - Field template ID to delete
   * @throws NotFoundError if not found
   * @throws BuiltInTemplateError if template is built-in
   */
  async execute(id: string): Promise<void> {
    const template = await this.fieldTemplateRepository.findById(id);
    if (!template) {
      throw new NotFoundError("Field template not found", "FieldTemplate", id);
    }

    // Prevent deletion of built-in templates
    if (template.isBuiltIn) {
      throw new BuiltInTemplateError(id);
    }

    await this.fieldTemplateRepository.delete(id);
  }
}
