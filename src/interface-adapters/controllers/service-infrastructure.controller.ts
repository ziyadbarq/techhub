/**
 * Service Infrastructure Controller
 *
 * Server actions for Service Infrastructure Management
 */

"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getContainer, ensureModuleLoaded } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateServiceInfrastructureSchema,
  UpdateServiceInfrastructureSchema,
} from "../dtos/generated/service.dto";
import {
  presentServiceInfrastructure,
  type ServiceInfrastructureDTO,
} from "../presenters/service.presenter";
import type {
  CreateServiceInfrastructureUseCase,
  UpdateServiceInfrastructureUseCase,
  GetServiceInfrastructureUseCase,
} from "@/core/use-cases/service-infrastructure";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

// ==================== Service Infrastructure ====================

export async function createServiceInfrastructureAction(
  data: z.infer<typeof CreateServiceInfrastructureSchema>,
): Promise<ActionResponse<ServiceInfrastructureDTO>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_MANAGE);

    // Ensure Service module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("service");

    const validated = CreateServiceInfrastructureSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<CreateServiceInfrastructureUseCase>(
      DI_TOKENS.CreateServiceInfrastructureUseCase,
    );

    const infrastructure = await useCase.execute({
      serviceId: validated.serviceId,
      location: validated.location,
      cloudProvider: validated.cloudProvider ?? undefined,
      compartment: validated.compartment ?? undefined,
      project: validated.project ?? undefined,
      region: validated.region ?? undefined,
      ipAddress: validated.ipAddress ?? undefined,
      hostname: validated.hostname ?? undefined,
      backupEnabled: validated.backupEnabled,
      backupSchedule: validated.backupSchedule ?? undefined,
      lastBackupDate: validated.lastBackupDate ?? undefined,
      cloudProviderDetails: validated.cloudProviderDetails ?? undefined,
    });

    revalidatePath("/services");
    revalidatePath(`/services/${validated.serviceId}`);

    return {
      success: true,
      data: presentServiceInfrastructure(infrastructure),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createServiceInfrastructureAction" },
      "Failed to create service infrastructure",
    );
  }
}

export async function updateServiceInfrastructureAction(
  id: string,
  data: z.infer<typeof UpdateServiceInfrastructureSchema>,
): Promise<ActionResponse<ServiceInfrastructureDTO>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_MANAGE);

    // Ensure Service module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("service");

    const validated = UpdateServiceInfrastructureSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateServiceInfrastructureUseCase>(
      DI_TOKENS.UpdateServiceInfrastructureUseCase,
    );

    const infrastructure = await useCase.execute({
      infrastructureId: id,
      location: validated.location,
      cloudProvider: validated.cloudProvider ?? undefined,
      compartment: validated.compartment ?? undefined,
      project: validated.project ?? undefined,
      region: validated.region ?? undefined,
      ipAddress: validated.ipAddress ?? undefined,
      hostname: validated.hostname ?? undefined,
      backupEnabled: validated.backupEnabled,
      backupSchedule: validated.backupSchedule ?? undefined,
      lastBackupDate: validated.lastBackupDate ?? undefined,
      cloudProviderDetails: validated.cloudProviderDetails ?? undefined,
    });

    revalidatePath("/services");
    revalidatePath(`/services/${infrastructure.serviceId}`);

    return {
      success: true,
      data: presentServiceInfrastructure(infrastructure),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateServiceInfrastructureAction", id },
      "Failed to update service infrastructure",
    );
  }
}

export async function getServiceInfrastructureAction(
  serviceId: string,
): Promise<ActionResponse<ServiceInfrastructureDTO | null>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_VIEW);

    // Ensure Service module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("service");

    const container = getContainer();
    const useCase = container.get<GetServiceInfrastructureUseCase>(
      DI_TOKENS.GetServiceInfrastructureUseCase,
    );

    const infrastructures = await useCase.execute({ serviceId });

    return {
      success: true,
      data:
        infrastructures.length > 0
          ? presentServiceInfrastructure(infrastructures[0])
          : null,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getServiceInfrastructureAction", serviceId },
      "Failed to get service infrastructure",
    );
  }
}
