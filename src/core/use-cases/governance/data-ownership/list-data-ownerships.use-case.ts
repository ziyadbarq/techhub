/**
 * List DataOwnerships Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IDataOwnershipRepository } from "@/core/repositories/data-ownership.repository.interface";
import type { DataOwnership } from "@/core/domain/entities/data-ownership.entity";

export interface ListDataOwnershipsRequest {
  dataDomainId?: string;
  ciClassId?: string;
  assetCategoryId?: string;
  ownerPersonId?: string;
  ownerOrgUnitId?: string;
}

@injectable()
export class ListDataOwnershipsUseCase {
  constructor(
    @inject(DI_TOKENS.IDataOwnershipRepository)
    private dataOwnershipRepository: IDataOwnershipRepository,
  ) {}

  async execute(
    request: ListDataOwnershipsRequest = {},
  ): Promise<DataOwnership[]> {
    // Filter by data domain
    if (request.dataDomainId) {
      return await this.dataOwnershipRepository.findByDataDomain(
        request.dataDomainId,
      );
    }

    // Filter by CI class
    if (request.ciClassId) {
      return await this.dataOwnershipRepository.findByCIClass(
        request.ciClassId,
      );
    }

    // Filter by asset category
    if (request.assetCategoryId) {
      return await this.dataOwnershipRepository.findByAssetCategory(
        request.assetCategoryId,
      );
    }

    // Filter by owner person
    if (request.ownerPersonId) {
      return await this.dataOwnershipRepository.findByOwnerPerson(
        request.ownerPersonId,
      );
    }

    // Filter by owner organizational unit
    if (request.ownerOrgUnitId) {
      return await this.dataOwnershipRepository.findByOwnerOrgUnit(
        request.ownerOrgUnitId,
      );
    }

    // Return all if no filters
    return await this.dataOwnershipRepository.findAll();
  }
}
