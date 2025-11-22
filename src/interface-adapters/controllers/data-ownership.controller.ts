/**
 * DataOwnership Controller
 * Handles HTTP requests and responses for data ownership operations
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type {
  CreateDataOwnershipUseCase,
  GetDataOwnershipUseCase,
  ListDataOwnershipsUseCase,
  UpdateDataOwnershipUseCase,
  DeleteDataOwnershipUseCase,
} from "@/core/use-cases/governance/data-ownership";
import {
  CreateDataOwnershipSchema,
  UpdateDataOwnershipSchema,
  type CreateDataOwnershipDTO,
  type UpdateDataOwnershipDTO,
} from "@/interface-adapters/dtos/generated/data-ownership.dto";
import {
  DataOwnershipPresenter,
  type DataOwnershipDTO,
} from "@/interface-adapters/presenters/data-ownership.presenter";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

/**
 * Create a new data ownership
 */
export async function createDataOwnership(
  data: CreateDataOwnershipDTO,
): Promise<
  { success: true; data: DataOwnershipDTO } | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.DATA_OWNERSHIPS_CREATE);

    // Validate input
    const validatedData = CreateDataOwnershipSchema.parse(data);

    // Get use case from DI container
    const container = getContainer();
    const useCase = container.get<CreateDataOwnershipUseCase>(
      DI_TOKENS.CreateDataOwnershipUseCase,
    );

    // Execute use case
    const dataOwnership = await useCase.execute(validatedData);

    // Revalidate relevant paths
    revalidatePath("/data-ownerships");

    return {
      success: true,
      data: DataOwnershipPresenter.toDTO(dataOwnership),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create data ownership",
    };
  }
}

/**
 * Get a data ownership by ID
 */
export async function getDataOwnership(
  id: string,
): Promise<
  { success: true; data: DataOwnershipDTO } | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.DATA_OWNERSHIPS_VIEW);

    const container = getContainer();
    const useCase = container.get<GetDataOwnershipUseCase>(
      DI_TOKENS.GetDataOwnershipUseCase,
    );

    const dataOwnership = await useCase.execute({ id });

    return {
      success: true,
      data: DataOwnershipPresenter.toDTO(dataOwnership),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get data ownership",
    };
  }
}

/**
 * List all data ownerships
 */
export async function listDataOwnerships(options?: {
  dataDomainId?: string;
  ciClassId?: string;
  assetCategoryId?: string;
  ownerPersonId?: string;
  ownerOrgUnitId?: string;
}): Promise<
  | { success: true; data: DataOwnershipDTO[] }
  | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.DATA_OWNERSHIPS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListDataOwnershipsUseCase>(
      DI_TOKENS.ListDataOwnershipsUseCase,
    );

    const dataOwnerships = await useCase.execute(options ?? {});

    return {
      success: true,
      data: DataOwnershipPresenter.toDTOList(dataOwnerships),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to list data ownerships",
    };
  }
}

/**
 * Update a data ownership
 */
export async function updateDataOwnership(
  id: string,
  data: UpdateDataOwnershipDTO,
): Promise<
  { success: true; data: DataOwnershipDTO } | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.DATA_OWNERSHIPS_UPDATE);

    // Validate input
    const validatedData = UpdateDataOwnershipSchema.parse(data);

    // Get use case from DI container
    const container = getContainer();
    const useCase = container.get<UpdateDataOwnershipUseCase>(
      DI_TOKENS.UpdateDataOwnershipUseCase,
    );

    // Execute use case
    const dataOwnership = await useCase.execute({ id, ...validatedData });

    // Revalidate relevant paths
    revalidatePath("/data-ownerships");
    revalidatePath(`/data-ownerships/${id}`);

    return {
      success: true,
      data: DataOwnershipPresenter.toDTO(dataOwnership),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update data ownership",
    };
  }
}

/**
 * Delete a data ownership
 */
export async function deleteDataOwnership(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePermission(PERMISSIONS.DATA_OWNERSHIPS_DELETE);

    const container = getContainer();
    const useCase = container.get<DeleteDataOwnershipUseCase>(
      DI_TOKENS.DeleteDataOwnershipUseCase,
    );

    await useCase.execute({ id });

    // Revalidate relevant paths
    revalidatePath("/data-ownerships");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete data ownership",
    };
  }
}
