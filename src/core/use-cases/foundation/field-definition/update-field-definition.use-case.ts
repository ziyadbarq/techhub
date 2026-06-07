/**
 * Update Field Definition Use Case
 *
 * Business logic for updating an existing field definition.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import type {
  FieldConditionalLogic,
  FieldDefinition,
} from "@/core/domain/entities/field-definition.entity";
import type { IFieldDefinitionRepository } from "@/core/repositories/field-definition.repository.interface";
import type { FieldDataTypeEnum } from "@/core/domain/value-objects/foundation-enums";

export interface UpdateFieldDefinitionProps {
  id: string;
  name?: string;
  label?: string;
  dataType?: FieldDataTypeEnum;
  description?: string | null;
  entityType?: string;
  isRequired?: boolean;
  isUnique?: boolean;
  isSearchable?: boolean;
  isFilterable?: boolean;
  defaultValue?: unknown;
  validationRules?: Record<string, unknown> | null;
  enumOptions?: string[] | null;
  conditionalLogic?: FieldConditionalLogic | null;
  uiOrder?: number;
  displayOrder?: number;
  uiGroup?: string | null;
  isActive?: boolean;
  metadata?: Record<string, unknown> | null;
}

@injectable()
export class UpdateFieldDefinitionUseCase {
  constructor(
    @inject(DI_TOKENS.IFieldDefinitionRepository)
    private readonly fieldDefinitionRepository: IFieldDefinitionRepository,
  ) {}

  /**
   * Execute update field definition use case
   *
   * @param props - Update properties
   * @returns Updated field definition
   * @throws NotFoundError if field definition not found
   */
  async execute(props: UpdateFieldDefinitionProps): Promise<FieldDefinition> {
    // Fetch existing field definition
    const fieldDefinition = await this.fieldDefinitionRepository.findById(
      props.id,
    );
    if (!fieldDefinition) {
      throw new NotFoundError(
        "Field definition not found",
        "FieldDefinition",
        props.id,
      );
    }

    if (
      props.name &&
      props.name.trim().toLowerCase() !== fieldDefinition.name
    ) {
      const existsByName = await this.fieldDefinitionRepository.existsByName(
        props.name,
        props.id,
      );
      if (existsByName) {
        throw new Error(
          `Field definition with name "${props.name}" already exists`,
        );
      }
    }

    // Update using entity's update method (includes validation)
    fieldDefinition.update({
      name: props.name,
      label: props.label,
      dataType: props.dataType,
      description: props.description,
      entityType: props.entityType,
      isRequired: props.isRequired,
      isUnique: props.isUnique,
      validationRules: props.validationRules,
      defaultValue: props.defaultValue,
      enumOptions: props.enumOptions,
      conditionalLogic: props.conditionalLogic,
      uiGroup: props.uiGroup,
      uiOrder: props.uiOrder,
      displayOrder: props.displayOrder,
      isSearchable: props.isSearchable,
      isFilterable: props.isFilterable,
      isActive: props.isActive,
      metadata: props.metadata,
    });

    // Persist changes
    return await this.fieldDefinitionRepository.update(fieldDefinition);
  }
}
