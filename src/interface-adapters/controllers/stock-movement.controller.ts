/**
 * StockMovement Controller
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer, resolve } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateStockMovementSchema,
  StockMovementIdSchema,
  ListStockMovementsSchema,
  type CreateStockMovementDTO,
  type ListStockMovementsDTO,
} from "../dtos/generated/stock-movement.dto";
import {
  presentStockMovement,
  presentStockMovements,
  type StockMovementDTO,
  type StockMovementEnrichment,
} from "../presenters/stock-movement.presenter";
import type {
  CreateStockMovementUseCase,
  ListStockMovementsUseCase,
  GetStockMovementUseCase,
  DeleteStockMovementUseCase,
} from "@/core/use-cases/inventory/stock-movement";
import type { ListStockLocationsUseCase } from "@/core/use-cases/inventory/stock-location";
import type { ListAssetsUseCase } from "@/core/use-cases/asset/asset";
import type { ListPeopleUseCase } from "@/core/use-cases/foundation/person";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import type { StockMovement } from "@/core/domain/entities/stock-movement.entity";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

/**
 * Enrich stock movements with location names, asset tags, and person names
 */
async function enrichStockMovements(
  movements: StockMovement[],
): Promise<Map<string, StockMovementEnrichment>> {
  if (movements.length === 0) {
    return new Map();
  }

  const container = getContainer();

  // Collect unique IDs
  const stockLocationIds = [
    ...new Set(
      movements
        .flatMap((m) => [m.stockLocationFromId, m.stockLocationToId])
        .filter((id): id is string => id !== null),
    ),
  ];
  const assetIds = [
    ...new Set(
      movements.map((m) => m.assetId).filter((id): id is string => id !== null),
    ),
  ];
  const personIds = [...new Set(movements.map((m) => m.performedById))];

  // Fetch all entities in parallel
  const [stockLocationsMap, assetsMap, personsMap]: [
    Map<string, string>,
    Map<string, string>,
    Map<string, string>,
  ] = await Promise.all([
    // Stock Locations
    (async () => {
      if (stockLocationIds.length === 0) return new Map<string, string>();
      const useCase = container.get<ListStockLocationsUseCase>(
        DI_TOKENS.ListStockLocationsUseCase,
      );
      const stockLocations = await useCase.execute();
      return new Map(
        stockLocations
          .filter((sl) => stockLocationIds.includes(sl.id))
          .map((sl) => [sl.id, sl.name]),
      );
    })(),
    // Assets
    (async () => {
      if (assetIds.length === 0) return new Map<string, string>();
      const useCase = container.get<ListAssetsUseCase>(
        DI_TOKENS.ListAssetsUseCase,
      );
      const assets = await useCase.execute({});
      return new Map(
        assets
          .filter((a) => assetIds.includes(a.id))
          .map((a) => [a.id, a.assetTag]),
      );
    })(),
    // Persons (performed by)
    (async () => {
      if (personIds.length === 0) return new Map<string, string>();
      const useCase = container.get<ListPeopleUseCase>(
        DI_TOKENS.ListPersonsUseCase,
      );
      const persons = await useCase.execute();
      return new Map(
        persons
          .filter((p) => personIds.includes(p.id))
          .map((p) => [p.id, p.fullName]),
      );
    })(),
  ]);

  // Build enrichment map
  const enrichmentMap = new Map<string, StockMovementEnrichment>();
  for (const movement of movements) {
    enrichmentMap.set(movement.id, {
      stockLocationFromName: movement.stockLocationFromId
        ? stockLocationsMap.get(movement.stockLocationFromId)
        : null,
      stockLocationToName: movement.stockLocationToId
        ? stockLocationsMap.get(movement.stockLocationToId)
        : null,
      assetTag: movement.assetId ? assetsMap.get(movement.assetId) : null,
      performedByName: personsMap.get(movement.performedById),
    });
  }

  return enrichmentMap;
}

export async function createStockMovementAction(
  data: CreateStockMovementDTO,
): Promise<ActionResponse<StockMovementDTO>> {
  try {
    await requirePermission(PERMISSIONS.STOCK_MOVEMENTS_CREATE);

    const validated = CreateStockMovementSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<CreateStockMovementUseCase>(
      DI_TOKENS.CreateStockMovementUseCase,
    );

    const movement = await useCase.execute({
      movementType: validated.movementType,
      stockLocationFromId: validated.stockLocationFromId ?? undefined,
      stockLocationToId: validated.stockLocationToId ?? undefined,
      assetId: validated.assetId ?? undefined,
      quantity: validated.quantity,
      reason: validated.reason ?? undefined,
      performedById: validated.performedById,
      occurredAt: validated.occurredAt,
    });

    // Get asset tag for revalidation if asset is associated
    if (validated.assetId) {
      const container = getContainer();
      const assetRepo = container.get<IAssetRepository>(
        DI_TOKENS.IAssetRepository,
      );
      const asset = await assetRepo.findById(validated.assetId);
      if (asset) {
        revalidatePath(`/assets/${asset.assetTag}`);
      }
    }

    revalidatePath("/stock-movements");

    return {
      success: true,
      data: presentStockMovement(movement),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createStockMovementAction" },
      "Failed to create stock movement",
    );
  }
}

export async function listStockMovementsAction(
  options?: ListStockMovementsDTO,
): Promise<ActionResponse<StockMovementDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.STOCK_MOVEMENTS_VIEW);

    const validated = options
      ? ListStockMovementsSchema.parse(options)
      : undefined;

    const container = getContainer();
    const useCase = container.get<ListStockMovementsUseCase>(
      DI_TOKENS.ListStockMovementsUseCase,
    );

    const movements = await useCase.execute(validated);

    // Enrich with location names, asset tags, and person names
    const enrichmentMap = await enrichStockMovements(movements);

    return {
      success: true,
      data: presentStockMovements(movements, enrichmentMap),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listStockMovementsAction" },
      "Failed to list stock movements",
    );
  }
}

export async function getStockMovementAction(
  id: string,
): Promise<ActionResponse<StockMovementDTO>> {
  try {
    await requirePermission(PERMISSIONS.STOCK_MOVEMENTS_VIEW);

    const validated = StockMovementIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<GetStockMovementUseCase>(
      DI_TOKENS.GetStockMovementUseCase,
    );

    const movement = await useCase.execute(validated.id);

    if (!movement) {
      return {
        success: false,
        error: "Stock movement not found",
      };
    }

    return {
      success: true,
      data: presentStockMovement(movement),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getStockMovementAction", id },
      "Failed to get stock movement",
    );
  }
}

export async function deleteStockMovementAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.STOCK_MOVEMENTS_DELETE);

    const validated = StockMovementIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<DeleteStockMovementUseCase>(
      DI_TOKENS.DeleteStockMovementUseCase,
    );

    await useCase.execute(validated.id);

    revalidatePath("/stock-movements");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteStockMovementAction", id },
      "Failed to delete stock movement",
    );
  }
}

export async function bulkCreateStockMovementsAction(
  items: CreateStockMovementDTO[],
): Promise<
  ActionResponse<{
    successCount: number;
    failureCount: number;
    failures: Array<{ index: number; movementType: string; error: string }>;
  }>
> {
  try {
    await requirePermission(PERMISSIONS.STOCK_MOVEMENTS_CREATE);

    const useCase = resolve<CreateStockMovementUseCase>(
      DI_TOKENS.CreateStockMovementUseCase,
    );

    const results = {
      successCount: 0,
      failureCount: 0,
      failures: [] as Array<{
        index: number;
        movementType: string;
        error: string;
      }>,
    };

    // Process items sequentially to avoid overwhelming the database
    for (let i = 0; i < items.length; i++) {
      const itemData = items[i];
      try {
        const validated = CreateStockMovementSchema.parse(itemData);

        await useCase.execute({
          movementType: validated.movementType,
          stockLocationFromId: validated.stockLocationFromId ?? undefined,
          stockLocationToId: validated.stockLocationToId ?? undefined,
          assetId: validated.assetId ?? undefined,
          quantity: validated.quantity,
          reason: validated.reason ?? undefined,
          performedById: validated.performedById,
          occurredAt: validated.occurredAt,
        });

        results.successCount++;
      } catch (error) {
        results.failureCount++;
        results.failures.push({
          index: i,
          movementType: itemData.movementType || "Unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    revalidatePath("/stock-movements");

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "bulkCreateStockMovementsAction" },
      "Failed to bulk create stock movements",
    );
  }
}
