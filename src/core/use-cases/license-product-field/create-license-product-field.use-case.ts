/**
 * Create LicenseProductField Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseProductFieldRepository } from "@/core/repositories/license-product-field.repository.interface";
import type { ILicenseProductRepository } from "@/core/repositories/license-product.repository.interface";
import type { IFieldDefinitionRepository } from "@/core/repositories/field-definition.repository.interface";
import { LicenseProductField } from "@/core/domain/entities/license-product-field.entity";

const TOKENS = DI_TOKENS as Record<string, symbol>;

export interface CreateLicenseProductFieldRequest {
  licenseProductId: string;
  fieldDefinitionId: string;
  isRequired?: boolean;
  isVisible?: boolean;
  uiOrder?: number;
  defaultValue?: Record<string, unknown> | null;
}

@injectable()
export class CreateLicenseProductFieldUseCase {
  constructor(
    @inject(TOKENS.ILicenseProductFieldRepository)
    private fieldRepository: ILicenseProductFieldRepository,
    @inject(TOKENS.ILicenseProductRepository)
    private licenseProductRepository: ILicenseProductRepository,
    @inject(TOKENS.IFieldDefinitionRepository)
    private fieldDefinitionRepository: IFieldDefinitionRepository,
  ) {}

  async execute(
    request: CreateLicenseProductFieldRequest,
  ): Promise<LicenseProductField> {
    // Validate license product exists
    const licenseProduct = await this.licenseProductRepository.findById(
      request.licenseProductId,
    );
    if (!licenseProduct) {
      throw new Error("License product not found");
    }

    // Validate field definition exists
    const fieldDefinition = await this.fieldDefinitionRepository.findById(
      request.fieldDefinitionId,
    );
    if (!fieldDefinition) {
      throw new Error("Field definition not found");
    }

    // Check if field already attached to this license product
    const existing = await this.fieldRepository.exists(
      request.licenseProductId,
      request.fieldDefinitionId,
    );
    if (existing) {
      throw new Error(
        "This field definition is already attached to this license product",
      );
    }

    // Create field
    const field = LicenseProductField.create({
      licenseProductId: request.licenseProductId,
      fieldDefinitionId: request.fieldDefinitionId,
      isRequired: request.isRequired,
      isVisible: request.isVisible,
      uiOrder: request.uiOrder,
      defaultValue: request.defaultValue,
    });

    return await this.fieldRepository.create(field);
  }
}
