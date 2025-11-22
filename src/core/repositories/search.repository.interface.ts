/**
 * ISearchRepository Interface
 * Data access contract for global search across multiple entity types
 */

import type { SearchResult } from "../domain/entities/search/search-result.entity";

export interface SearchOptions {
  /**
   * Entity types to search (if not specified, search all)
   */
  entityTypes?: string[];

  /**
   * Maximum number of results per entity type
   */
  limit?: number;

  /**
   * Minimum query length (default: 2)
   */
  minLength?: number;
}

export interface ISearchRepository {
  /**
   * Search across all configured entity types
   * Returns results grouped by entity type
   */
  searchAll(query: string, options?: SearchOptions): Promise<SearchResult[]>;
}
