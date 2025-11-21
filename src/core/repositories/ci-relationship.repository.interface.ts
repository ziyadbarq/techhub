import type { CIRelationship } from "../domain/entities/ci-relationship.entity";

/**
 * CI Relationship Repository Interface
 *
 * Defines the contract for persisting and retrieving CI relationships.
 */
export interface ICIRelationshipRepository {
  /**
   * Create a new CI relationship
   */
  create(relationship: CIRelationship): Promise<CIRelationship>;

  /**
   * Find a relationship by ID
   */
  findById(id: string): Promise<CIRelationship | null>;

  /**
   * Find all relationships
   */
  findAll(): Promise<CIRelationship[]>;

  /**
   * Find relationships originating from a specific CI
   */
  findByFromCi(fromCiId: string): Promise<CIRelationship[]>;

  /**
   * Find relationships targeting a specific CI
   */
  findByToCi(toCiId: string): Promise<CIRelationship[]>;

  /**
   * Find all relationships involving a CI (both from and to)
   */
  findByCi(ciId: string): Promise<CIRelationship[]>;

  /**
   * Find relationships by relationship type
   */
  findByRelationshipType(relationshipTypeId: string): Promise<CIRelationship[]>;

  /**
   * Find all active relationships
   */
  findActiveRelationships(): Promise<CIRelationship[]>;

  /**
   * Find relationships that are currently valid (within date range and active)
   */
  findCurrentlyValidRelationships(): Promise<CIRelationship[]>;

  /**
   * Find impacting relationships for a CI (relationships where failure propagates)
   */
  findImpactingRelationships(ciId: string): Promise<CIRelationship[]>;

  /**
   * Find relationships that would be impacted if a CI fails
   */
  findDependentRelationships(ciId: string): Promise<CIRelationship[]>;

  /**
   * Update an existing relationship
   */
  update(relationship: CIRelationship): Promise<CIRelationship>;

  /**
   * Delete a relationship
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a relationship exists between two CIs
   */
  existsBetweenCis(
    fromCiId: string,
    toCiId: string,
    relationshipTypeId: string,
  ): Promise<boolean>;
}
