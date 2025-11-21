/**
 * RelationshipTypeScope Repository Interface
 */

import type { RelationshipTypeScope } from "@/core/domain/entities/relationship-type-scope.entity";

export interface IRelationshipTypeScopeRepository {
  /**
   * Create a new relationship type scope
   */
  create(scope: RelationshipTypeScope): Promise<RelationshipTypeScope>;

  /**
   * Find a relationship type scope by ID
   */
  findById(id: string): Promise<RelationshipTypeScope | null>;

  /**
   * Find all scopes for a relationship type
   */
  findByRelationshipTypeId(
    relationshipTypeId: string,
  ): Promise<RelationshipTypeScope[]>;

  /**
   * Find scopes where a CI class is the source
   */
  findByFromCiClassId(fromCiClassId: string): Promise<RelationshipTypeScope[]>;

  /**
   * Find scopes where a CI class is the target
   */
  findByToCiClassId(toCiClassId: string): Promise<RelationshipTypeScope[]>;

  /**
   * Find a specific scope combination
   */
  findByScope(
    relationshipTypeId: string,
    fromCiClassId: string,
    toCiClassId: string,
  ): Promise<RelationshipTypeScope | null>;

  /**
   * Find all relationship type scopes
   */
  findAll(): Promise<RelationshipTypeScope[]>;

  /**
   * Update a relationship type scope
   */
  update(scope: RelationshipTypeScope): Promise<RelationshipTypeScope>;

  /**
   * Delete a relationship type scope
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a scope exists
   */
  exists(
    relationshipTypeId: string,
    fromCiClassId: string,
    toCiClassId: string,
  ): Promise<boolean>;

  /**
   * Count scopes for a relationship type
   */
  countByRelationshipTypeId(relationshipTypeId: string): Promise<number>;
}
