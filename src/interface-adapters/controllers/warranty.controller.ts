/**
 * Warranty Controller
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateWarrantySchema,
  UpdateWarrantySchema,
  WarrantyFilterSchema,
  type CreateWarrantyDTO,
  type UpdateWarrantyDTO,
  type WarrantyFilterDTO,
} from "../dtos/generated/warranty.dto";
import {
  presentWarranty,
  type WarrantyDTO,
} from "../presenters/warranty.presenter";
import type {
  CreateWarrantyUseCase,
  UpdateWarrantyUseCase,
  DeleteWarrantyUseCase,
  GetWarrantyUseCase,
  ListWarrantiesUseCase,
  ListWarrantiesByAssetUseCase,
  GetActiveWarrantyForAssetUseCase,
  ListExpiringWarrantiesUseCase,
} from "@/core/use-cases/asset/warranty";
import type { BulkCreateResult } from "./types";
import type { Warranty } from "@/core/domain/entities/warranty.entity";
import type { ListAssetsUseCase } from "@/core/use-cases/asset/asset";
import type { ListVendorsUseCase } from "@/core/use-cases/foundation/vendor";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import type { IStockMovementRepository } from "@/core/repositories/stock-movement.repository.interface";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export interface WarrantyAssetOptionDTO {
  id: string;
  assetTag: string;
  receivedDate: string | null;
  stockLocationName?: string | null;
}

/**
 * Enrich warranties with asset and vendor display data
 */
async function enrichWarranties(
  warranties: Warranty[],
): Promise<WarrantyDTO[]> {
  if (warranties.length === 0) {
    return [];
  }

  const container = getContainer();

  // Collect unique asset and vendor IDs
  const assetIds = [...new Set(warranties.map((w) => w.assetId))];
  const vendorIds = [
    ...new Set(
      warranties
        .map((w) => w.vendorId)
        .filter((id): id is string => id !== null),
    ),
  ];

  // Fetch assets and vendors in parallel
  const [assetsMap, vendorsMap] = await Promise.all([
    (async () => {
      const listAssetsUseCase = container.get<ListAssetsUseCase>(
        DI_TOKENS.ListAssetsUseCase,
      );
      const assets = await listAssetsUseCase.execute();

      return new Map(
        assets
          .filter((a) => assetIds.includes(a.id))
          .map((a) => [a.id, { assetTag: a.assetTag }]),
      );
    })(),
    (async () => {
      if (vendorIds.length === 0) return new Map();

      const listVendorsUseCase = container.get<ListVendorsUseCase>(
        DI_TOKENS.ListVendorsUseCase,
      );
      const vendors = await listVendorsUseCase.execute();

      return new Map(
        vendors
          .filter((v) => vendorIds.includes(v.id))
          .map((v) => [v.id, v.name]),
      );
    })(),
  ]);

  // Present warranties with enrichment data
  return warranties.map((warranty) => {
    const asset = assetsMap.get(warranty.assetId);
    const vendorName = warranty.vendorId
      ? vendorsMap.get(warranty.vendorId)
      : null;

    return presentWarranty(warranty, {
      assetTag: asset?.assetTag || null,
      vendorName: vendorName || null,
    });
  });
}

export async function createWarrantyAction(
  data: CreateWarrantyDTO,
): Promise<ActionResponse<WarrantyDTO>> {
  try {
    await requirePermission(PERMISSIONS.WARRANTIES_CREATE);

    const validated = CreateWarrantySchema.parse(data);

    const container = getContainer();
    const useCase = container.get<CreateWarrantyUseCase>(
      DI_TOKENS.CreateWarrantyUseCase,
    );

    const warranty = await useCase.execute({
      assetId: validated.assetId,
      vendorId: validated.vendorId ?? undefined,
      coverageType: validated.coverageType,
      coverageDetails: validated.coverageDetails ?? undefined,
      policyReference: validated.policyReference ?? undefined,
      slaDetails: validated.slaDetails ?? undefined,
      // Honor the start date the user submitted. The form defaults it to the
      // asset's received date on asset-select and lets the user override —
      // an earlier server-side re-derivation silently discarded that value.
      startDate: validated.startDate,
      endDate: validated.endDate,
      cost: validated.cost ?? undefined,
      currency: validated.currency ?? undefined,
      note: validated.note ?? undefined,
      metadata: validated.metadata ?? undefined,
    });

    // Get asset tag for revalidation
    const assetRepo = container.get<IAssetRepository>(
      DI_TOKENS.IAssetRepository,
    );
    const asset = await assetRepo.findById(validated.assetId);

    revalidatePath("/warranties");
    if (asset) {
      revalidatePath(`/assets/${asset.assetTag}`);
    }

    return {
      success: true,
      data: presentWarranty(warranty),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createWarrantyAction" },
      "Failed to create warranty",
    );
  }
}

export async function listWarrantyAssetOptionsAction(): Promise<
  ActionResponse<WarrantyAssetOptionDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.WARRANTIES_CREATE);
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const container = getContainer();
    const listAssetsUseCase = container.get<ListAssetsUseCase>(
      DI_TOKENS.ListAssetsUseCase,
    );
    const stockMovementRepository = container.get<IStockMovementRepository>(
      DI_TOKENS.IStockMovementRepository,
    );

    const [assets, receivingMovements] = await Promise.all([
      listAssetsUseCase.execute(),
      stockMovementRepository.findAll({
        movementType: "IN",
        orderBy: "occurredAt",
        order: "asc",
      }),
    ]);

    const firstReceivedByAssetId = new Map<string, Date>();
    for (const movement of receivingMovements) {
      if (movement.assetId && !firstReceivedByAssetId.has(movement.assetId)) {
        firstReceivedByAssetId.set(movement.assetId, movement.occurredAt);
      }
    }

    return {
      success: true,
      data: assets.map((asset) => ({
        id: asset.id,
        assetTag: asset.assetTag,
        receivedDate: (
          firstReceivedByAssetId.get(asset.id) ??
          asset.purchaseDate ??
          asset.createdAt
        ).toISOString(),
      })),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listWarrantyAssetOptionsAction" },
      "Failed to list warranty asset options",
    );
  }
}

export async function listWarrantiesAction(
  filterOptions?: WarrantyFilterDTO,
): Promise<ActionResponse<{ warranties: WarrantyDTO[]; total: number }>> {
  try {
    await requirePermission(PERMISSIONS.WARRANTIES_VIEW);

    const validated = filterOptions
      ? WarrantyFilterSchema.parse(filterOptions)
      : undefined;

    const container = getContainer();
    const useCase = container.get<ListWarrantiesUseCase>(
      DI_TOKENS.ListWarrantiesUseCase,
    );

    const result = await useCase.execute(validated);
    const enrichedWarranties = await enrichWarranties(result.warranties);

    return {
      success: true,
      data: {
        warranties: enrichedWarranties,
        total: result.total,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listWarrantiesAction" },
      "Failed to list warranties",
    );
  }
}

export async function getWarrantyAction(
  id: string,
): Promise<ActionResponse<WarrantyDTO>> {
  try {
    await requirePermission(PERMISSIONS.WARRANTIES_VIEW);

    const container = getContainer();
    const useCase = container.get<GetWarrantyUseCase>(
      DI_TOKENS.GetWarrantyUseCase,
    );

    const warranty = await useCase.execute(id);

    return {
      success: true,
      data: presentWarranty(warranty),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getWarrantyAction", id },
      "Failed to get warranty",
    );
  }
}

export async function updateWarrantyAction(
  id: string,
  data: UpdateWarrantyDTO,
): Promise<ActionResponse<WarrantyDTO>> {
  try {
    await requirePermission(PERMISSIONS.WARRANTIES_UPDATE);

    const validated = UpdateWarrantySchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateWarrantyUseCase>(
      DI_TOKENS.UpdateWarrantyUseCase,
    );

    const warranty = await useCase.execute({
      id,
      ...validated,
    });

    // Get asset tag for revalidation
    const assetRepo = container.get<IAssetRepository>(
      DI_TOKENS.IAssetRepository,
    );
    const asset = await assetRepo.findById(warranty.assetId);

    revalidatePath("/warranties");
    revalidatePath(`/warranties/${id}`);
    if (asset) {
      revalidatePath(`/assets/${asset.assetTag}`);
    }

    return {
      success: true,
      data: presentWarranty(warranty),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateWarrantyAction", id },
      "Failed to update warranty",
    );
  }
}

export async function deleteWarrantyAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.WARRANTIES_DELETE);

    const container = getContainer();

    // Get warranty first to know which asset to revalidate
    const getUseCase = container.get<GetWarrantyUseCase>(
      DI_TOKENS.GetWarrantyUseCase,
    );
    const warranty = await getUseCase.execute(id);

    // Get asset tag for revalidation
    const assetRepo = container.get<IAssetRepository>(
      DI_TOKENS.IAssetRepository,
    );
    const asset = await assetRepo.findById(warranty.assetId);

    const deleteUseCase = container.get<DeleteWarrantyUseCase>(
      DI_TOKENS.DeleteWarrantyUseCase,
    );
    await deleteUseCase.execute(id);

    revalidatePath("/warranties");
    if (asset) {
      revalidatePath(`/assets/${asset.assetTag}`);
    }

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteWarrantyAction", id },
      "Failed to delete warranty",
    );
  }
}

export async function listWarrantiesByAssetAction(
  assetId: string,
): Promise<ActionResponse<WarrantyDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.WARRANTIES_VIEW);

    const container = getContainer();
    const useCase = container.get<ListWarrantiesByAssetUseCase>(
      DI_TOKENS.ListWarrantiesByAssetUseCase,
    );

    const warranties = await useCase.execute(assetId);
    const enrichedWarranties = await enrichWarranties(warranties);

    return {
      success: true,
      data: enrichedWarranties,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listWarrantiesByAssetAction", assetId },
      "Failed to list warranties for asset",
    );
  }
}

export async function getActiveWarrantyForAssetAction(
  assetId: string,
): Promise<ActionResponse<WarrantyDTO | null>> {
  try {
    await requirePermission(PERMISSIONS.WARRANTIES_VIEW);

    const container = getContainer();
    const useCase = container.get<GetActiveWarrantyForAssetUseCase>(
      DI_TOKENS.GetActiveWarrantyForAssetUseCase,
    );

    const warranty = await useCase.execute(assetId);

    return {
      success: true,
      data: warranty ? presentWarranty(warranty) : null,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getActiveWarrantyForAssetAction", assetId },
      "Failed to get active warranty for asset",
    );
  }
}

export async function listExpiringWarrantiesAction(
  days: number = 30,
): Promise<ActionResponse<WarrantyDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.WARRANTIES_VIEW);

    const container = getContainer();
    const useCase = container.get<ListExpiringWarrantiesUseCase>(
      DI_TOKENS.ListExpiringWarrantiesUseCase,
    );

    const warranties = await useCase.execute(days);
    const enrichedWarranties = await enrichWarranties(warranties);

    return {
      success: true,
      data: enrichedWarranties,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listExpiringWarrantiesAction", days },
      "Failed to list expiring warranties",
    );
  }
}

export async function bulkCreateWarrantiesAction(
  items: CreateWarrantyDTO[],
): Promise<BulkCreateResult> {
  try {
    await requirePermission(PERMISSIONS.WARRANTIES_CREATE);

    const container = getContainer();
    const useCase = container.get<CreateWarrantyUseCase>(
      DI_TOKENS.CreateWarrantyUseCase,
    );

    const results = {
      success: true,
      successCount: 0,
      errorCount: 0,
      errors: [] as Array<{
        index: number;
        name: string;
        error: string;
      }>,
    };

    // Process items sequentially to avoid overwhelming the database
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const validated = CreateWarrantySchema.parse(item);

        await useCase.execute({
          assetId: validated.assetId,
          vendorId: validated.vendorId ?? undefined,
          coverageType: validated.coverageType ?? undefined,
          coverageDetails: validated.coverageDetails ?? undefined,
          policyReference: validated.policyReference ?? undefined,
          slaDetails: validated.slaDetails ?? undefined,
          startDate: validated.startDate,
          endDate: validated.endDate,
          cost: validated.cost ?? undefined,
          currency: validated.currency ?? undefined,
          note: validated.note ?? undefined,
          metadata: validated.metadata ?? undefined,
        });

        results.successCount++;
      } catch (error) {
        results.errorCount++;
        results.errors.push({
          index: i,
          name: item.assetId || "Unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    revalidatePath("/warranties");

    return results;
  } catch (_error) {
    return {
      success: false,
      successCount: 0,
      errorCount: 0,
      errors: [],
    };
  }
}
