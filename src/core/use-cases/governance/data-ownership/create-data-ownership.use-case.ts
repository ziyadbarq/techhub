/**
 * Create DataOwnership Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IDataOwnershipRepository } from "@/core/repositories/data-ownership.repository.interface";
import type { IDataDomainRepository } from "@/core/repositories/data-domain.repository.interface";
import { DataOwnership } from "@/core/domain/entities/data-ownership.entity";

export interface CreateDataOwnershipRequest {
  dataDomainId: string;
  ciClassId?: string | null;
  assetCategoryId?: string | null;
  ownerPersonId?: string | null;
  ownerOrgUnitId?: string | null;
  note?: string | null;
}

@injectable()
export class CreateDataOwnershipUseCase {
  constructor(
    @inject(DI_TOKENS.IDataOwnershipRepository)
    private dataOwnershipRepository: IDataOwnershipRepository,
    @inject(DI_TOKENS.IDataDomainRepository)
    private dataDomainRepository: IDataDomainRepository,
  ) {}

  async execute(request: CreateDataOwnershipRequest): Promise<DataOwnership> {
    // Validate that data domain exists
    const dataDomain = await this.dataDomainRepository.findById(
      request.dataDomainId,
    );
    if (!dataDomain) {
      throw new Error("Data domain not found");
    }

    // Check for duplicate data ownership for the same data domain and target
    const existingOwnership =
      await this.dataOwnershipRepository.existsByDataDomainAndTarget(
        request.dataDomainId,
        request.ciClassId,
        request.assetCategoryId,
      );
    if (existingOwnership) {
      const target = request.ciClassId
        ? "CI class"
        : request.assetCategoryId
          ? "asset category"
          : "target";
      throw new Error(
        `A data ownership already exists for this data domain and ${target}`,
      );
    }

    // Create data ownership entity
    const dataOwnership = DataOwnership.create({
      dataDomainId: request.dataDomainId,
      ciClassId: request.ciClassId,
      assetCategoryId: request.assetCategoryId,
      ownerPersonId: request.ownerPersonId,
      ownerOrgUnitId: request.ownerOrgUnitId,
      note: request.note,
    });

    return await this.dataOwnershipRepository.create(dataOwnership);
  }
}
