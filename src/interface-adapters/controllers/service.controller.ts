/**
 * Service Controller
 *
 * Server actions for Service Management System
 */

"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateServiceSchema,
  UpdateServiceSchema,
  AddServiceOwnerSchema,
  RemoveServiceOwnerSchema,
  SetPrimaryOwnerSchema,
  CreateServiceInfrastructureSchema,
  UpdateServiceInfrastructureSchema,
  LinkServiceToAssetSchema,
} from "../dtos/generated/service.dto";
import {
  presentService,
  presentServiceOwnerList,
  presentServiceInfrastructure,
  presentServiceAssetList,
  presentServiceList,
  type ServiceDTO,
  type ServiceOwnerDTO,
  type ServiceInfrastructureDTO,
  type ServiceAssetDTO,
} from "../presenters/service.presenter";
import type {
  CreateServiceUseCase,
  GetServiceUseCase,
  ListServicesUseCase,
  UpdateServiceUseCase,
  DeleteServiceUseCase,
  SearchServicesUseCase,
  GetEssentialServicesUseCase,
  GetRetiringServicesUseCase,
  RetireServiceUseCase,
} from "@/core/use-cases/service";
import type {
  AddServiceOwnerUseCase,
  RemoveServiceOwnerUseCase,
  SetPrimaryOwnerUseCase,
  GetServiceOwnersUseCase,
} from "@/core/use-cases/service-ownership";
import type {
  CreateServiceInfrastructureUseCase,
  UpdateServiceInfrastructureUseCase,
  GetServiceInfrastructureUseCase,
} from "@/core/use-cases/service-infrastructure";
import type {
  LinkServiceToAssetUseCase,
  UnlinkServiceFromAssetUseCase,
  GetServiceAssetsUseCase,
  GetAssetServicesUseCase,
} from "@/core/use-cases/service-asset";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

// ==================== Service Management ====================

export async function createServiceAction(
  data: z.infer<typeof CreateServiceSchema>,
): Promise<ActionResponse<ServiceDTO>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_CREATE);

    const validated = CreateServiceSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<CreateServiceUseCase>(
      DI_TOKENS.CreateServiceUseCase,
    );

    const service = await useCase.execute({
      name: validated.name,
      serviceType: validated.serviceType,
      description: validated.description ?? undefined,
      businessPurpose: validated.businessPurpose ?? undefined,
      gitlabRepoUrl: validated.gitlabRepoUrl ?? undefined,
      dataConfidentiality: validated.dataConfidentiality,
      businessImpactLevel: validated.businessImpactLevel,
      criticality: validated.criticality,
      isEssentialService: validated.isEssentialService,
      deploymentDate: validated.deploymentDate ?? undefined,
      currentStatus: validated.currentStatus,
      lastPatchDate: validated.lastPatchDate ?? undefined,
      plannedDecommissionDate: validated.plannedDecommissionDate ?? undefined,
      vendorId: validated.vendorId ?? undefined,
      slaDetails: validated.slaDetails ?? undefined,
      businessProcessId: validated.businessProcessId ?? undefined,
      isInCentralRegister: validated.isInCentralRegister,
      complianceNotes: validated.complianceNotes ?? undefined,
      metadata: validated.metadata ?? undefined,
    });

    revalidatePath("/services");

    return {
      success: true,
      data: presentService(service),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createServiceAction" },
      "Failed to create service",
    );
  }
}

export async function getServiceAction(
  id: string,
): Promise<ActionResponse<ServiceDTO>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_VIEW);

    const container = getContainer();
    const useCase = container.get<GetServiceUseCase>(
      DI_TOKENS.GetServiceUseCase,
    );

    const service = await useCase.execute({ serviceId: id });

    return {
      success: true,
      data: presentService(service),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getServiceAction", id },
      "Failed to get service",
    );
  }
}

export async function listServicesAction(): Promise<
  ActionResponse<ServiceDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_VIEW);

    const container = getContainer();
    const useCase = container.get<ListServicesUseCase>(
      DI_TOKENS.ListServicesUseCase,
    );

    const services = await useCase.execute({});

    return {
      success: true,
      data: presentServiceList(services),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listServicesAction" },
      "Failed to list services",
    );
  }
}

export async function updateServiceAction(
  id: string,
  data: z.infer<typeof UpdateServiceSchema>,
): Promise<ActionResponse<ServiceDTO>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_UPDATE);

    const validated = UpdateServiceSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateServiceUseCase>(
      DI_TOKENS.UpdateServiceUseCase,
    );

    const service = await useCase.execute({
      serviceId: id,
      name: validated.name,
      serviceType: validated.serviceType,
      description: validated.description ?? undefined,
      businessPurpose: validated.businessPurpose ?? undefined,
      gitlabRepoUrl: validated.gitlabRepoUrl ?? undefined,
      dataConfidentiality: validated.dataConfidentiality,
      businessImpactLevel: validated.businessImpactLevel,
      criticality: validated.criticality,
      isEssentialService: validated.isEssentialService,
      deploymentDate: validated.deploymentDate ?? undefined,
      currentStatus: validated.currentStatus,
      lastPatchDate: validated.lastPatchDate ?? undefined,
      plannedDecommissionDate: validated.plannedDecommissionDate ?? undefined,
      vendorId: validated.vendorId ?? undefined,
      slaDetails: validated.slaDetails ?? undefined,
      businessProcessId: validated.businessProcessId ?? undefined,
      isInCentralRegister: validated.isInCentralRegister,
      complianceNotes: validated.complianceNotes ?? undefined,
      metadata: validated.metadata ?? undefined,
    });

    revalidatePath("/services");
    revalidatePath(`/services/${id}`);

    return {
      success: true,
      data: presentService(service),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateServiceAction", id },
      "Failed to update service",
    );
  }
}

export async function deleteServiceAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_DELETE);

    const container = getContainer();
    const useCase = container.get<DeleteServiceUseCase>(
      DI_TOKENS.DeleteServiceUseCase,
    );

    await useCase.execute({ serviceId: id });

    revalidatePath("/services");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteServiceAction", id },
      "Failed to delete service",
    );
  }
}

export async function searchServicesAction(
  query: string,
): Promise<ActionResponse<ServiceDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_VIEW);

    const container = getContainer();
    const useCase = container.get<SearchServicesUseCase>(
      DI_TOKENS.SearchServicesUseCase,
    );

    const services = await useCase.execute({ query });

    return {
      success: true,
      data: presentServiceList(services),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "searchServicesAction", query },
      "Failed to search services",
    );
  }
}

export async function getEssentialServicesAction(): Promise<
  ActionResponse<ServiceDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_VIEW);

    const container = getContainer();
    const useCase = container.get<GetEssentialServicesUseCase>(
      DI_TOKENS.GetEssentialServicesUseCase,
    );

    const services = await useCase.execute();

    return {
      success: true,
      data: presentServiceList(services),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getEssentialServicesAction" },
      "Failed to get essential services",
    );
  }
}

export async function getRetiringServicesAction(
  daysThreshold: number = 90,
): Promise<ActionResponse<ServiceDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_VIEW);

    const container = getContainer();
    const useCase = container.get<GetRetiringServicesUseCase>(
      DI_TOKENS.GetRetiringServicesUseCase,
    );

    const services = await useCase.execute({ daysThreshold });

    return {
      success: true,
      data: presentServiceList(services),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getRetiringServicesAction", daysThreshold },
      "Failed to get retiring services",
    );
  }
}

export async function retireServiceAction(
  id: string,
  reason?: string,
): Promise<ActionResponse<ServiceDTO>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_RETIRE);

    const container = getContainer();
    const useCase = container.get<RetireServiceUseCase>(
      DI_TOKENS.RetireServiceUseCase,
    );

    const service = await useCase.execute({ serviceId: id, reason });

    revalidatePath("/services");
    revalidatePath(`/services/${id}`);

    return {
      success: true,
      data: presentService(service),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "retireServiceAction", id },
      "Failed to retire service",
    );
  }
}

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

// ==================== Service Infrastructure ====================

export async function createServiceInfrastructureAction(
  data: z.infer<typeof CreateServiceInfrastructureSchema>,
): Promise<ActionResponse<ServiceInfrastructureDTO>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_MANAGE);

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

// ==================== Service Asset Linking ====================

export async function linkServiceToAssetAction(
  data: z.infer<typeof LinkServiceToAssetSchema>,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_MANAGE);

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
