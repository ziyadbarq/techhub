/**
 * Contract Type Presenter
 * Transforms Contract Type entities to DTOs for the presentation layer
 */

import type { ContractType } from "@/core/domain/entities/contract-type.entity";

export interface ContractTypeDTO {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ContractTypePresenter {
  static toDTO(contractType: ContractType): ContractTypeDTO {
    return {
      id: contractType.id,
      name: contractType.name,
      code: contractType.code,
      description: contractType.description,
      isActive: contractType.isActive,
      createdAt: contractType.createdAt,
      updatedAt: contractType.updatedAt,
    };
  }

  static toDTOList(contractTypes: ContractType[]): ContractTypeDTO[] {
    return contractTypes.map((contractType) => this.toDTO(contractType));
  }
}
