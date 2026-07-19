/**
 * Search Controller
 * Server actions for global search operations
 */

"use server";

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  SearchRequestSchema,
  type SearchRequestDTO,
  type SearchResultDTO,
} from "../dtos/search.dto";
import type { GlobalSearchUseCase } from "@/core/use-cases/search/global-search";

// Maps each searchable entity type to the permission required to see it
const ENTITY_VIEW_PERMISSIONS = {
  asset: PERMISSIONS.ASSETS_VIEW,
  person: PERMISSIONS.PERSONS_VIEW,
  vendor: PERMISSIONS.VENDORS_VIEW,
  "configuration-item": PERMISSIONS.CONFIGURATION_ITEMS_VIEW,
  contract: PERMISSIONS.CONTRACTS_VIEW,
  "license-product": PERMISSIONS.LICENSE_PRODUCTS_VIEW,
} as const;

/**
 * Global search action
 * Searches across multiple entity types based on user permissions
 */
export async function globalSearchAction(
  data: SearchRequestDTO,
): Promise<ActionResponse<SearchResultDTO[]>> {
  try {
    await requireAuth();

    // Validate input
    const validated = SearchRequestSchema.parse(data);

    // Resolve which entity types the current user may see
    const entityTypeEntries = Object.entries(ENTITY_VIEW_PERMISSIONS);
    const permitted = await Promise.all(
      entityTypeEntries.map(([, permission]) => hasPermission(permission)),
    );
    const permittedEntityTypes = new Set(
      entityTypeEntries
        .filter((_, index) => permitted[index])
        .map(([entityType]) => entityType),
    );

    if (permittedEntityTypes.size === 0) {
      return { success: true, data: [] };
    }

    const requestedEntityTypes = validated.entityTypes?.filter((entityType) =>
      permittedEntityTypes.has(entityType),
    );

    // Get use case from DI container
    const container = getContainer();
    const useCase = container.get<GlobalSearchUseCase>(
      DI_TOKENS.GlobalSearchUseCase,
    );

    // Execute search
    const results = await useCase.execute({
      query: validated.query,
      entityTypes: requestedEntityTypes ?? [...permittedEntityTypes],
      limit: validated.limit,
    });

    // Drop results the user lacks permission to view (the repository
    // searches all entity types regardless of the entityTypes option)
    const visibleResults = results.filter((result) =>
      permittedEntityTypes.has(result.entityType),
    );

    // Convert domain entities to DTOs
    const dtos: SearchResultDTO[] = visibleResults.map((result) => ({
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
