"use server";

import { revalidatePath } from "next/cache";
import { getContainer, ensureModuleLoaded } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { handleControllerError } from "./error-handler";
import type { ActionResponse } from "./types";
import type { ServiceRelationshipType } from "@/generated/prisma";
import type {
  ServiceRelationshipDTO,
  CreateServiceRelationshipDTO,
  UpdateServiceRelationshipDTO,
  ImpactedServiceDTO,
} from "@/interface-adapters/dtos/generated/service-relationship.dto";
import {
  CreateServiceRelationshipSchema,
  UpdateServiceRelationshipSchema,
} from "@/interface-adapters/dtos/generated/service-relationship.dto";
import { ServiceRelationshipPresenter } from "@/interface-adapters/presenters/service-relationship.presenter";
import type { CreateServiceRelationshipUseCase } from "@/core/use-cases/service-relationship/create-service-relationship.use-case";
import type { GetServiceRelationshipUseCase } from "@/core/use-cases/service-relationship/get-service-relationship.use-case";
import type { UpdateServiceRelationshipUseCase } from "@/core/use-cases/service-relationship/update-service-relationship.use-case";
import type { DeleteServiceRelationshipUseCase } from "@/core/use-cases/service-relationship/delete-service-relationship.use-case";
import type { ListServiceRelationshipsUseCase } from "@/core/use-cases/service-relationship/list-service-relationships.use-case";
import type { GetServiceDependenciesUseCase } from "@/core/use-cases/service-relationship/get-service-dependencies.use-case";
import type { GetServiceDependentsUseCase } from "@/core/use-cases/service-relationship/get-service-dependents.use-case";
import type { GetImpactedServicesUseCase } from "@/core/use-cases/service-relationship/get-impacted-services.use-case";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

/**
 * Create a new service relationship
 */
export async function createServiceRelationshipAction(
  data: CreateServiceRelationshipDTO,
): Promise<ActionResponse<ServiceRelationshipDTO>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_MANAGE);

    // Ensure Service module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("service");

    const validated = CreateServiceRelationshipSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<CreateServiceRelationshipUseCase>(
      DI_TOKENS.CreateServiceRelationshipUseCase,
    );

    const relationship = await useCase.execute({
      fromServiceId: validated.fromServiceId,
      toServiceId: validated.toServiceId,
      relationshipType: validated.relationshipType,
      isCritical: validated.isCritical,
      description: validated.description ?? undefined,
      metadata: validated.metadata ?? undefined,
      validFrom: validated.validFrom ?? undefined,
      validTo: validated.validTo ?? undefined,
    });

    const dto = ServiceRelationshipPresenter.toDTO(relationship);

    revalidatePath("/services");

    return { success: true, data: dto };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createServiceRelationshipAction" },
      "Failed to create service relationship",
    );
  }
}

/**
 * Get a service relationship by ID
 */
export async function getServiceRelationshipAction(
  id: string,
): Promise<ActionResponse<ServiceRelationshipDTO>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_VIEW);

    // Ensure Service module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("service");

    const container = getContainer();
    const useCase = container.get<GetServiceRelationshipUseCase>(
      DI_TOKENS.GetServiceRelationshipUseCase,
    );

    const relationship = await useCase.execute({ id });

    if (!relationship) {
      return {
        success: false,
        error: "Service relationship not found",
      };
    }

    const dto = ServiceRelationshipPresenter.toDTO(relationship);

    return { success: true, data: dto };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getServiceRelationshipAction" },
      "Failed to get service relationship",
    );
  }
}

/**
 * Update an existing service relationship
 */
export async function updateServiceRelationshipAction(
  id: string,
  data: UpdateServiceRelationshipDTO,
): Promise<ActionResponse<ServiceRelationshipDTO>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_MANAGE);

    // Ensure Service module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("service");

    const validated = UpdateServiceRelationshipSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateServiceRelationshipUseCase>(
      DI_TOKENS.UpdateServiceRelationshipUseCase,
    );

    const relationship = await useCase.execute({
      id,
      isCritical: validated.isCritical,
      description: validated.description,
      metadata: validated.metadata,
      validTo: validated.validTo,
      isActive: validated.isActive,
    });

    const dto = ServiceRelationshipPresenter.toDTO(relationship);

    revalidatePath("/services");

    return { success: true, data: dto };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateServiceRelationshipAction" },
      "Failed to update service relationship",
    );
  }
}

/**
 * Delete a service relationship
 */
export async function deleteServiceRelationshipAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_MANAGE);

    // Ensure Service module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("service");

    const container = getContainer();
    const useCase = container.get<DeleteServiceRelationshipUseCase>(
      DI_TOKENS.DeleteServiceRelationshipUseCase,
    );

    await useCase.execute({ id });

    revalidatePath("/services");

    return { success: true, data: undefined };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteServiceRelationshipAction" },
      "Failed to delete service relationship",
    );
  }
}

/**
 * List service relationships with optional filters
 */
export async function listServiceRelationshipsAction(
  serviceId?: string,
  relationshipType?: ServiceRelationshipType,
  activeOnly?: boolean,
  criticalOnly?: boolean,
): Promise<ActionResponse<ServiceRelationshipDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_VIEW);

    // Ensure Service module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("service");

    const container = getContainer();
    const useCase = container.get<ListServiceRelationshipsUseCase>(
      DI_TOKENS.ListServiceRelationshipsUseCase,
    );

    const relationships = await useCase.execute({
      serviceId,
      relationshipType,
      activeOnly,
      criticalOnly,
    });

    const dtos = ServiceRelationshipPresenter.toDTOList(relationships);

    return { success: true, data: dtos };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listServiceRelationshipsAction" },
      "Failed to list service relationships",
    );
  }
}

/**
 * Get services that a given service depends on (outgoing dependencies)
 */
export async function getServiceDependenciesAction(
  serviceId: string,
): Promise<ActionResponse<ServiceRelationshipDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_VIEW);

    // Ensure Service module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("service");

    const container = getContainer();
    const useCase = container.get<GetServiceDependenciesUseCase>(
      DI_TOKENS.GetServiceDependenciesUseCase,
    );

    const relationships = await useCase.execute({ serviceId });
    const dtos = ServiceRelationshipPresenter.toDTOList(relationships);

    return { success: true, data: dtos };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getServiceDependenciesAction" },
      "Failed to get service dependencies",
    );
  }
}

/**
 * Get services that depend on a given service (incoming dependencies)
 */
export async function getServiceDependentsAction(
  serviceId: string,
): Promise<ActionResponse<ServiceRelationshipDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_VIEW);

    // Ensure Service module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("service");

    const container = getContainer();
    const useCase = container.get<GetServiceDependentsUseCase>(
      DI_TOKENS.GetServiceDependentsUseCase,
    );

    const relationships = await useCase.execute({ serviceId });
    const dtos = ServiceRelationshipPresenter.toDTOList(relationships);

    return { success: true, data: dtos };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getServiceDependentsAction" },
      "Failed to get service dependents",
    );
  }
}

/**
 * Get all services that would be impacted if a given service fails (recursive)
 */
export async function getImpactedServicesAction(
  serviceId: string,
  maxDepth?: number,
): Promise<ActionResponse<ImpactedServiceDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_VIEW);

    // Ensure Service module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("service");

    const container = getContainer();
    const useCase = container.get<GetImpactedServicesUseCase>(
      DI_TOKENS.GetImpactedServicesUseCase,
    );

    const impacted = await useCase.execute({ serviceId, maxDepth });
    const dtos =
      ServiceRelationshipPresenter.toImpactedServiceDTOList(impacted);

    return { success: true, data: dtos };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getImpactedServicesAction" },
      "Failed to get impacted services",
    );
  }
}
