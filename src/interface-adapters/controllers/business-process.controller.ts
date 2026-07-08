/**
 * Business Process Controller
 *
 * Server actions for Business Process management
 */

"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getContainer, ensureModuleLoaded } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateBusinessProcessSchema,
  UpdateBusinessProcessSchema,
} from "../dtos/generated/service.dto";
import {
  presentBusinessProcess,
  presentBusinessProcessList,
  type BusinessProcessDTO,
} from "../presenters/service.presenter";
import type {
  CreateBusinessProcessUseCase,
  GetBusinessProcessUseCase,
  ListBusinessProcessesUseCase,
  UpdateBusinessProcessUseCase,
  DeleteBusinessProcessUseCase,
} from "@/core/use-cases/business-process";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

// ==================== Business Process Management ====================

export async function createBusinessProcessAction(
  data: z.infer<typeof CreateBusinessProcessSchema>,
): Promise<ActionResponse<BusinessProcessDTO>> {
  try {
    await requirePermission(PERMISSIONS.BUSINESS_PROCESSES_CREATE);

    const validated = CreateBusinessProcessSchema.parse(data);

    await ensureModuleLoaded("service");
    const container = getContainer();
    const useCase = container.get<CreateBusinessProcessUseCase>(
      DI_TOKENS.CreateBusinessProcessUseCase,
    );

    const process = await useCase.execute({
      code: validated.code,
      name: validated.name,
      description: validated.description ?? undefined,
      category: validated.category ?? undefined,
      metadata: validated.metadata ?? undefined,
    });

    revalidatePath("/business-processes");

    return {
      success: true,
      data: presentBusinessProcess(process),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createBusinessProcessAction" },
      "Failed to create business process",
    );
  }
}

export async function getBusinessProcessAction(
  id: string,
): Promise<ActionResponse<BusinessProcessDTO>> {
  try {
    await requirePermission(PERMISSIONS.BUSINESS_PROCESSES_VIEW);

    await ensureModuleLoaded("service");
    const container = getContainer();
    const useCase = container.get<GetBusinessProcessUseCase>(
      DI_TOKENS.GetBusinessProcessUseCase,
    );

    const process = await useCase.execute({ businessProcessId: id });

    return {
      success: true,
      data: presentBusinessProcess(process),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getBusinessProcessAction", id },
      "Failed to get business process",
    );
  }
}

export async function listBusinessProcessesAction(): Promise<
  ActionResponse<BusinessProcessDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.BUSINESS_PROCESSES_VIEW);

    await ensureModuleLoaded("service");
    const container = getContainer();
    const useCase = container.get<ListBusinessProcessesUseCase>(
      DI_TOKENS.ListBusinessProcessesUseCase,
    );

    const processes = await useCase.execute({});

    return {
      success: true,
      data: presentBusinessProcessList(processes),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listBusinessProcessesAction" },
      "Failed to list business processes",
    );
  }
}

export async function updateBusinessProcessAction(
  id: string,
  data: z.infer<typeof UpdateBusinessProcessSchema>,
): Promise<ActionResponse<BusinessProcessDTO>> {
  try {
    await requirePermission(PERMISSIONS.BUSINESS_PROCESSES_UPDATE);

    const validated = UpdateBusinessProcessSchema.parse(data);

    await ensureModuleLoaded("service");
    const container = getContainer();
    const useCase = container.get<UpdateBusinessProcessUseCase>(
      DI_TOKENS.UpdateBusinessProcessUseCase,
    );

    const process = await useCase.execute({
      businessProcessId: id,
      code: validated.code,
      name: validated.name,
      description: validated.description ?? undefined,
      category: validated.category ?? undefined,
      metadata: validated.metadata ?? undefined,
    });

    revalidatePath("/business-processes");
    revalidatePath(`/business-processes/${id}`);

    return {
      success: true,
      data: presentBusinessProcess(process),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateBusinessProcessAction", id },
      "Failed to update business process",
    );
  }
}

export async function deleteBusinessProcessAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.BUSINESS_PROCESSES_DELETE);

    await ensureModuleLoaded("service");
    const container = getContainer();
    const useCase = container.get<DeleteBusinessProcessUseCase>(
      DI_TOKENS.DeleteBusinessProcessUseCase,
    );

    await useCase.execute({ businessProcessId: id });

    revalidatePath("/business-processes");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteBusinessProcessAction", id },
      "Failed to delete business process",
    );
  }
}

export async function searchBusinessProcessesAction(
  query: string,
): Promise<ActionResponse<BusinessProcessDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.BUSINESS_PROCESSES_VIEW);

    await ensureModuleLoaded("service");
    const container = getContainer();
    const useCase = container.get<ListBusinessProcessesUseCase>(
      DI_TOKENS.ListBusinessProcessesUseCase,
    );

    // Get all processes and filter by query
    const processes = await useCase.execute({});

    const filteredProcesses = processes.filter((process) => {
      const searchableText =
        `${process.code} ${process.name} ${process.description || ""} ${process.category || ""}`.toLowerCase();
      return searchableText.includes(query.toLowerCase());
    });

    return {
      success: true,
      data: presentBusinessProcessList(filteredProcesses),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "searchBusinessProcessesAction", query },
      "Failed to search business processes",
    );
  }
}
