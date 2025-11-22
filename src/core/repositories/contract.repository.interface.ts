/**
 * Contract Repository Interface
 *
 * Defines data access operations for Contract entities.
 */

import type { Contract } from "@/core/domain/entities/contract.entity";

export interface IContractRepository {
  /**
   * Creates a new contract
   */
  create(contract: Contract): Promise<Contract>;

  /**
   * Finds a contract by ID
   */
  findById(id: string): Promise<Contract | null>;

  /**
   * Finds a contract by contract number
   */
  findByContractNumber(contractNumber: string): Promise<Contract | null>;

  /**
   * Finds all contracts
   */
  findAll(): Promise<Contract[]>;

  /**
   * Finds contracts by contract type ID
   */
  findByContractTypeId(contractTypeId: string): Promise<Contract[]>;

  /**
   * Finds contracts by vendor ID
   */
  findByVendorId(vendorId: string): Promise<Contract[]>;

  /**
   * Finds active contracts (not expired)
   */
  findAllActive(asOfDate?: Date): Promise<Contract[]>;

  /**
   * Finds expiring contracts within the specified number of days
   */
  findExpiringSoon(daysAhead: number): Promise<Contract[]>;

  /**
   * Search contracts by contract number or name
   */
  search(
    query: string,
    options?: {
      skip?: number;
      take?: number;
      vendorId?: string;
    },
  ): Promise<Contract[]>;

  /**
   * Updates an existing contract
   */
  update(contract: Contract): Promise<Contract>;

  /**
   * Deletes a contract by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Checks if a contract exists by contract number
   */
  existsByContractNumber(
    contractNumber: string,
    excludeId?: string,
  ): Promise<boolean>;
}
