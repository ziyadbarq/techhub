/**
 * Service Ownership Controller
 *
 * Server actions for Service Ownership Management
 */

"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  AddServiceOwnerSchema,
  RemoveServiceOwnerSchema,
  SetPrimaryOwnerSchema,
} from "../dtos/generated/service.dto";
import {
  presentServiceOwnerList,
  type ServiceOwnerDTO,
} from "../presenters/service.presenter";
import type {
  AddServiceOwnerUseCase,
  RemoveServiceOwnerUseCase,
  SetPrimaryOwnerUseCase,
  GetServiceOwnersUseCase,
} from "@/core/use-cases/service-ownership";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

// ==================== Service Ownership ====================

export async function addServiceOwnerAction(
  data: z.infer<typeof AddServiceOwnerSchema>,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_MANAGE);

    const validated = AddServiceOwnerSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<AddServiceOwnerUseCase>(
      DI_TOKENS.AddServiceOwnerUseCase,
    );

    await useCase.execute({
      serviceId: validated.serviceId,
      personId: validated.personId,
      ownershipType: validated.ownershipType,
      isPrimary: validated.isPrimary,
    });

    revalidatePath("/services");
    revalidatePath(`/services/${validated.serviceId}`);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "addServiceOwnerAction" },
      "Failed to add service owner",
    );
  }
}

export async function removeServiceOwnerAction(
  serviceId: string,
  personId: string,
  ownershipType: z.infer<typeof RemoveServiceOwnerSchema>["ownershipType"],
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_MANAGE);

    const validated = RemoveServiceOwnerSchema.parse({
      serviceId,
      personId,
      ownershipType,
    });

    const container = getContainer();
    const useCase = container.get<RemoveServiceOwnerUseCase>(
      DI_TOKENS.RemoveServiceOwnerUseCase,
    );

    await useCase.execute({
      serviceId: validated.serviceId,
      personId: validated.personId,
      ownershipType: validated.ownershipType,
    });

    revalidatePath("/services");
    revalidatePath(`/services/${serviceId}`);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "removeServiceOwnerAction", serviceId, personId },
      "Failed to remove service owner",
    );
  }
}

export async function setServicePrimaryOwnerAction(
  data: z.infer<typeof SetPrimaryOwnerSchema>,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_MANAGE);

    const validated = SetPrimaryOwnerSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<SetPrimaryOwnerUseCase>(
      DI_TOKENS.SetPrimaryOwnerUseCase,
    );

    await useCase.execute({
      serviceId: validated.serviceId,
      personId: validated.personId,
      ownershipType: validated.ownershipType,
    });

    revalidatePath("/services");
    revalidatePath(`/services/${validated.serviceId}`);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "setServicePrimaryOwnerAction" },
      "Failed to set primary service owner",
    );
  }
}

export async function getServiceOwnersAction(
  serviceId: string,
): Promise<ActionResponse<ServiceOwnerDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_VIEW);

    const container = getContainer();
    const useCase = container.get<GetServiceOwnersUseCase>(
      DI_TOKENS.GetServiceOwnersUseCase,
    );

    const owners = await useCase.execute({ serviceId });

    return {
      success: true,
      data: presentServiceOwnerList(owners),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getServiceOwnersAction", serviceId },
      "Failed to get service owners",
    );
  }
}
