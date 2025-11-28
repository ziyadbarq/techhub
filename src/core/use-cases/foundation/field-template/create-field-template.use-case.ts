/**
 * Create Field Template Use Case
 *
 * Business logic for creating a new field template.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import {
  FieldTemplate,
  type CreateFieldTemplateProps,
} from "@/core/domain/entities/field-template.entity";
import type { IFieldTemplateRepository } from "@/core/repositories/field-template.repository.interface";

export interface CreateFieldTemplateInput {
  name: string;
  code: string;
  description?: string | null;
  entityType: string;
  category?: string | null;
  standard?: string | null;
  isBuiltIn?: boolean;
  metadata?: Record<string, unknown> | null;
  createdById?: string | null;
  items?: CreateFieldTemplateProps["items"];
}

@injectable()
export class CreateFieldTemplateUseCase {
  constructor(
    @inject(DI_TOKENS.IFieldTemplateRepository)
    private readonly fieldTemplateRepository: IFieldTemplateRepository,
  ) {}

  /**
   * Execute create field template use case
   *
   * @param input - Field template creation input
   * @returns Created field template
   * @throws Error if name or code already exists
   */
  async execute(input: CreateFieldTemplateInput): Promise<FieldTemplate> {
    // Check for duplicate name
    const existsByName = await this.fieldTemplateRepository.existsByName(
      input.name,
    );
    if (existsByName) {
      throw new Error(
        `Field template with name "${input.name}" already exists`,
      );
    }

    // Check for duplicate code
    const existsByCode = await this.fieldTemplateRepository.existsByCode(
      input.code,
    );
    if (existsByCode) {
      throw new Error(
        `Field template with code "${input.code}" already exists`,
      );
    }

    const fieldTemplate = FieldTemplate.create({
      name: input.name,
      code: input.code,
      description: input.description,
      entityType: input.entityType,
      category: input.category,
      standard: input.standard,
      isBuiltIn: input.isBuiltIn,
      metadata: input.metadata,
      createdById: input.createdById,
      items: input.items,
    });

    return this.fieldTemplateRepository.create(fieldTemplate);
  }
}
