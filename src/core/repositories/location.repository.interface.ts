/**
 * ILocationRepository Interface
 * Data access contract for locations
 */

import type { Location } from "../domain/entities/location.entity";

export interface ILocationRepository {
  /**
   * Create a new location
   */
  create(location: Location): Promise<Location>;

  /**
   * Find location by ID
   */
  findById(id: string): Promise<Location | null>;

  /**
   * Find location by code
   */
  findByCode(code: string): Promise<Location | null>;

  /**
   * Find locations by codes (batch lookup for import)
   * Used for duplicate detection in data import
   */
  findByCodes(codes: string[]): Promise<Location[]>;

  /**
   * Find root locations (no parent)
   */
  findRoots(): Promise<Location[]>;

  /**
   * Find children of a location
   */
  findChildren(parentId: string): Promise<Location[]>;

  /**
   * Find parent of a location
   */
  findParent(id: string): Promise<Location | null>;

  /**
   * Find all ancestors (recursive up the tree)
   */
  findAncestors(id: string): Promise<Location[]>;

  /**
   * Find all descendants (recursive down the tree)
   */
  findDescendants(id: string): Promise<Location[]>;

  /**
   * Find siblings (same parent)
   */
  findSiblings(id: string): Promise<Location[]>;

  /**
   * Find locations by type
   */
  findByType(locationType: string): Promise<Location[]>;

  /**
   * Find locations by city
   */
  findByCity(city: string): Promise<Location[]>;

  /**
   * Find locations by country
   */
  findByCountry(country: string): Promise<Location[]>;

  /**
   * Find locations with coordinates
   */
  findWithCoordinates(): Promise<Location[]>;

  /**
   * Find locations near coordinates (within radius in km)
   */
  findNearCoordinates(
    latitude: number,
    longitude: number,
    radiusKm: number,
  ): Promise<Location[]>;

  /**
   * Find all locations
   */
  findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "name" | "code" | "locationType" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<Location[]>;

  /**
   * Search locations by name or code
   */
  search(
    query: string,
    options?: {
      skip?: number;
      take?: number;
      locationType?: string;
    },
  ): Promise<Location[]>;

  /**
   * Count all locations
   */
  count(): Promise<number>;

  /**
   * Count children
   */
  countChildren(parentId: string): Promise<number>;

  /**
   * Update location
   */
  update(location: Location): Promise<Location>;

  /**
   * Delete location
   */
  delete(id: string): Promise<void>;

  /**
   * Check if has children
   */
  hasChildren(id: string): Promise<boolean>;

  /**
   * Check if has configuration items
   */
  hasConfigurationItems(id: string): Promise<boolean>;

  /**
   * Check if has assets
   */
  hasAssets(id: string): Promise<boolean>;

  /**
   * Check if code exists (for uniqueness validation)
   */
  existsByCode(code: string, excludeId?: string): Promise<boolean>;
}
