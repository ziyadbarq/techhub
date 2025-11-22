/**
 * Maintenance Schedule Controller
 * Server actions for maintenance schedule management
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateMaintenanceScheduleSchema,
  UpdateMaintenanceScheduleSchema,
  MaintenanceScheduleFilterSchema,
  type CreateMaintenanceScheduleDTO,
  type UpdateMaintenanceScheduleDTO,
  type MaintenanceScheduleFilterDTO,
} from "../dtos/generated/maintenance-schedule.dto";
import {
  presentMaintenanceSchedule,
  type MaintenanceScheduleDTO,
} from "../presenters/maintenance-schedule.presenter";
import type { CreateMaintenanceScheduleUseCase } from "@/core/use-cases/maintenance/schedule/create-maintenance-schedule.use-case";
import type { UpdateMaintenanceScheduleUseCase } from "@/core/use-cases/maintenance/schedule/update-maintenance-schedule.use-case";
import type { DeleteMaintenanceScheduleUseCase } from "@/core/use-cases/maintenance/schedule/delete-maintenance-schedule.use-case";
import type { GetMaintenanceScheduleUseCase } from "@/core/use-cases/maintenance/schedule/get-maintenance-schedule.use-case";
import type { ListMaintenanceSchedulesUseCase } from "@/core/use-cases/maintenance/schedule/list-maintenance-schedules.use-case";
import type { MaintenanceSchedule } from "@/core/domain/entities/maintenance-schedule.entity";
import type { ListAssetsUseCase } from "@/core/use-cases/asset/asset/list-assets.use-case";
import type { ListPeopleUseCase } from "@/core/use-cases/foundation/person/list-people.use-case";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { ScheduleType } from "@/core/domain/value-objects/schedule-type";
import type { MaintenancePriority } from "@/core/domain/value-objects/maintenance-priority";

/**
 * Enrich maintenance schedules with asset and person display data
 */
async function enrichSchedules(
  schedules: MaintenanceSchedule[],
): Promise<MaintenanceScheduleDTO[]> {
  if (schedules.length === 0) {
    return [];
  }

  const container = getContainer();

  // Collect unique asset and person IDs
  const assetIds = [...new Set(schedules.map((s) => s.assetId))];
  const personIds = [
    ...new Set(
      schedules
        .map((s) => s.assignedToId)
        .filter((id): id is string => id !== null),
    ),
  ];

  // Fetch assets and persons in parallel
  const [assetsMap, personsMap] = await Promise.all([
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
      if (personIds.length === 0) return new Map();

      const listPersonsUseCase = container.get<ListPeopleUseCase>(
        DI_TOKENS.ListPersonsUseCase,
      );
      const persons = await listPersonsUseCase.execute();

      return new Map(
        persons
          .filter((p) => personIds.includes(p.id))
          .map((p) => [p.id, p.fullName]),
      );
    })(),
  ]);

  // Present schedules with enrichment data
  return schedules.map((schedule) => {
    const asset = assetsMap.get(schedule.assetId);
    const assignedToName = schedule.assignedToId
      ? personsMap.get(schedule.assignedToId)
      : null;

    return presentMaintenanceSchedule(schedule, {
      assetTag: asset?.assetTag || null,
      assignedToName: assignedToName || null,
    });
  });
}

/**
 * Create a new maintenance schedule
 *
 * @param data - The maintenance schedule data
 * @returns ActionResponse containing the created schedule
 */
export async function createMaintenanceScheduleAction(
  data: CreateMaintenanceScheduleDTO,
): Promise<ActionResponse<MaintenanceScheduleDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_MANAGE);

    const validated = CreateMaintenanceScheduleSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<CreateMaintenanceScheduleUseCase>(
      DI_TOKENS.CreateMaintenanceScheduleUseCase,
    );

    const schedule = await useCase.execute({
      assetId: validated.assetId,
      title: validated.title,
      description: validated.description ?? undefined,
      scheduleType: validated.scheduleType as ScheduleType,
      intervalValue: validated.intervalValue,
      startDate: validated.startDate,
      nextDueDate: validated.nextDueDate,
      isActive: validated.isActive,
      assignedToId: validated.assignedToId ?? undefined,
      estimatedDurationMinutes: validated.estimatedDurationMinutes ?? undefined,
      priority: (validated.priority as MaintenancePriority) ?? undefined,
      instructions: validated.instructions ?? undefined,
    });

    // Get asset tag for revalidation
    const assetRepo = container.get<IAssetRepository>(
      DI_TOKENS.IAssetRepository,
    );
    const asset = await assetRepo.findById(validated.assetId);

    revalidatePath("/maintenance/schedules");
    if (asset) {
      revalidatePath(`/assets/${asset.assetTag}`);
    }

    return {
      success: true,
      data: presentMaintenanceSchedule(schedule),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createMaintenanceScheduleAction" },
      "Failed to create maintenance schedule",
    );
  }
}

/**
 * Update an existing maintenance schedule
 *
 * @param id - The schedule ID
 * @param data - The updated schedule data
 * @returns ActionResponse containing the updated schedule
 */
export async function updateMaintenanceScheduleAction(
  id: string,
  data: UpdateMaintenanceScheduleDTO,
): Promise<ActionResponse<MaintenanceScheduleDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_MANAGE);

    const validated = UpdateMaintenanceScheduleSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateMaintenanceScheduleUseCase>(
      DI_TOKENS.UpdateMaintenanceScheduleUseCase,
    );

    const schedule = await useCase.execute({
      id,
      title: validated.title,
      description: validated.description,
      scheduleType: validated.scheduleType as ScheduleType | undefined,
      intervalValue: validated.intervalValue,
      startDate: validated.startDate,
      nextDueDate: validated.nextDueDate,
      isActive: validated.isActive,
      assignedToId: validated.assignedToId,
      estimatedDurationMinutes: validated.estimatedDurationMinutes,
      priority: validated.priority as MaintenancePriority | undefined,
      instructions: validated.instructions,
    });

    // Get asset tag for revalidation
    const assetRepo = container.get<IAssetRepository>(
      DI_TOKENS.IAssetRepository,
    );
    const asset = await assetRepo.findById(schedule.assetId);

    revalidatePath("/maintenance/schedules");
    revalidatePath(`/maintenance/schedules/${id}`);
    if (asset) {
      revalidatePath(`/assets/${asset.assetTag}`);
    }

    return {
      success: true,
      data: presentMaintenanceSchedule(schedule),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateMaintenanceScheduleAction", id },
      "Failed to update maintenance schedule",
    );
  }
}

/**
 * Delete a maintenance schedule
 *
 * @param id - The schedule ID
 * @returns ActionResponse with void data
 */
export async function deleteMaintenanceScheduleAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_MANAGE);

    const container = getContainer();

    // Get schedule first to know which asset to revalidate
    const getUseCase = container.get<GetMaintenanceScheduleUseCase>(
      DI_TOKENS.GetMaintenanceScheduleUseCase,
    );
    const schedule = await getUseCase.execute(id);

    // Get asset tag for revalidation
    const assetRepo = container.get<IAssetRepository>(
      DI_TOKENS.IAssetRepository,
    );
    const asset = await assetRepo.findById(schedule.assetId);

    const deleteUseCase = container.get<DeleteMaintenanceScheduleUseCase>(
      DI_TOKENS.DeleteMaintenanceScheduleUseCase,
    );
    await deleteUseCase.execute(id);

    revalidatePath("/maintenance/schedules");
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
      { function: "deleteMaintenanceScheduleAction", id },
      "Failed to delete maintenance schedule",
    );
  }
}

/**
 * Get a single maintenance schedule by ID
 *
 * @param id - The schedule ID
 * @returns ActionResponse containing the schedule
 */
export async function getMaintenanceScheduleAction(
  id: string,
): Promise<ActionResponse<MaintenanceScheduleDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const container = getContainer();
    const useCase = container.get<GetMaintenanceScheduleUseCase>(
      DI_TOKENS.GetMaintenanceScheduleUseCase,
    );

    const schedule = await useCase.execute(id);

    return {
      success: true,
      data: presentMaintenanceSchedule(schedule),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getMaintenanceScheduleAction", id },
      "Failed to get maintenance schedule",
    );
  }
}

/**
 * List maintenance schedules with optional filters
 *
 * @param filters - Optional filter criteria
 * @returns ActionResponse containing array of schedules
 */
export async function listMaintenanceSchedulesAction(
  filters?: MaintenanceScheduleFilterDTO,
): Promise<ActionResponse<MaintenanceScheduleDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const validated = filters
      ? MaintenanceScheduleFilterSchema.parse(filters)
      : undefined;

    const container = getContainer();
    const useCase = container.get<ListMaintenanceSchedulesUseCase>(
      DI_TOKENS.ListMaintenanceSchedulesUseCase,
    );

    const schedules = await useCase.execute(validated);
    const enrichedSchedules = await enrichSchedules(schedules);

    return {
      success: true,
      data: enrichedSchedules,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listMaintenanceSchedulesAction" },
      "Failed to list maintenance schedules",
    );
  }
}
