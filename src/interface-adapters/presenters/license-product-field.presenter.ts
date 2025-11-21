/**
 * LicenseProductField Presenter
 * Transforms LicenseProductField entities to DTOs for the presentation layer
 */

import type { LicenseProductField } from "@/core/domain/entities/license-product-field.entity";

export interface LicenseProductFieldDTO {
  id: string;
  licenseProductId: string;
  fieldDefinitionId: string;
  isRequired: boolean;
  isVisible: boolean;
  uiOrder: number;
  defaultValue: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export class LicenseProductFieldPresenter {
  static toDTO(field: LicenseProductField): LicenseProductFieldDTO {
    return {
      id: field.id,
      licenseProductId: field.licenseProductId,
      fieldDefinitionId: field.fieldDefinitionId,
      isRequired: field.isRequired,
      isVisible: field.isVisible,
      uiOrder: field.uiOrder,
      defaultValue: field.defaultValue,
      createdAt: field.createdAt,
      updatedAt: field.updatedAt,
    };
  }

  static toDTOList(fields: LicenseProductField[]): LicenseProductFieldDTO[] {
    return fields.map((field) => this.toDTO(field));
  }
}
