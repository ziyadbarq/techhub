/**
 * Global Search Use Case
 *
 * Business logic for searching across multiple entity types.
 * Returns permission-aware search results.
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ISearchRepository } from "@/core/repositories/search.repository.interface";
import type { SearchResult } from "@/core/domain/entities/search/search-result.entity";

export interface GlobalSearchInput {
  query: string;
  entityTypes?: string[];
  limit?: number;
}

@injectable()
export class GlobalSearchUseCase {
  constructor(
    @inject(DI_TOKENS.ISearchRepository)
    private readonly searchRepository: ISearchRepository,
  ) {}

  /**
   * Execute global search across configured entity types
   *
   * @param input - Search query and options
   * @returns Array of search results grouped by entity type
   */
  async execute(input: GlobalSearchInput): Promise<SearchResult[]> {
    // Validation: minimum query length
    const trimmedQuery = input.query.trim();
    if (trimmedQuery.length < 2) {
      return [];
    }

    // Execute search across all configured repositories
    const results = await this.searchRepository.searchAll(trimmedQuery, {
      entityTypes: input.entityTypes,
      limit: input.limit ?? 5, // Default 5 results per entity type
      minLength: 2,
    });

    return results;
  }
}
