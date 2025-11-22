/**
 * Search Controller
 * Server actions for global search operations
 */

"use server";

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  SearchRequestSchema,
  type SearchRequestDTO,
  type SearchResultDTO,
} from "../dtos/search.dto";
import type { GlobalSearchUseCase } from "@/core/use-cases/search/global-search";

/**
 * Global search action
 * Searches across multiple entity types based on user permissions
 */
export async function globalSearchAction(
  data: SearchRequestDTO,
): Promise<ActionResponse<SearchResultDTO[]>> {
  try {
    // Validate input
    const validated = SearchRequestSchema.parse(data);

    // Get use case from DI container
    const container = getContainer();
    const useCase = container.get<GlobalSearchUseCase>(
      DI_TOKENS.GlobalSearchUseCase,
    );

    // Execute search
    const results = await useCase.execute({
      query: validated.query,
      entityTypes: validated.entityTypes,
      limit: validated.limit,
    });

    // Convert domain entities to DTOs
    const dtos: SearchResultDTO[] = results.map((result) => ({
      id: result.id,
      entityType: result.entityType,
      title: result.title,
      subtitle: result.subtitle,
      metadata: result.metadata,
      url: result.url,
    }));

    return {
      success: true,
      data: dtos,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "globalSearchAction" },
      "Failed to perform search",
    );
  }
}
