/**
 * Update LicenseProductField Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseProductFieldRepository } from "@/core/repositories/license-product-field.repository.interface";
import type { LicenseProductField } from "@/core/domain/entities/license-product-field.entity";

export interface UpdateLicenseProductFieldRequest {
  id: string;
  isRequired?: boolean;
  isVisible?: boolean;
  uiOrder?: number;
  defaultValue?: Record<string, unknown> | null;
}

@injectable()
export class UpdateLicenseProductFieldUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseProductFieldRepository)
    private fieldRepository: ILicenseProductFieldRepository,
  ) {}

  async execute(
    request: UpdateLicenseProductFieldRequest,
  ): Promise<LicenseProductField> {
    const field = await this.fieldRepository.findById(request.id);

    if (!field) {
      throw new Error("License product field not found");
    }

    // Update field properties
    if (request.isRequired !== undefined) {
      if (request.isRequired) {
        field.makeRequired();
      } else {
        field.makeOptional();
      }
    }
    if (request.isVisible !== undefined) {
      if (request.isVisible) {
        field.show();
      } else {
        field.hide();
      }
    }
    if (request.uiOrder !== undefined) {
      field.setUIOrder(request.uiOrder);
    }
    if (request.defaultValue !== undefined) {
      field.setDefaultValue(request.defaultValue);
    }

    return await this.fieldRepository.update(field);
  }
}
