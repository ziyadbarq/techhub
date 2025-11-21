/**
 * Create Field Definition Use Case
 *
 * Business logic for creating a new field definition.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { FieldDefinition } from "@/core/domain/entities/field-definition.entity";
import type { IFieldDefinitionRepository } from "@/core/repositories/field-definition.repository.interface";
import type { FieldDataTypeEnum } from "@/core/domain/value-objects/foundation-enums";

export interface CreateFieldDefinitionProps {
  name: string;
  label: string;
  description?: string;
  dataType: FieldDataTypeEnum;
  entityType: string;
  isGlobal?: boolean;
  isRequired?: boolean;
  isUnique?: boolean;
  isSearchable?: boolean;
  isFilterable?: boolean;
  defaultValue?: unknown;
  validationRules?: Record<string, unknown>;
  enumOptions?: string[];
  uiOrder?: number;
  displayOrder?: number;
  uiGroup?: string;
  metadata?: Record<string, unknown>;
}

@injectable()
export class CreateFieldDefinitionUseCase {
  constructor(
    @inject(DI_TOKENS.IFieldDefinitionRepository)
    private readonly fieldDefinitionRepository: IFieldDefinitionRepository,
  ) {}

  /**
   * Execute create field definition use case
   *
   * @param props - Field definition creation properties
   * @returns Created field definition
   * @throws Error if name already exists
   */
  async execute(props: CreateFieldDefinitionProps): Promise<FieldDefinition> {
    // Check for duplicate name
    const existsByName = await this.fieldDefinitionRepository.existsByName(
      props.name,
    );
    if (existsByName) {
      throw new Error(
        `Field definition with name "${props.name}" already exists`,
      );
    }

    const fieldDefinition = FieldDefinition.create(props);
    const created =
      await this.fieldDefinitionRepository.create(fieldDefinition);
    return created;
  }
}
