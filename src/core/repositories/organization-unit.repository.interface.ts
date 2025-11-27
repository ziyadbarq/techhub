/**
 * IOrganizationUnitRepository Interface
 * Data access contract for organization units
 */

import type { OrganizationUnit } from "../domain/entities/organization-unit.entity";

export interface IOrganizationUnitRepository {
  /**
   * Create a new organization unit
   */
  create(orgUnit: OrganizationUnit): Promise<OrganizationUnit>;

  /**
   * Find organization unit by ID
   */
  findById(id: string): Promise<OrganizationUnit | null>;

  /**
   * Find organization unit by code
   */
  findByCode(code: string): Promise<OrganizationUnit | null>;

  /**
   * Find organization units by codes (batch lookup for import)
   * Used for duplicate detection in data import
   */
  findByCodes(codes: string[]): Promise<OrganizationUnit[]>;

  /**
   * Find root organization units (no parent)
   */
  findRoots(): Promise<OrganizationUnit[]>;

  /**
   * Find children of an organization unit
   */
  findChildren(parentId: string): Promise<OrganizationUnit[]>;

  /**
   * Find parent of an organization unit
   */
  findParent(id: string): Promise<OrganizationUnit | null>;

  /**
   * Find all ancestors (recursive up the tree)
   */
  findAncestors(id: string): Promise<OrganizationUnit[]>;

  /**
   * Find all descendants (recursive down the tree)
   */
  findDescendants(id: string): Promise<OrganizationUnit[]>;

  /**
   * Find siblings (same parent)
   */
  findSiblings(id: string): Promise<OrganizationUnit[]>;

  /**
   * Find all organization units by level
   */
  findByLevel(level: number): Promise<OrganizationUnit[]>;

  /**
   * Find active organization units
   */
  findActive(options?: {
    skip?: number;
    take?: number;
  }): Promise<OrganizationUnit[]>;

  /**
   * Find inactive organization units
   */
  findInactive(options?: {
    skip?: number;
    take?: number;
  }): Promise<OrganizationUnit[]>;

  /**
   * Find all organization units
   */
  findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "name" | "code" | "level" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<OrganizationUnit[]>;

  /**
   * Search organization units by name or code
   */
  search(
    query: string,
    options?: {
      skip?: number;
      take?: number;
      activeOnly?: boolean;
    },
  ): Promise<OrganizationUnit[]>;

  /**
   * Count all organization units
   */
  count(): Promise<number>;

  /**
   * Count children
   */
  countChildren(parentId: string): Promise<number>;

  /**
   * Update organization unit
   */
  update(orgUnit: OrganizationUnit): Promise<OrganizationUnit>;

  /**
   * Delete organization unit
   */
  delete(id: string): Promise<void>;

  /**
   * Check if has children
   */
  hasChildren(id: string): Promise<boolean>;

  /**
   * Check if has active children
   */
  hasActiveChildren(id: string): Promise<boolean>;

  /**
   * Check if has people assigned
   */
  hasPeople(id: string): Promise<boolean>;

  /**
   * Check if has active people
   */
  hasActivePeople(id: string): Promise<boolean>;

  /**
   * Check if code exists (for uniqueness validation)
   */
  existsByCode(code: string, excludeId?: string): Promise<boolean>;
}
