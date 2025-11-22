/**
 * DataDomain Repository Interface
 *
 * Defines data access operations for DataDomain entities.
 */

import type { DataDomain } from "@/core/domain/entities/data-domain.entity";

export interface IDataDomainRepository {
  /**
   * Creates a new data domain
   */
  create(dataDomain: DataDomain): Promise<DataDomain>;

  /**
   * Finds a data domain by ID
   */
  findById(id: string): Promise<DataDomain | null>;

  /**
   * Finds a data domain by name
   */
  findByName(name: string): Promise<DataDomain | null>;

  /**
   * Finds a data domain by code
   */
  findByCode(code: string): Promise<DataDomain | null>;

  /**
   * Finds all data domains
   */
  findAll(): Promise<DataDomain[]>;

  /**
   * Finds active data domains
   */
  findActive(): Promise<DataDomain[]>;

  /**
   * Updates an existing data domain
   */
  update(dataDomain: DataDomain): Promise<DataDomain>;

  /**
   * Deletes a data domain by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Checks if a data domain exists by name
   */
  existsByName(name: string, excludeId?: string): Promise<boolean>;

  /**
   * Checks if a data domain exists by code
   */
  existsByCode(code: string, excludeId?: string): Promise<boolean>;
}
