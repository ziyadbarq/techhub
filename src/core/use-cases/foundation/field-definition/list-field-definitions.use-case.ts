/**
 * List Field Definitions Use Case
 *
 * Business logic for listing field definitions with optional filtering.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { FieldDefinition } from "@/core/domain/entities/field-definition.entity";
import type { IFieldDefinitionRepository } from "@/core/repositories/field-definition.repository.interface";
import type { FieldDataTypeEnum } from "@/core/domain/value-objects/foundation-enums";

export interface ListFieldDefinitionsOptions {
  skip?: number;
  take?: number;
  orderBy?: "name" | "label" | "dataType" | "uiOrder" | "createdAt";
  order?: "asc" | "desc";
  dataType?: FieldDataTypeEnum;
  isGlobal?: boolean;
  isSearchable?: boolean;
  isFilterable?: boolean;
  uiGroup?: string;
}

@injectable()
export class ListFieldDefinitionsUseCase {
  constructor(
    @inject(DI_TOKENS.IFieldDefinitionRepository)
    private readonly fieldDefinitionRepository: IFieldDefinitionRepository,
  ) {}

  /**
   * Execute list field definitions use case
   *
   * @param options - Optional filter options
   * @returns Array of field definitions
   */
  async execute(
    options?: ListFieldDefinitionsOptions,
  ): Promise<FieldDefinition[]> {
    if (options?.dataType) {
      return await this.fieldDefinitionRepository.findByDataType(
        options.dataType,
      );
    }

    if (options?.isGlobal !== undefined) {
      return await this.fieldDefinitionRepository.findGlobal({
        dataType: options.dataType,
      });
    }

    if (options?.isSearchable !== undefined) {
      return await this.fieldDefinitionRepository.findSearchable();
    }

    if (options?.isFilterable !== undefined) {
      return await this.fieldDefinitionRepository.findFilterable();
    }

    if (options?.uiGroup) {
      return await this.fieldDefinitionRepository.findByUiGroup(
        options.uiGroup,
      );
    }

    return await this.fieldDefinitionRepository.findAll(options);
  }
}
