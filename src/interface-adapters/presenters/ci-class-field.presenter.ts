/**
 * CI Class Field Presenter
 * Transforms CI Class Field entities to DTOs for the presentation layer
 */

import type { CIClassField } from "@/core/domain/entities/ci-class-field.entity";

export interface CIClassFieldDTO {
  id: string;
  ciClassId: string;
  fieldDefinitionId: string;
  isRequired: boolean;
  isUnique: boolean;
  isVisible: boolean;
  defaultValue: Record<string, unknown> | null;
  uiOrder: number;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class CIClassFieldPresenter {
  static toDTO(ciClassField: CIClassField): CIClassFieldDTO {
    return {
      id: ciClassField.id,
      ciClassId: ciClassField.ciClassId,
      fieldDefinitionId: ciClassField.fieldDefinitionId,
      isRequired: ciClassField.isRequired,
      isUnique: ciClassField.isUnique,
      isVisible: ciClassField.isVisible,
      defaultValue: ciClassField.defaultValue,
      uiOrder: ciClassField.uiOrder,
      note: ciClassField.note,
      createdAt: ciClassField.createdAt,
      updatedAt: ciClassField.updatedAt,
    };
  }

  static toDTOList(ciClassFields: CIClassField[]): CIClassFieldDTO[] {
    return ciClassFields.map((ciClassField) => this.toDTO(ciClassField));
  }
}
