/**
 * Update DataOwnership Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IDataOwnershipRepository } from "@/core/repositories/data-ownership.repository.interface";
import type { IDataDomainRepository } from "@/core/repositories/data-domain.repository.interface";
import type { DataOwnership } from "@/core/domain/entities/data-ownership.entity";

export interface UpdateDataOwnershipRequest {
  id: string;
  dataDomainId?: string;
  ciClassId?: string | null;
  assetCategoryId?: string | null;
  ownerPersonId?: string | null;
  ownerOrgUnitId?: string | null;
  note?: string | null;
}

@injectable()
export class UpdateDataOwnershipUseCase {
  constructor(
    @inject(DI_TOKENS.IDataOwnershipRepository)
    private dataOwnershipRepository: IDataOwnershipRepository,
    @inject(DI_TOKENS.IDataDomainRepository)
    private dataDomainRepository: IDataDomainRepository,
  ) {}

  async execute(request: UpdateDataOwnershipRequest): Promise<DataOwnership> {
    // Fetch existing data ownership
    const dataOwnership = await this.dataOwnershipRepository.findById(
      request.id,
    );

    if (!dataOwnership) {
      throw new Error("Data ownership not found");
    }

    // Validate data domain if being updated
    if (
      request.dataDomainId !== undefined &&
      request.dataDomainId !== dataOwnership.dataDomainId
    ) {
      const dataDomain = await this.dataDomainRepository.findById(
        request.dataDomainId,
      );
      if (!dataDomain) {
        throw new Error("Data domain not found");
      }
    }

    // Determine target values (use request values if provided, otherwise use existing)
    const targetCiClassId =
      request.ciClassId !== undefined
        ? request.ciClassId
        : dataOwnership.ciClassId;
    const targetAssetCategoryId =
      request.assetCategoryId !== undefined
        ? request.assetCategoryId
        : dataOwnership.assetCategoryId;
    const targetDataDomainId =
      request.dataDomainId !== undefined
        ? request.dataDomainId
        : dataOwnership.dataDomainId;

    // Validate polymorphic target fields
    const hasCIClass = targetCiClassId !== null && targetCiClassId !== undefined;
    const hasAssetCategory =
      targetAssetCategoryId !== null && targetAssetCategoryId !== undefined;

    if (!hasCIClass && !hasAssetCategory) {
      throw new Error(
        "Data ownership must be assigned to either a CI class or an asset category",
      );
    }

    if (hasCIClass && hasAssetCategory) {
      throw new Error(
        "Data ownership cannot be assigned to both a CI class and an asset category",
      );
    }

    // Check for duplicate if target or data domain is being updated
    const targetChanged =
      targetCiClassId !== dataOwnership.ciClassId ||
      targetAssetCategoryId !== dataOwnership.assetCategoryId ||
      targetDataDomainId !== dataOwnership.dataDomainId;

    if (targetChanged) {
      const existingOwnership =
        await this.dataOwnershipRepository.existsByDataDomainAndTarget(
          targetDataDomainId,
          targetCiClassId,
          targetAssetCategoryId,
          request.id,
        );
      if (existingOwnership) {
        const target = targetCiClassId
          ? "CI class"
          : targetAssetCategoryId
            ? "asset category"
            : "target";
        throw new Error(
          `A data ownership already exists for this data domain and ${target}`,
        );
      }
    }

    // Update target fields using entity setters (which handle mutual exclusivity)
    if (request.ciClassId !== undefined) {
      dataOwnership.ciClassId = request.ciClassId;
    }
    if (request.assetCategoryId !== undefined) {
      dataOwnership.assetCategoryId = request.assetCategoryId;
    }

    // Validate polymorphic owner fields
    const targetOwnerPersonId =
      request.ownerPersonId !== undefined
        ? request.ownerPersonId
        : dataOwnership.ownerPersonId;
    const targetOwnerOrgUnitId =
      request.ownerOrgUnitId !== undefined
        ? request.ownerOrgUnitId
        : dataOwnership.ownerOrgUnitId;

    const hasOwnerPerson =
      targetOwnerPersonId !== null && targetOwnerPersonId !== undefined;
    const hasOwnerOrgUnit =
      targetOwnerOrgUnitId !== null && targetOwnerOrgUnitId !== undefined;

    if (hasOwnerPerson && hasOwnerOrgUnit) {
      throw new Error(
        "Data ownership cannot have both a person and organizational unit as owner",
      );
    }

    // Update owner fields using entity setters (which handle mutual exclusivity)
    if (request.ownerPersonId !== undefined) {
      dataOwnership.ownerPersonId = request.ownerPersonId;
    }
    if (request.ownerOrgUnitId !== undefined) {
      dataOwnership.ownerOrgUnitId = request.ownerOrgUnitId;
    }

    // Update other fields
    if (request.note !== undefined) {
      dataOwnership.note = request.note;
    }

    return await this.dataOwnershipRepository.update(dataOwnership);
  }
}
