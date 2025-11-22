/**
 * DataOwnership Repository Interface
 *
 * Defines data access operations for DataOwnership entities.
 */

import type { DataOwnership } from "@/core/domain/entities/data-ownership.entity";

export interface IDataOwnershipRepository {
  /**
   * Creates a new data ownership
   */
  create(dataOwnership: DataOwnership): Promise<DataOwnership>;

  /**
   * Finds a data ownership by ID
   */
  findById(id: string): Promise<DataOwnership | null>;

  /**
   * Finds all data ownerships
   */
  findAll(): Promise<DataOwnership[]>;

  /**
   * Finds data ownerships by data domain ID
   */
  findByDataDomain(dataDomainId: string): Promise<DataOwnership[]>;

  /**
   * Finds data ownerships by CI class ID
   */
  findByCIClass(ciClassId: string): Promise<DataOwnership[]>;

  /**
   * Finds data ownerships by asset category ID
   */
  findByAssetCategory(assetCategoryId: string): Promise<DataOwnership[]>;

  /**
   * Finds data ownerships by owner person ID
   */
  findByOwnerPerson(ownerPersonId: string): Promise<DataOwnership[]>;

  /**
   * Finds data ownerships by owner organizational unit ID
   */
  findByOwnerOrgUnit(ownerOrgUnitId: string): Promise<DataOwnership[]>;

  /**
   * Updates an existing data ownership
   */
  update(dataOwnership: DataOwnership): Promise<DataOwnership>;

  /**
   * Deletes a data ownership by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Checks if a data ownership exists for a specific data domain and target
   */
  existsByDataDomainAndTarget(
    dataDomainId: string,
    ciClassId?: string | null,
    assetCategoryId?: string | null,
    excludeId?: string,
  ): Promise<boolean>;
}
