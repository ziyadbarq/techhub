/**
 * DataDomain Presenter
 * Transforms DataDomain entities to DTOs for the presentation layer
 */

import type { DataDomain } from "@/core/domain/entities/data-domain.entity";

export interface DataDomainDTO {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class DataDomainPresenter {
  static toDTO(dataDomain: DataDomain): DataDomainDTO {
    return {
      id: dataDomain.id,
      name: dataDomain.name,
      code: dataDomain.code,
      description: dataDomain.description,
      isActive: dataDomain.isActive,
      createdAt: dataDomain.createdAt,
      updatedAt: dataDomain.updatedAt,
    };
  }

  static toDTOList(dataDomains: DataDomain[]): DataDomainDTO[] {
    return dataDomains.map((dataDomain) => this.toDTO(dataDomain));
  }
}
