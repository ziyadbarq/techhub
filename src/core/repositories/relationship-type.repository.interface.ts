import type { RelationshipType } from "../domain/entities/relationship-type.entity";

/**
 * Relationship Type Repository Interface
 *
 * Defines the contract for persisting and retrieving relationship types.
 */
export interface IRelationshipTypeRepository {
  /**
   * Create a new relationship type
   */
  create(type: RelationshipType): Promise<RelationshipType>;

  /**
   * Find a relationship type by ID
   */
  findById(id: string): Promise<RelationshipType | null>;

  /**
   * Find all relationship types
   */
  findAll(): Promise<RelationshipType[]>;

  /**
   * Find a relationship type by code
   */
  findByCode(code: string): Promise<RelationshipType | null>;

  /**
   * Find bidirectional relationship types
   */
  findBidirectional(): Promise<RelationshipType[]>;

  /**
   * Find unidirectional relationship types
   */
  findUnidirectional(): Promise<RelationshipType[]>;

  /**
   * Find impacting relationship types
   */
  findImpacting(): Promise<RelationshipType[]>;

  /**
   * Update an existing relationship type
   */
  update(type: RelationshipType): Promise<RelationshipType>;

  /**
   * Delete a relationship type
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a relationship type with the given code exists
   */
  existsByCode(code: string): Promise<boolean>;
}
