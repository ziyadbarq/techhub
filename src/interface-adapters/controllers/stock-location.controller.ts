/**
 * StockLocation Controller
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateStockLocationSchema,
  UpdateStockLocationSchema,
  StockLocationIdSchema,
  type CreateStockLocationDTO,
  type UpdateStockLocationDTO,
} from "../dtos/generated/stock-location.dto";
import {
  presentStockLocation,
  presentStockLocations,
  type StockLocationDTO,
} from "../presenters/stock-location.presenter";
import type {
  CreateStockLocationUseCase,
  ListStockLocationsUseCase,
  GetStockLocationUseCase,
  UpdateStockLocationUseCase,
  DeleteStockLocationUseCase,
} from "@/core/use-cases/inventory/stock-location";
import type { IStockLocationRepository } from "@/core/repositories/stock-location.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export async function createStockLocationAction(
  data: CreateStockLocationDTO,
): Promise<ActionResponse<StockLocationDTO>> {
  try {
    await requirePermission(PERMISSIONS.STOCK_LOCATIONS_CREATE);

    const validated = CreateStockLocationSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<CreateStockLocationUseCase>(
      DI_TOKENS.CreateStockLocationUseCase,
    );

    const stockLocation = await useCase.execute({
      name: validated.name,
      code: validated.code,
      locationId: validated.locationId ?? undefined,
      description: validated.description ?? undefined,
    });

    revalidatePath("/stock-locations");

    return {
      success: true,
      data: presentStockLocation(stockLocation),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createStockLocationAction" },
      "Failed to create stock location",
    );
  }
}

export async function listStockLocationsAction(): Promise<
  ActionResponse<StockLocationDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.STOCK_LOCATIONS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListStockLocationsUseCase>(
      DI_TOKENS.ListStockLocationsUseCase,
    );

    const stockLocations = await useCase.execute();

    return {
      success: true,
      data: presentStockLocations(stockLocations),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listStockLocationsAction" },
      "Failed to list stock locations",
    );
  }
}

export async function getStockLocationAction(
  id: string,
): Promise<ActionResponse<StockLocationDTO>> {
  try {
    await requirePermission(PERMISSIONS.STOCK_LOCATIONS_VIEW);

    const validated = StockLocationIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<GetStockLocationUseCase>(
      DI_TOKENS.GetStockLocationUseCase,
    );

    const stockLocation = await useCase.execute(validated.id);

    if (!stockLocation) {
      return {
        success: false,
        error: "Stock location not found",
      };
    }

    return {
      success: true,
      data: presentStockLocation(stockLocation),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getStockLocationAction", id },
      "Failed to get stock location",
    );
  }
}

export async function updateStockLocationAction(
  id: string,
  data: UpdateStockLocationDTO,
): Promise<ActionResponse<StockLocationDTO>> {
  try {
    await requirePermission(PERMISSIONS.STOCK_LOCATIONS_UPDATE);

    const validatedId = StockLocationIdSchema.parse({ id });
    const validated = UpdateStockLocationSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateStockLocationUseCase>(
      DI_TOKENS.UpdateStockLocationUseCase,
    );

    const stockLocation = await useCase.execute({
      id: validatedId.id,
      name: validated.name,
      code: validated.code,
      locationId: validated.locationId,
      description: validated.description,
    });

    revalidatePath("/stock-locations");
    revalidatePath(`/stock-locations/${id}`);

    return {
      success: true,
      data: presentStockLocation(stockLocation),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateStockLocationAction", id },
      "Failed to update stock location",
    );
  }
}

export async function deleteStockLocationAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.STOCK_LOCATIONS_DELETE);

    const validated = StockLocationIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<DeleteStockLocationUseCase>(
      DI_TOKENS.DeleteStockLocationUseCase,
    );

    await useCase.execute(validated.id);

    revalidatePath("/stock-locations");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteStockLocationAction", id },
      "Failed to delete stock location",
    );
  }
}

export async function bulkCreateStockLocationsAction(
  itemsData: CreateStockLocationDTO[],
): Promise<
  ActionResponse<{
    successCount: number;
    failureCount: number;
    failures: Array<{ index: number; code: string; error: string }>;
  }>
> {
  try {
    await requirePermission(PERMISSIONS.STOCK_LOCATIONS_CREATE);

    const container = getContainer();
    const useCase = container.get<CreateStockLocationUseCase>(
      DI_TOKENS.CreateStockLocationUseCase,
    );

    const results = {
      successCount: 0,
      failureCount: 0,
      failures: [] as Array<{ index: number; code: string; error: string }>,
    };

    // Process stock locations sequentially to avoid overwhelming the database
    for (let i = 0; i < itemsData.length; i++) {
      const itemData = itemsData[i];
      try {
        const validated = CreateStockLocationSchema.parse(itemData);

        await useCase.execute({
          name: validated.name,
          code: validated.code,
          locationId: validated.locationId ?? undefined,
          description: validated.description ?? undefined,
        });

        results.successCount++;
      } catch (error) {
        results.failureCount++;
        results.failures.push({
          index: i,
          code: itemData.code || "Unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    revalidatePath("/stock-locations");

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "bulkCreateStockLocationsAction" },
      "Failed to bulk create stock locations",
    );
  }
}

/**
 * Check for existing stock locations by code (batch lookup for duplicate detection)
 */
export async function checkStockLocationDuplicatesAction(
  codes: string[],
): Promise<{
  success: boolean;
  data?: {
    duplicates: Array<{ id: string; code: string; name: string }>;
    duplicateCount: number;
  };
  error?: string;
}> {
  try {
    await requirePermission(PERMISSIONS.STOCK_LOCATIONS_CREATE);

    const container = getContainer();
    const repository = container.get<IStockLocationRepository>(
      DI_TOKENS.IStockLocationRepository,
    );

    const validCodes = codes.filter(
      (c) => c !== null && c !== undefined && c.trim() !== "",
    );

    if (validCodes.length === 0) {
      return { success: true, data: { duplicates: [], duplicateCount: 0 } };
    }

    const existingLocations = await repository.findByCodes(validCodes);

    const duplicates = existingLocations.map((location) => ({
      id: location.id,
      code: location.code,
      name: location.name,
    }));

    return {
      success: true,
      data: { duplicates, duplicateCount: duplicates.length },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to check duplicates",
    };
  }
}

/**
 * Bulk upsert stock locations (create or update based on duplicate strategy)
 */
export async function bulkUpsertStockLocationsAction(
  locationsData: Record<string, unknown>[],
  strategy: "skip" | "overwrite" | "fail" | "append",
): Promise<{
  success: boolean;
  data?: {
    createdCount: number;
    updatedCount: number;
    skipCount: number;
    failureCount: number;
    created?: Array<{ code: string; name: string }>;
    updated?: Array<{ code: string; name: string }>;
    skipped?: Array<{ identifier: string; reason: string }>;
    failures?: Array<{ index: number; identifier: string; error: string }>;
  };
  error?: string;
}> {
  try {
    await requirePermission(PERMISSIONS.STOCK_LOCATIONS_CREATE);

    const container = getContainer();
    const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);
    const repository = container.get<IStockLocationRepository>(
      DI_TOKENS.IStockLocationRepository,
    );
    const createUseCase = container.get<CreateStockLocationUseCase>(
      DI_TOKENS.CreateStockLocationUseCase,
    );
    const updateUseCase = container.get<UpdateStockLocationUseCase>(
      DI_TOKENS.UpdateStockLocationUseCase,
    );

    const log = logger.child({
      controller: "stockLocation.bulkUpsert",
      rows: locationsData.length,
      strategy,
    });
    log.info("Bulk stock location upsert started");

    const results = {
      createdCount: 0,
      updatedCount: 0,
      skipCount: 0,
      failureCount: 0,
      created: [] as Array<{ code: string; name: string }>,
      updated: [] as Array<{ code: string; name: string }>,
      skipped: [] as Array<{ identifier: string; reason: string }>,
      failures: [] as Array<{
        index: number;
        identifier: string;
        error: string;
      }>,
    };

    const codes = locationsData
      .map((l) => l.code as string | undefined)
      .filter((c): c is string => !!c && c.trim() !== "");

    const existingLocations = await repository.findByCodes(codes);
    const existingByCode = new Map(
      existingLocations.map((l) => [l.code.toUpperCase(), l]),
    );

    for (let i = 0; i < locationsData.length; i++) {
      const locationData = locationsData[i];
      const identifier =
        (locationData.code as string) ||
        (locationData.name as string) ||
        `Row ${i + 1}`;

      try {
        const validated = CreateStockLocationSchema.parse(locationData);
        const existingLocation = validated.code
          ? existingByCode.get(validated.code.toUpperCase())
          : null;

        if (existingLocation) {
          switch (strategy) {
            case "skip":
              results.skipCount++;
              results.skipped.push({
                identifier,
                reason: `Code "${validated.code}" already exists`,
              });
              break;
            case "overwrite": {
              await updateUseCase.execute({
                id: existingLocation.id,
                name: validated.name || undefined,
                description: validated.description ?? undefined,
                locationId: validated.locationId ?? undefined,
              });
              results.updatedCount++;
              results.updated.push({
                code: existingLocation.code,
                name: validated.name,
              });
              break;
            }
            case "fail":
              results.failureCount++;
              results.failures.push({
                index: i,
                identifier,
                error: `Duplicate code "${validated.code}" not allowed`,
              });
              break;
            case "append": {
              const modifiedCode = `${validated.code}-COPY-${Date.now()}`;
              await createUseCase.execute({
                name: validated.name,
                code: modifiedCode,
                description: validated.description ?? undefined,
                locationId: validated.locationId ?? undefined,
              });
              results.createdCount++;
              results.created.push({
                code: modifiedCode,
                name: validated.name,
              });
              break;
            }
          }
        } else {
          await createUseCase.execute({
            name: validated.name,
            code: validated.code,
            description: validated.description ?? undefined,
            locationId: validated.locationId ?? undefined,
          });
          results.createdCount++;
          results.created.push({
            code: validated.code || "AUTO",
            name: validated.name,
          });
        }
      } catch (error) {
        results.failureCount++;
        results.failures.push({
          index: i,
          identifier,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    revalidatePath("/stock-locations");
    log.info("Bulk stock location upsert completed", results);

    return { success: true, data: results };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to bulk upsert stock locations",
    };
  }
}
