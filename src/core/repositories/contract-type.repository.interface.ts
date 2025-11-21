/**
 * ContractType Repository Interface
 */

import type { ContractType } from "@/core/domain/entities/contract-type.entity";

export interface IContractTypeRepository {
  /**
   * Create a new contract type
   */
  create(contractType: ContractType): Promise<ContractType>;

  /**
   * Find a contract type by ID
   */
  findById(id: string): Promise<ContractType | null>;

  /**
   * Find a contract type by name
   */
  findByName(name: string): Promise<ContractType | null>;

  /**
   * Find a contract type by code
   */
  findByCode(code: string): Promise<ContractType | null>;

  /**
   * Find all contract types
   */
  findAll(): Promise<ContractType[]>;

  /**
   * Find all active contract types
   */
  findAllActive(): Promise<ContractType[]>;

  /**
   * Update a contract type
   */
  update(contractType: ContractType): Promise<ContractType>;

  /**
   * Delete a contract type
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a contract type exists by name
   */
  existsByName(name: string, excludeId?: string): Promise<boolean>;

  /**
   * Check if a contract type exists by code
   */
  existsByCode(code: string, excludeId?: string): Promise<boolean>;
}
