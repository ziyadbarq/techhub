/**
 * DataOwnership Presenter
 * Transforms DataOwnership entities to DTOs for the presentation layer
 */

import type { DataOwnership } from "@/core/domain/entities/data-ownership.entity";

export interface DataOwnershipDTO {
  id: string;
  dataDomainId: string;
  ciClassId: string | null;
  assetCategoryId: string | null;
  ownerPersonId: string | null;
  ownerOrgUnitId: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class DataOwnershipPresenter {
  static toDTO(dataOwnership: DataOwnership): DataOwnershipDTO {
    return {
      id: dataOwnership.id,
      dataDomainId: dataOwnership.dataDomainId,
      ciClassId: dataOwnership.ciClassId,
      assetCategoryId: dataOwnership.assetCategoryId,
      ownerPersonId: dataOwnership.ownerPersonId,
      ownerOrgUnitId: dataOwnership.ownerOrgUnitId,
      note: dataOwnership.note,
      createdAt: dataOwnership.createdAt,
      updatedAt: dataOwnership.updatedAt,
    };
  }

  static toDTOList(dataOwnerships: DataOwnership[]): DataOwnershipDTO[] {
    return dataOwnerships.map((dataOwnership) => this.toDTO(dataOwnership));
  }
}
