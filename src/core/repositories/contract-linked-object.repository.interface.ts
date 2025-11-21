/**
 * ContractLinkedObject Repository Interface
 *
 * Defines data access operations for ContractLinkedObject entities.
 */

import type {
  ContractLinkedObject,
  TargetObjectType,
} from "@/core/domain/entities/contract-linked-object.entity";

export interface IContractLinkedObjectRepository {
  /**
   * Creates a new contract linked object
   */
  create(linkedObject: ContractLinkedObject): Promise<ContractLinkedObject>;

  /**
   * Finds a contract linked object by ID
   */
  findById(id: string): Promise<ContractLinkedObject | null>;

  /**
   * Finds all linked objects for a contract
   */
  findByContractId(contractId: string): Promise<ContractLinkedObject[]>;

  /**
   * Finds all contracts linked to a specific target
   */
  findByTarget(
    targetType: TargetObjectType,
    targetId: string,
  ): Promise<ContractLinkedObject[]>;

  /**
   * Finds all linked objects by target type
   */
  findByTargetType(
    targetType: TargetObjectType,
  ): Promise<ContractLinkedObject[]>;

  /**
   * Updates an existing contract linked object
   */
  update(linkedObject: ContractLinkedObject): Promise<ContractLinkedObject>;

  /**
   * Deletes a contract linked object by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Checks if a link already exists between a contract and a target
   */
  exists(
    contractId: string,
    targetType: TargetObjectType,
    targetId: string,
  ): Promise<boolean>;
}
