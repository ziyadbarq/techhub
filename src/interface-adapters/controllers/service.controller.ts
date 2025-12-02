/**
 * Service Controller
 *
 * Server actions for Service Management System
 */

"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getContainer, loadHeavyModule, isModuleLoaded } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateServiceSchema,
  UpdateServiceSchema,
  type CreateServiceDTO,
} from "../dtos/generated/service.dto";
import {
  presentService,
  presentServiceList,
  presentServiceHealthHistoryList,
  presentServiceSlaMetricList,
  type ServiceDTO,
  type ServiceHealthHistoryDTO,
  type ServiceSlaMetricDTO,
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
  GetServiceHealthHistoryUseCase,
} from "@/core/use-cases/service";
import type { GetServiceSlaMetricsUseCase } from "@/core/use-cases/service-sla-metric";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

// ==========================================
// Module Loading
// ==========================================

/**
 * Ensures the Service module is loaded before accessing its use cases
 */
async function ensureServiceModuleLoaded(): Promise<void> {
  if (!isModuleLoaded("service")) {
    await loadHeavyModule("service");
  }
}

// ==================== Service Management ====================

export async function createServiceAction(
  data: z.infer<typeof CreateServiceSchema>,
): Promise<ActionResponse<ServiceDTO>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_CREATE);

    // Ensure Service module is loaded (HEAVY tier, lazy loaded)
    await ensureServiceModuleLoaded();

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

    // Ensure Service module is loaded (HEAVY tier, lazy loaded)
    await ensureServiceModuleLoaded();

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

    // Ensure Service module is loaded (HEAVY tier, lazy loaded)
    await ensureServiceModuleLoaded();

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

    // Ensure Service module is loaded (HEAVY tier, lazy loaded)
    await ensureServiceModuleLoaded();

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

    // Ensure Service module is loaded (HEAVY tier, lazy loaded)
    await ensureServiceModuleLoaded();

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

    // Ensure Service module is loaded (HEAVY tier, lazy loaded)
    await ensureServiceModuleLoaded();

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

    // Ensure Service module is loaded (HEAVY tier, lazy loaded)
    await ensureServiceModuleLoaded();

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

    // Ensure Service module is loaded (HEAVY tier, lazy loaded)
    await ensureServiceModuleLoaded();

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

    // Ensure Service module is loaded (HEAVY tier, lazy loaded)
    await ensureServiceModuleLoaded();

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

export async function bulkCreateServicesAction(
  itemsData: CreateServiceDTO[],
): Promise<
  ActionResponse<{
    successCount: number;
    failureCount: number;
    failures: Array<{ index: number; name: string; error: string }>;
  }>
> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_CREATE);

    // Ensure Service module is loaded (HEAVY tier, lazy loaded)
    await ensureServiceModuleLoaded();

    const container = getContainer();
    const useCase = container.get<CreateServiceUseCase>(
      DI_TOKENS.CreateServiceUseCase,
    );

    const results = {
      successCount: 0,
      failureCount: 0,
      failures: [] as Array<{ index: number; name: string; error: string }>,
    };

    // Process services sequentially to avoid overwhelming the database
    for (let i = 0; i < itemsData.length; i++) {
      const serviceData = itemsData[i];
      try {
        const validated = CreateServiceSchema.parse(serviceData);

        await useCase.execute({
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
          plannedDecommissionDate:
            validated.plannedDecommissionDate ?? undefined,
          vendorId: validated.vendorId ?? undefined,
          slaDetails: validated.slaDetails ?? undefined,
          businessProcessId: validated.businessProcessId ?? undefined,
          isInCentralRegister: validated.isInCentralRegister,
          complianceNotes: validated.complianceNotes ?? undefined,
          metadata: validated.metadata ?? undefined,
        });

        results.successCount++;
      } catch (error) {
        results.failureCount++;
        results.failures.push({
          index: i,
          name: serviceData.name || "Unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    revalidatePath("/services");

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "bulkCreateServicesAction" },
      "Failed to bulk create services",
    );
  }
}

// ==================== Service Health & SLA Monitoring ====================

export async function getServiceHealthHistoryAction(
  serviceId: string,
  limit: number = 50,
): Promise<ActionResponse<ServiceHealthHistoryDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_VIEW);

    // Ensure Service module is loaded (HEAVY tier, lazy loaded)
    await ensureServiceModuleLoaded();

    const container = getContainer();
    const useCase = container.get<GetServiceHealthHistoryUseCase>(
      DI_TOKENS.GetServiceHealthHistoryUseCase,
    );

    const histories = await useCase.execute({ serviceId, limit });

    return {
      success: true,
      data: presentServiceHealthHistoryList(histories),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getServiceHealthHistoryAction", serviceId },
      "Failed to get service health history",
    );
  }
}

export async function getServiceSlaMetricsAction(
  serviceId: string,
  limit: number = 50,
): Promise<ActionResponse<ServiceSlaMetricDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_VIEW);

    // Ensure Service module is loaded (HEAVY tier, lazy loaded)
    await ensureServiceModuleLoaded();

    const container = getContainer();
    const useCase = container.get<GetServiceSlaMetricsUseCase>(
      DI_TOKENS.GetServiceSlaMetricsUseCase,
    );

    const metrics = await useCase.execute({ serviceId, limit });

    return {
      success: true,
      data: presentServiceSlaMetricList(metrics),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getServiceSlaMetricsAction", serviceId },
      "Failed to get service SLA metrics",
    );
  }
}
