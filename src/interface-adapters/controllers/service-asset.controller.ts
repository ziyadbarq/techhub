/**
 * Service Asset Controller
 *
 * Server actions for Service-Asset Relationship Management
 */

"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getContainer, ensureModuleLoaded } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import { LinkServiceToAssetSchema } from "../dtos/generated/service.dto";
import {
  presentServiceAssetList,
  type ServiceAssetDTO,
} from "../presenters/service.presenter";
import type {
  LinkServiceToAssetUseCase,
  UnlinkServiceFromAssetUseCase,
  GetServiceAssetsUseCase,
  GetAssetServicesUseCase,
} from "@/core/use-cases/service-asset";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

// ==================== Service Asset Linking ====================

export async function linkServiceToAssetAction(
  data: z.infer<typeof LinkServiceToAssetSchema>,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_MANAGE);

    // Ensure Service module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("service");

    const validated = LinkServiceToAssetSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<LinkServiceToAssetUseCase>(
      DI_TOKENS.LinkServiceToAssetUseCase,
    );

    await useCase.execute({
      serviceId: validated.serviceId,
      assetId: validated.assetId || "",
      relationship: validated.relationship,
      description: validated.description ?? undefined,
    });

    revalidatePath("/services");
    revalidatePath(`/services/${validated.serviceId}`);
    if (validated.assetId) {
      revalidatePath(`/assets/${validated.assetId}`);
    }

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "linkServiceToAssetAction" },
      "Failed to link service to asset",
    );
  }
}

export async function unlinkServiceFromAssetAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_MANAGE);

    // Ensure Service module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("service");

    const container = getContainer();
    const useCase = container.get<UnlinkServiceFromAssetUseCase>(
      DI_TOKENS.UnlinkServiceFromAssetUseCase,
    );

    await useCase.execute({ serviceAssetId: id });

    revalidatePath("/services");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "unlinkServiceFromAssetAction", id },
      "Failed to unlink service from asset",
    );
  }
}

export async function getServiceAssetsAction(
  serviceId: string,
): Promise<ActionResponse<ServiceAssetDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_VIEW);

    // Ensure Service module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("service");

    const container = getContainer();
    const useCase = container.get<GetServiceAssetsUseCase>(
      DI_TOKENS.GetServiceAssetsUseCase,
    );

    const serviceAssets = await useCase.execute({ serviceId });

    return {
      success: true,
      data: presentServiceAssetList(serviceAssets),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getServiceAssetsAction", serviceId },
      "Failed to get service assets",
    );
  }
}

export async function getAssetServicesAction(
  assetId: string,
): Promise<ActionResponse<ServiceAssetDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_VIEW);

    // Ensure Service module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("service");

    const container = getContainer();
    const useCase = container.get<GetAssetServicesUseCase>(
      DI_TOKENS.GetAssetServicesUseCase,
    );

    const serviceAssets = await useCase.execute({ assetId });

    return {
      success: true,
      data: presentServiceAssetList(serviceAssets),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getAssetServicesAction", assetId },
      "Failed to get asset services",
    );
  }
}
