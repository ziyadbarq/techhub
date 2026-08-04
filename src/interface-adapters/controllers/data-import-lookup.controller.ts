/**
 * Data Import Lookup Controller
 *
 * Server actions for fetching lookup maps for data import.
 * Resolves codes/names to database IDs for reference fields.
 */

"use server";

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { LookupMap } from "@/lib/data-import/entity-config.types";

// Import use cases for all lookup entities
import type { ListAssetCategoriesUseCase } from "@/core/use-cases/asset/asset-category";
import type { ListAssetModelsUseCase } from "@/core/use-cases/asset/asset-model";
import type { ListVendorsUseCase } from "@/core/use-cases/foundation/vendor";
import type { ListStockLocationsUseCase } from "@/core/use-cases/inventory/stock-location";
import type { ListLifecycleStatesUseCase } from "@/core/use-cases/foundation/lifecycle-state";
import type { ListOrganizationUnitsUseCase } from "@/core/use-cases/foundation/organization-unit";
import type { ListLocationsUseCase } from "@/core/use-cases/foundation/location";
import type { ListPersonsUseCase } from "@/core/use-cases/foundation/person/list-persons.use-case";
import type { ListRolesUseCase } from "@/core/use-cases/rbac/list-roles.use-case";

/**
 * Build lookup map from entities
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
function normalizeLookupKey(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_-]/g, "");
}

function buildLookupMap(
  entities: any[],
  entityName: string,
  lookupField: string,
  displayField: string,
): LookupMap {
  const entries = new Map<string, string>();
  const reverseEntries = new Map<string, string>();
  const allValues: string[] = [];

  // Pass 1: index by display field (name/label) FIRST — lower priority so
  // that when a code collides with a name across records, the code wins.
  if (displayField && displayField !== lookupField) {
    for (const entity of entities) {
      const displayValue = String(entity[displayField] || "");
      if (!displayValue) continue;
      const normalizedDisplay = normalizeLookupKey(displayValue);
      if (normalizedDisplay) entries.set(normalizedDisplay, entity.id);
    }
  }

  // Pass 2: index by the canonical lookup field (usually `code`). This
  // overwrites any name collisions from pass 1, so `code` wins on tie.
  for (const entity of entities) {
    const lookupValue = String(entity[lookupField] || "");
    const normalizedLookupValue = normalizeLookupKey(lookupValue);
    if (normalizedLookupValue) {
      entries.set(normalizedLookupValue, entity.id);
    }
    reverseEntries.set(entity.id, lookupValue);
    allValues.push(lookupValue);
  }

  return {
    targetEntity: entityName,
    lookupField,
    displayField,
    entries,
    reverseEntries,
    allValues,
  };
}

/**
 * Get lookup map for a specific entity
 */
async function getLookupMapForEntity(
  entityName: string,
  lookupField: string,
  displayField: string,
): Promise<LookupMap> {
  const container = getContainer();

  switch (entityName) {
    case "AssetCategory": {
      const useCase = container.get<ListAssetCategoriesUseCase>(
        DI_TOKENS.ListAssetCategoriesUseCase,
      );
      const entities = await useCase.execute();
      return buildLookupMap(entities, entityName, lookupField, displayField);
    }

    case "AssetModel": {
      const useCase = container.get<ListAssetModelsUseCase>(
        DI_TOKENS.ListAssetModelsUseCase,
      );
      const entities = await useCase.execute();
      return buildLookupMap(entities, entityName, lookupField, displayField);
    }

    case "Vendor": {
      const useCase = container.get<ListVendorsUseCase>(
        DI_TOKENS.ListVendorsUseCase,
      );
      const entities = await useCase.execute();
      return buildLookupMap(entities, entityName, lookupField, displayField);
    }

    case "StockLocation": {
      const useCase = container.get<ListStockLocationsUseCase>(
        DI_TOKENS.ListStockLocationsUseCase,
      );
      const entities = await useCase.execute();
      return buildLookupMap(entities, entityName, lookupField, displayField);
    }

    case "LifecycleState": {
      const useCase = container.get<ListLifecycleStatesUseCase>(
        DI_TOKENS.ListLifecycleStatesUseCase,
      );
      const entities = await useCase.execute();
      return buildLookupMap(entities, entityName, lookupField, displayField);
    }

    case "OrganizationUnit": {
      const useCase = container.get<ListOrganizationUnitsUseCase>(
        DI_TOKENS.ListOrganizationUnitsUseCase,
      );
      const entities = await useCase.execute();
      return buildLookupMap(entities, entityName, lookupField, displayField);
    }

    case "Location": {
      const useCase = container.get<ListLocationsUseCase>(
        DI_TOKENS.ListLocationsUseCase,
      );
      const entities = await useCase.execute();
      return buildLookupMap(entities, entityName, lookupField, displayField);
    }

    case "Person": {
      const useCase = container.get<ListPersonsUseCase>(
        DI_TOKENS.ListPersonsUseCase,
      );
      const entities = await useCase.execute();
      return buildLookupMap(entities, entityName, lookupField, displayField);
    }

    case "Role": {
      const useCase = container.get<ListRolesUseCase>(
        DI_TOKENS.ListRolesUseCase,
      );
      const entities = await useCase.execute();
      return buildLookupMap(entities, entityName, lookupField, displayField);
    }

    default:
      throw new Error(`Unsupported lookup entity: ${entityName}`);
  }
}

/**
 * Get all lookup maps for an entity configuration
 *
 * @param lookupFields - Array of lookup field configurations
 * @returns Map of field names to lookup maps
 */
export async function getLookupMapsAction(
  lookupFields: Array<{
    name: string;
    lookupTarget: string;
    lookupField: string;
    lookupDisplayField: string;
  }>,
): Promise<ActionResponse<Map<string, LookupMap>>> {
  try {
    // Check permission - using DATA_IMPORT_MANAGE for now
    await requirePermission(PERMISSIONS.DATA_IMPORT_MANAGE);

    const lookupMaps = new Map<string, LookupMap>();

    // Fetch all lookup maps in parallel
    await Promise.all(
      lookupFields.map(async (field) => {
        const lookupMap = await getLookupMapForEntity(
          field.lookupTarget,
          field.lookupField,
          field.lookupDisplayField,
        );
        lookupMaps.set(field.name, lookupMap);
      }),
    );

    return {
      success: true,
      data: lookupMaps,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getLookupMapsAction" },
      "Failed to fetch lookup maps",
    );
  }
}

/**
 * Get lookup map for a single field
 *
 * @param fieldName - Name of the field
 * @param lookupTarget - Target entity name
 * @param lookupField - Field to lookup by (e.g., "code")
 * @param lookupDisplayField - Field to display (e.g., "name")
 */
export async function getSingleLookupMapAction(
  fieldName: string,
  lookupTarget: string,
  lookupField: string,
  lookupDisplayField: string,
): Promise<ActionResponse<LookupMap>> {
  try {
    await requirePermission(PERMISSIONS.DATA_IMPORT_MANAGE);

    const lookupMap = await getLookupMapForEntity(
      lookupTarget,
      lookupField,
      lookupDisplayField,
    );

    return {
      success: true,
      data: lookupMap,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getSingleLookupMapAction" },
      "Failed to fetch lookup map",
    );
  }
}

/**
 * Validate that a lookup value exists
 *
 * @param entityName - Entity to lookup in
 * @param lookupField - Field to lookup by
 * @param value - Value to validate
 */
export async function validateLookupValueAction(
  entityName: string,
  lookupField: string,
  value: string,
): Promise<
  ActionResponse<{ exists: boolean; id?: string; displayValue?: string }>
> {
  try {
    await requirePermission(PERMISSIONS.DATA_IMPORT_MANAGE);

    const lookupMap = await getLookupMapForEntity(
      entityName,
      lookupField,
      "name", // Use name as default display field
    );

    const normalizedValue = normalizeLookupKey(value);
    const id = lookupMap.entries.get(normalizedValue);

    return {
      success: true,
      data: {
        exists: !!id,
        id,
        displayValue: id ? lookupMap.reverseEntries.get(id) : undefined,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "validateLookupValueAction" },
      "Failed to validate lookup value",
    );
  }
}
