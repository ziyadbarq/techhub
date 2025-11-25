/**
 * Maintenance Record Controller
 * Server actions for maintenance record management
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateMaintenanceRecordSchema,
  UpdateMaintenanceRecordSchema,
  MaintenanceRecordFilterSchema,
  StartMaintenanceSchema,
  CompleteMaintenanceSchema,
  CancelMaintenanceSchema,
  type CreateMaintenanceRecordDTO,
  type UpdateMaintenanceRecordDTO,
  type MaintenanceRecordFilterDTO,
  type StartMaintenanceDTO,
  type CompleteMaintenanceDTO,
  type CancelMaintenanceDTO,
} from "../dtos/generated/maintenance-record.dto";
import {
  presentMaintenanceRecord,
  type MaintenanceRecordDTO,
} from "../presenters/maintenance-record.presenter";
import type { CreateMaintenanceRecordUseCase } from "@/core/use-cases/maintenance/record/create-maintenance-record.use-case";
import type { UpdateMaintenanceRecordUseCase } from "@/core/use-cases/maintenance/record/update-maintenance-record.use-case";
import type { DeleteMaintenanceRecordUseCase } from "@/core/use-cases/maintenance/record/delete-maintenance-record.use-case";
import type { GetMaintenanceRecordUseCase } from "@/core/use-cases/maintenance/record/get-maintenance-record.use-case";
import type { ListMaintenanceRecordsUseCase } from "@/core/use-cases/maintenance/record/list-maintenance-records.use-case";
import type { StartMaintenanceUseCase } from "@/core/use-cases/maintenance/record/start-maintenance.use-case";
import type { CompleteMaintenanceUseCase } from "@/core/use-cases/maintenance/record/complete-maintenance.use-case";
import type { CancelMaintenanceUseCase } from "@/core/use-cases/maintenance/record/cancel-maintenance.use-case";
import type { MaintenanceRecord } from "@/core/domain/entities/maintenance-record.entity";
import type { MaintenanceStatus } from "@/core/domain/value-objects/maintenance-status";
import type { ListAssetsUseCase } from "@/core/use-cases/asset/asset/list-assets.use-case";
import type { ListPeopleUseCase } from "@/core/use-cases/foundation/person/list-people.use-case";
import type { ListMaintenanceSchedulesUseCase } from "@/core/use-cases/maintenance/schedule/list-maintenance-schedules.use-case";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { BulkCreateResult } from "./types";

/**
 * Enrich maintenance records with asset, person, and schedule display data
 */
async function enrichRecords(
  records: MaintenanceRecord[],
): Promise<MaintenanceRecordDTO[]> {
  if (records.length === 0) {
    return [];
  }

  const container = getContainer();

  // Collect unique IDs
  const assetIds = [...new Set(records.map((r) => r.assetId))];
  const personIds = [
    ...new Set(
      records
        .map((r) => r.performedById)
        .filter((id): id is string => id !== null),
    ),
  ];
  const scheduleIds = [
    ...new Set(
      records
        .map((r) => r.maintenanceScheduleId)
        .filter((id): id is string => id !== null),
    ),
  ];

  // Fetch related entities in parallel
  const [assetsMap, personsMap, schedulesMap] = await Promise.all([
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
    (async () => {
      if (scheduleIds.length === 0) return new Map();

      const listSchedulesUseCase =
        container.get<ListMaintenanceSchedulesUseCase>(
          DI_TOKENS.ListMaintenanceSchedulesUseCase,
        );
      const schedules = await listSchedulesUseCase.execute();

      return new Map(
        schedules
          .filter((s) => scheduleIds.includes(s.id))
          .map((s) => [s.id, s.title]),
      );
    })(),
  ]);

  // Present records with enrichment data
  return records.map((record) => {
    const asset = assetsMap.get(record.assetId);
    const performedByName = record.performedById
      ? personsMap.get(record.performedById)
      : null;
    const scheduleTitle = record.maintenanceScheduleId
      ? schedulesMap.get(record.maintenanceScheduleId)
      : null;

    return presentMaintenanceRecord(record, {
      assetTag: asset?.assetTag || null,
      performedByName: performedByName || null,
      scheduleTitle: scheduleTitle || null,
    });
  });
}

/**
 * Create a new maintenance record
 *
 * @param data - The maintenance record data
 * @returns ActionResponse containing the created record
 */
export async function createMaintenanceRecordAction(
  data: CreateMaintenanceRecordDTO,
): Promise<ActionResponse<MaintenanceRecordDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_MANAGE);

    const validated = CreateMaintenanceRecordSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<CreateMaintenanceRecordUseCase>(
      DI_TOKENS.CreateMaintenanceRecordUseCase,
    );

    const record = await useCase.execute({
      assetId: validated.assetId,
      maintenanceScheduleId: validated.maintenanceScheduleId ?? undefined,
      title: validated.title,
      description: validated.description ?? undefined,
      scheduledDate: validated.scheduledDate,
      completedDate: validated.completedDate ?? undefined,
      performedById: validated.performedById ?? undefined,
      status: validated.status as MaintenanceStatus,
      notes: validated.notes ?? undefined,
      cost: validated.cost ?? undefined,
      partsUsed: validated.partsUsed ?? undefined,
      nextMaintenanceDate: validated.nextMaintenanceDate ?? undefined,
    });

    // Get asset tag for revalidation
    const assetRepo = container.get<IAssetRepository>(
      DI_TOKENS.IAssetRepository,
    );
    const asset = await assetRepo.findById(validated.assetId);

    revalidatePath("/maintenance/records");
    if (asset) {
      revalidatePath(`/assets/${asset.assetTag}`);
    }
    if (validated.maintenanceScheduleId) {
      revalidatePath(
        `/maintenance/schedules/${validated.maintenanceScheduleId}`,
      );
    }

    return {
      success: true,
      data: presentMaintenanceRecord(record),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createMaintenanceRecordAction" },
      "Failed to create maintenance record",
    );
  }
}

/**
 * Update an existing maintenance record
 *
 * @param id - The record ID
 * @param data - The updated record data
 * @returns ActionResponse containing the updated record
 */
export async function updateMaintenanceRecordAction(
  id: string,
  data: UpdateMaintenanceRecordDTO,
): Promise<ActionResponse<MaintenanceRecordDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_MANAGE);

    const validated = UpdateMaintenanceRecordSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateMaintenanceRecordUseCase>(
      DI_TOKENS.UpdateMaintenanceRecordUseCase,
    );

    const record = await useCase.execute({
      id,
      title: validated.title,
      description: validated.description,
      scheduledDate: validated.scheduledDate,
      completedDate: validated.completedDate,
      performedById: validated.performedById,
      status: validated.status as MaintenanceStatus | undefined,
      notes: validated.notes,
      cost: validated.cost,
      partsUsed: validated.partsUsed,
      nextMaintenanceDate: validated.nextMaintenanceDate,
    });

    // Get asset tag for revalidation
    const assetRepo = container.get<IAssetRepository>(
      DI_TOKENS.IAssetRepository,
    );
    const asset = await assetRepo.findById(record.assetId);

    revalidatePath("/maintenance/records");
    revalidatePath(`/maintenance/records/${id}`);
    if (asset) {
      revalidatePath(`/assets/${asset.assetTag}`);
    }
    if (record.maintenanceScheduleId) {
      revalidatePath(`/maintenance/schedules/${record.maintenanceScheduleId}`);
    }

    return {
      success: true,
      data: presentMaintenanceRecord(record),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateMaintenanceRecordAction", id },
      "Failed to update maintenance record",
    );
  }
}

/**
 * Delete a maintenance record
 *
 * @param id - The record ID
 * @returns ActionResponse with void data
 */
export async function deleteMaintenanceRecordAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_MANAGE);

    const container = getContainer();

    // Get record first to know which paths to revalidate
    const getUseCase = container.get<GetMaintenanceRecordUseCase>(
      DI_TOKENS.GetMaintenanceRecordUseCase,
    );
    const record = await getUseCase.execute(id);

    // Get asset tag for revalidation
    const assetRepo = container.get<IAssetRepository>(
      DI_TOKENS.IAssetRepository,
    );
    const asset = await assetRepo.findById(record.assetId);

    const deleteUseCase = container.get<DeleteMaintenanceRecordUseCase>(
      DI_TOKENS.DeleteMaintenanceRecordUseCase,
    );
    await deleteUseCase.execute(id);

    revalidatePath("/maintenance/records");
    if (asset) {
      revalidatePath(`/assets/${asset.assetTag}`);
    }
    if (record.maintenanceScheduleId) {
      revalidatePath(`/maintenance/schedules/${record.maintenanceScheduleId}`);
    }

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteMaintenanceRecordAction", id },
      "Failed to delete maintenance record",
    );
  }
}

/**
 * Get a single maintenance record by ID
 *
 * @param id - The record ID
 * @returns ActionResponse containing the record
 */
export async function getMaintenanceRecordAction(
  id: string,
): Promise<ActionResponse<MaintenanceRecordDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const container = getContainer();
    const useCase = container.get<GetMaintenanceRecordUseCase>(
      DI_TOKENS.GetMaintenanceRecordUseCase,
    );

    const record = await useCase.execute(id);

    return {
      success: true,
      data: presentMaintenanceRecord(record),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getMaintenanceRecordAction", id },
      "Failed to get maintenance record",
    );
  }
}

/**
 * List maintenance records with optional filters
 *
 * @param filters - Optional filter criteria
 * @returns ActionResponse containing array of records
 */
export async function listMaintenanceRecordsAction(
  filters?: MaintenanceRecordFilterDTO,
): Promise<ActionResponse<MaintenanceRecordDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const validated = filters
      ? MaintenanceRecordFilterSchema.parse(filters)
      : undefined;

    const container = getContainer();
    const useCase = container.get<ListMaintenanceRecordsUseCase>(
      DI_TOKENS.ListMaintenanceRecordsUseCase,
    );

    const records = await useCase.execute(validated);
    const enrichedRecords = await enrichRecords(records);

    return {
      success: true,
      data: enrichedRecords,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listMaintenanceRecordsAction" },
      "Failed to list maintenance records",
    );
  }
}

/**
 * Start a maintenance task (SCHEDULED → IN_PROGRESS)
 *
 * @param data - Start maintenance data (id, performedById)
 * @returns ActionResponse containing the updated record
 */
export async function startMaintenanceAction(
  data: StartMaintenanceDTO,
): Promise<ActionResponse<MaintenanceRecordDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_MANAGE);

    const validated = StartMaintenanceSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<StartMaintenanceUseCase>(
      DI_TOKENS.StartMaintenanceUseCase,
    );

    const record = await useCase.execute({
      id: validated.id,
      performedById: validated.performedById,
    });

    // Get asset tag for revalidation
    const assetRepo = container.get<IAssetRepository>(
      DI_TOKENS.IAssetRepository,
    );
    const asset = await assetRepo.findById(record.assetId);

    revalidatePath("/maintenance/records");
    revalidatePath(`/maintenance/records/${validated.id}`);
    if (asset) {
      revalidatePath(`/assets/${asset.assetTag}`);
    }
    if (record.maintenanceScheduleId) {
      revalidatePath(`/maintenance/schedules/${record.maintenanceScheduleId}`);
    }

    return {
      success: true,
      data: presentMaintenanceRecord(record),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "startMaintenanceAction" },
      "Failed to start maintenance",
    );
  }
}

/**
 * Complete a maintenance task (IN_PROGRESS → COMPLETED)
 *
 * @param data - Complete maintenance data
 * @returns ActionResponse containing the updated record
 */
export async function completeMaintenanceAction(
  data: CompleteMaintenanceDTO,
): Promise<ActionResponse<MaintenanceRecordDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_MANAGE);

    const validated = CompleteMaintenanceSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<CompleteMaintenanceUseCase>(
      DI_TOKENS.CompleteMaintenanceUseCase,
    );

    const record = await useCase.execute({
      id: validated.id,
      performedById: validated.performedById,
      completedDate: validated.completedDate,
      notes: validated.notes,
      cost: validated.cost,
      partsUsed: validated.partsUsed,
      nextMaintenanceDate: validated.nextMaintenanceDate,
    });

    // Get asset tag for revalidation
    const assetRepo = container.get<IAssetRepository>(
      DI_TOKENS.IAssetRepository,
    );
    const asset = await assetRepo.findById(record.assetId);

    revalidatePath("/maintenance/records");
    revalidatePath(`/maintenance/records/${validated.id}`);
    if (asset) {
      revalidatePath(`/assets/${asset.assetTag}`);
    }
    if (record.maintenanceScheduleId) {
      revalidatePath(`/maintenance/schedules/${record.maintenanceScheduleId}`);
    }

    return {
      success: true,
      data: presentMaintenanceRecord(record),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "completeMaintenanceAction" },
      "Failed to complete maintenance",
    );
  }
}

/**
 * Cancel a maintenance task
 *
 * @param data - Cancel maintenance data (id, optional notes)
 * @returns ActionResponse containing the updated record
 */
export async function cancelMaintenanceAction(
  data: CancelMaintenanceDTO,
): Promise<ActionResponse<MaintenanceRecordDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_MANAGE);

    const validated = CancelMaintenanceSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<CancelMaintenanceUseCase>(
      DI_TOKENS.CancelMaintenanceUseCase,
    );

    const record = await useCase.execute({
      id: validated.id,
      notes: validated.notes,
    });

    // Get asset tag for revalidation
    const assetRepo = container.get<IAssetRepository>(
      DI_TOKENS.IAssetRepository,
    );
    const asset = await assetRepo.findById(record.assetId);

    revalidatePath("/maintenance/records");
    revalidatePath(`/maintenance/records/${validated.id}`);
    if (asset) {
      revalidatePath(`/assets/${asset.assetTag}`);
    }
    if (record.maintenanceScheduleId) {
      revalidatePath(`/maintenance/schedules/${record.maintenanceScheduleId}`);
    }

    return {
      success: true,
      data: presentMaintenanceRecord(record),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "cancelMaintenanceAction" },
      "Failed to cancel maintenance",
    );
  }
}

/**
 * Bulk create maintenance records
 *
 * @param items - Array of maintenance record data
 * @returns BulkCreateResult with success count and errors
 */
export async function bulkCreateMaintenanceRecordsAction(
  items: CreateMaintenanceRecordDTO[],
): Promise<BulkCreateResult> {
  try {
    await requirePermission(PERMISSIONS.MAINTENANCE_RECORDS_CREATE);

    const container = getContainer();
    const useCase = container.get<CreateMaintenanceRecordUseCase>(
      DI_TOKENS.CreateMaintenanceRecordUseCase,
    );

    const results: BulkCreateResult = {
      success: true,
      successCount: 0,
      errorCount: 0,
      errors: [],
    };

    // Process maintenance records sequentially to avoid overwhelming the database
    for (let i = 0; i < items.length; i++) {
      const itemData = items[i];
      try {
        const validated = CreateMaintenanceRecordSchema.parse(itemData);

        await useCase.execute({
          assetId: validated.assetId,
          maintenanceScheduleId: validated.maintenanceScheduleId ?? undefined,
          title: validated.title,
          description: validated.description ?? undefined,
          scheduledDate: validated.scheduledDate,
          completedDate: validated.completedDate ?? undefined,
          performedById: validated.performedById ?? undefined,
          status: validated.status as MaintenanceStatus,
          notes: validated.notes ?? undefined,
          cost: validated.cost ?? undefined,
          partsUsed: validated.partsUsed ?? undefined,
          nextMaintenanceDate: validated.nextMaintenanceDate ?? undefined,
        });

        results.successCount++;
      } catch (error) {
        results.errorCount++;
        results.success = false;
        results.errors.push({
          index: i,
          name: itemData.title || "Unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    revalidatePath("/maintenance-records");

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
