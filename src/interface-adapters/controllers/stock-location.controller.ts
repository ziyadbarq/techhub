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
