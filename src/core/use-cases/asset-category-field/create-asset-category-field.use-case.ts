/**
 * Create AssetCategoryField Use Case
 */

import { injectable, inject } from "inversify";
import { ConflictError } from "@/core/domain/errors/conflict.error";
import { DI_TOKENS } from "@/di/types";
import type { IAssetCategoryFieldRepository } from "@/core/repositories/asset-category-field.repository.interface";
import type { IAssetCategoryRepository } from "@/core/repositories/asset-category.repository.interface";
import type { IFieldDefinitionRepository } from "@/core/repositories/field-definition.repository.interface";
import { AssetCategoryField } from "@/core/domain/entities/asset-category-field.entity";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface CreateAssetCategoryFieldRequest {
  assetCategoryId: string;
  fieldDefinitionId: string;
  isRequired?: boolean;
  isUnique?: boolean;
  isVisible?: boolean;
  defaultValue?: Record<string, unknown> | null;
  uiOrder?: number;
}

@injectable()
export class CreateAssetCategoryFieldUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetCategoryFieldRepository)
    private fieldRepository: IAssetCategoryFieldRepository,
    @inject(DI_TOKENS.IAssetCategoryRepository)
    private categoryRepository: IAssetCategoryRepository,
    @inject(DI_TOKENS.IFieldDefinitionRepository)
    private fieldDefinitionRepository: IFieldDefinitionRepository,

    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(
    request: CreateAssetCategoryFieldRequest,
  ): Promise<AssetCategoryField> {
    // Verify asset category exists
    const category = await this.categoryRepository.findById(
      request.assetCategoryId,
    );
    if (!category) {
      throw new NotFoundError("Asset category not found");
    }

    // Verify field definition exists
    const fieldDefinition = await this.fieldDefinitionRepository.findById(
      request.fieldDefinitionId,
    );
    if (!fieldDefinition) {
      throw new NotFoundError("Field definition not found");
    }

    // Check for duplicate
    const existing = await this.fieldRepository.exists(
      request.assetCategoryId,
      request.fieldDefinitionId,
    );
    if (existing) {
      throw new ConflictError(
        "This field definition is already attached to this asset category",
      );
    }

    // Create entity
    const field = AssetCategoryField.create({
      assetCategoryId: request.assetCategoryId,
      fieldDefinitionId: request.fieldDefinitionId,
      isRequired: request.isRequired,
      isUnique: request.isUnique,
      isVisible: request.isVisible,
      defaultValue: request.defaultValue,
      uiOrder: request.uiOrder,
    });

    // Persist
    return await this.fieldRepository.create(field);
  }
}
