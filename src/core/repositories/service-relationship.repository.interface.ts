import type { ServiceRelationshipType } from "@/generated/prisma";
import type { ServiceRelationship } from "../domain/entities/service-relationship.entity";

/**
 * Service Relationship Repository Interface
 *
 * Defines the contract for persisting and retrieving service-to-service relationships.
 */
export interface IServiceRelationshipRepository {
  /**
   * Create a new service relationship
   */
  create(relationship: ServiceRelationship): Promise<ServiceRelationship>;

  /**
   * Find a relationship by ID
   */
  findById(id: string): Promise<ServiceRelationship | null>;

  /**
   * Find all relationships
   */
  findAll(): Promise<ServiceRelationship[]>;

  /**
   * Find relationships originating from a specific service (outgoing dependencies)
   */
  findByFromService(fromServiceId: string): Promise<ServiceRelationship[]>;

  /**
   * Find relationships targeting a specific service (incoming dependencies)
   */
  findByToService(toServiceId: string): Promise<ServiceRelationship[]>;

  /**
   * Find all relationships involving a service (both from and to)
   */
  findByService(serviceId: string): Promise<ServiceRelationship[]>;

  /**
   * Find relationships by relationship type
   */
  findByRelationshipType(
    relationshipType: ServiceRelationshipType,
  ): Promise<ServiceRelationship[]>;

  /**
   * Find all active relationships
   */
  findActiveRelationships(): Promise<ServiceRelationship[]>;

  /**
   * Find relationships that are currently valid (within date range and active)
   */
  findCurrentlyValidRelationships(): Promise<ServiceRelationship[]>;

  /**
   * Find critical relationships
   */
  findCriticalRelationships(): Promise<ServiceRelationship[]>;

  /**
   * Find services that would be impacted if a service fails (recursive, up to maxDepth)
   * Returns services with their impact depth
   */
  findImpactedServices(
    serviceId: string,
    maxDepth?: number,
  ): Promise<{ serviceId: string; serviceName: string; depth: number }[]>;

  /**
   * Update an existing relationship
   */
  update(relationship: ServiceRelationship): Promise<ServiceRelationship>;

  /**
   * Delete a relationship
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a relationship exists between two services
   */
  existsBetweenServices(
    fromServiceId: string,
    toServiceId: string,
    relationshipType: ServiceRelationshipType,
  ): Promise<boolean>;

  /**
   * Count total relationships
   */
  count(): Promise<number>;

  /**
   * Count relationships by service (both directions)
   */
  countByService(serviceId: string): Promise<number>;
}
