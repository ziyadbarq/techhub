/**
 * Asset Kit Checkout Controller
 *
 * Server actions for Asset Kit Checkout Management
 */

"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateKitCheckoutDTO,
  ReturnKitCheckoutDTO,
  ReturnKitItemDTO,
  MarkItemDamagedDTO,
  MarkItemLostDTO,
  ExtendCheckoutDTO,
  type AssetKitCheckoutDTO,
} from "../dtos/generated/asset-kit-checkout.dto";
import {
  AssetKitCheckoutPresenter,
  type AssetKitCheckoutEnrichment,
} from "../presenters/asset-kit-checkout.presenter";
import type {
  CreateKitCheckoutUseCase,
  GetKitCheckoutUseCase,
  ListKitCheckoutsUseCase,
  ReturnKitCheckoutUseCase,
  ReturnKitItemUseCase,
  MarkItemDamagedUseCase,
  MarkItemLostUseCase,
  ExtendCheckoutUseCase,
  ListOverdueCheckoutsUseCase,
  CheckKitAvailabilityUseCase,
  ListAssetKitsUseCase,
} from "@/core/use-cases/asset-kits";
import type { ListPeopleUseCase } from "@/core/use-cases/foundation/person";
import type { AssetKitCheckout } from "@/core/domain/entities/asset-kit-checkout.entity";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

/**
 * Enrich kit checkouts with kit names and person names
 */
async function enrichKitCheckouts(
  checkouts: AssetKitCheckout[],
): Promise<Map<string, AssetKitCheckoutEnrichment>> {
  if (checkouts.length === 0) {
    return new Map();
  }

  const container = getContainer();

  // Collect unique IDs (assigneeId for PERSON assigneeType)
  const kitIds = [...new Set(checkouts.map((c) => c.assetKitId))];
  const personIds = [
    ...new Set(
      checkouts
        .filter((c) => c.assigneeType === "PERSON")
        .map((c) => c.assigneeId),
    ),
  ];

  // Fetch kits and persons in parallel
  const [kitsMap, personsMap] = await Promise.all([
    (async () => {
      if (kitIds.length === 0) return new Map<string, string>();

      const useCase = container.get<ListAssetKitsUseCase>(
        DI_TOKENS.ListAssetKitsUseCase,
      );
      const result = await useCase.execute({});

      return new Map(
        result.kits
          .filter((k) => kitIds.includes(k.id))
          .map((k) => [k.id, k.name]),
      );
    })(),
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
  const enrichmentMap = new Map<string, AssetKitCheckoutEnrichment>();
  for (const checkout of checkouts) {
    enrichmentMap.set(checkout.id, {
      kitName: kitsMap.get(checkout.assetKitId),
      personName:
        checkout.assigneeType === "PERSON"
          ? personsMap.get(checkout.assigneeId)
          : undefined,
    });
  }

  return enrichmentMap;
}

// ==================== Kit Checkout Management ====================

export async function createKitCheckoutAction(
  data: z.infer<typeof CreateKitCheckoutDTO>,
): Promise<ActionResponse<AssetKitCheckoutDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_CHECKOUT);

    const validated = CreateKitCheckoutDTO.parse(data);

    const container = getContainer();
    const useCase = container.get<CreateKitCheckoutUseCase>(
      DI_TOKENS.CreateKitCheckoutUseCase,
    );

    const checkout = await useCase.execute({
      kitId: validated.kitId,
      assignedToPersonId: validated.assignedToPersonId,
      assignedToOrgUnitId: validated.assignedToOrgUnitId,
      checkoutDate: validated.checkoutDate,
      expectedReturnDate: validated.expectedReturnDate,
      purpose: validated.purpose,
      assetIds: validated.assetIds,
    });

    revalidatePath("/asset-kits/checkouts");

    return {
      success: true,
      data: AssetKitCheckoutPresenter.toDTO(checkout),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createKitCheckoutAction" },
      "Failed to create kit checkout",
    );
  }
}

export async function listKitCheckoutsAction(): Promise<
  ActionResponse<AssetKitCheckoutDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListKitCheckoutsUseCase>(
      DI_TOKENS.ListKitCheckoutsUseCase,
    );

    const result = await useCase.execute({});

    // Enrich with kit and person names
    const enrichmentMap = await enrichKitCheckouts(result.checkouts);

    return {
      success: true,
      data: AssetKitCheckoutPresenter.toDTOList(
        result.checkouts,
        enrichmentMap,
      ),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listKitCheckoutsAction" },
      "Failed to list kit checkouts",
    );
  }
}

export async function getKitCheckoutAction(
  id: string,
): Promise<ActionResponse<AssetKitCheckoutDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const container = getContainer();
    const useCase = container.get<GetKitCheckoutUseCase>(
      DI_TOKENS.GetKitCheckoutUseCase,
    );

    const checkout = await useCase.execute({ checkoutId: id });

    return {
      success: true,
      data: AssetKitCheckoutPresenter.toDTO(checkout),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getKitCheckoutAction", id },
      "Failed to get kit checkout",
    );
  }
}

export async function returnKitCheckoutAction(
  data: z.infer<typeof ReturnKitCheckoutDTO>,
): Promise<ActionResponse<AssetKitCheckoutDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_CHECKOUT);

    const validated = ReturnKitCheckoutDTO.parse(data);

    const container = getContainer();
    const useCase = container.get<ReturnKitCheckoutUseCase>(
      DI_TOKENS.ReturnKitCheckoutUseCase,
    );

    const checkout = await useCase.execute({
      checkoutId: validated.checkoutId,
      returnDate: validated.returnDate,
    });

    revalidatePath("/asset-kits/checkouts");
    revalidatePath(`/asset-kits/checkouts/${validated.checkoutId}`);

    return {
      success: true,
      data: AssetKitCheckoutPresenter.toDTO(checkout),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "returnKitCheckoutAction" },
      "Failed to return kit checkout",
    );
  }
}

export async function returnKitItemAction(
  data: z.infer<typeof ReturnKitItemDTO>,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_CHECKOUT);

    const validated = ReturnKitItemDTO.parse(data);

    const container = getContainer();
    const useCase = container.get<ReturnKitItemUseCase>(
      DI_TOKENS.ReturnKitItemUseCase,
    );

    await useCase.execute({
      checkoutItemId: validated.checkoutItemId,
      conditionAtReturn: validated.conditionAtReturn,
    });

    revalidatePath("/asset-kits/checkouts");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "returnKitItemAction" },
      "Failed to return kit item",
    );
  }
}

export async function markItemDamagedAction(
  data: z.infer<typeof MarkItemDamagedDTO>,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_UPDATE);

    const validated = MarkItemDamagedDTO.parse(data);

    const container = getContainer();
    const useCase = container.get<MarkItemDamagedUseCase>(
      DI_TOKENS.MarkItemDamagedUseCase,
    );

    await useCase.execute({
      checkoutItemId: validated.checkoutItemId,
      conditionDescription: validated.conditionDescription,
    });

    revalidatePath("/asset-kits/checkouts");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "markItemDamagedAction" },
      "Failed to mark item as damaged",
    );
  }
}

export async function markItemLostAction(
  data: z.infer<typeof MarkItemLostDTO>,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_UPDATE);

    const validated = MarkItemLostDTO.parse(data);

    const container = getContainer();
    const useCase = container.get<MarkItemLostUseCase>(
      DI_TOKENS.MarkItemLostUseCase,
    );

    await useCase.execute({
      checkoutItemId: validated.checkoutItemId,
      notes: validated.notes,
    });

    revalidatePath("/asset-kits/checkouts");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "markItemLostAction" },
      "Failed to mark item as lost",
    );
  }
}

export async function extendCheckoutAction(
  data: z.infer<typeof ExtendCheckoutDTO>,
): Promise<ActionResponse<AssetKitCheckoutDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_CHECKOUT);

    const validated = ExtendCheckoutDTO.parse(data);

    const container = getContainer();
    const useCase = container.get<ExtendCheckoutUseCase>(
      DI_TOKENS.ExtendCheckoutUseCase,
    );

    const checkout = await useCase.execute({
      checkoutId: validated.checkoutId,
      newExpectedReturnDate: validated.newExpectedReturnDate,
    });

    revalidatePath("/asset-kits/checkouts");
    revalidatePath(`/asset-kits/checkouts/${validated.checkoutId}`);

    return {
      success: true,
      data: AssetKitCheckoutPresenter.toDTO(checkout),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "extendCheckoutAction" },
      "Failed to extend checkout",
    );
  }
}

export async function listOverdueCheckoutsAction(): Promise<
  ActionResponse<AssetKitCheckoutDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListOverdueCheckoutsUseCase>(
      DI_TOKENS.ListOverdueCheckoutsUseCase,
    );

    const result = await useCase.execute();

    return {
      success: true,
      data: AssetKitCheckoutPresenter.toDTOList(result.checkouts),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listOverdueCheckoutsAction" },
      "Failed to list overdue checkouts",
    );
  }
}

export async function checkKitAvailabilityAction(
  kitId: string,
  startDate: Date,
  endDate: Date,
): Promise<
  ActionResponse<{
    isAvailable: boolean;
    requiredQuantity: number;
    availableQuantity: number;
  }>
> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const container = getContainer();
    const useCase = container.get<CheckKitAvailabilityUseCase>(
      DI_TOKENS.CheckKitAvailabilityUseCase,
    );

    const result = await useCase.execute({
      kitId,
      startDate,
      endDate,
    });

    return {
      success: true,
      data: {
        isAvailable: result.isAvailable,
        requiredQuantity: result.requiredQuantity,
        availableQuantity: result.availableQuantity,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "checkKitAvailabilityAction", kitId },
      "Failed to check kit availability",
    );
  }
}
