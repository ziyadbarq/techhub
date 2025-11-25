/**
 * ContractLinkedObject Controller
 * Handles HTTP requests and responses for contract linked object operations
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type {
  CreateContractLinkedObjectUseCase,
  GetContractLinkedObjectUseCase,
  ListContractLinkedObjectsUseCase,
  UpdateContractLinkedObjectUseCase,
  DeleteContractLinkedObjectUseCase,
} from "@/core/use-cases/contract-linked-object";
import type { TargetObjectType } from "@/core/domain/entities/contract-linked-object.entity";
import {
  CreateContractLinkedObjectSchema,
  UpdateContractLinkedObjectSchema,
  type CreateContractLinkedObjectDTO,
  type UpdateContractLinkedObjectDTO,
} from "@/interface-adapters/dtos/generated/contract-linked-object.dto";
import {
  ContractLinkedObjectPresenter,
  type ContractLinkedObjectDTO,
} from "@/interface-adapters/presenters/contract-linked-object.presenter";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { BulkCreateResult } from "./types";

/**
 * Create a new contract linked object
 */
export async function createContractLinkedObject(
  data: CreateContractLinkedObjectDTO,
): Promise<
  | { success: true; data: ContractLinkedObjectDTO }
  | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.CONTRACT_LINKED_OBJECTS_CREATE);

    // Validate input
    const validatedData = CreateContractLinkedObjectSchema.parse(data);

    // Get use case from DI container
    const container = getContainer();
    const useCase = container.get<CreateContractLinkedObjectUseCase>(
      DI_TOKENS.CreateContractLinkedObjectUseCase,
    );

    // Execute use case
    const linkedObject = await useCase.execute(validatedData);

    // Revalidate relevant paths
    revalidatePath("/contracts");
    revalidatePath(`/contracts/${validatedData.contractId}`);

    return {
      success: true,
      data: ContractLinkedObjectPresenter.toDTO(linkedObject),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create contract linked object",
    };
  }
}

/**
 * Get a contract linked object by ID
 */
export async function getContractLinkedObject(
  id: string,
): Promise<
  | { success: true; data: ContractLinkedObjectDTO }
  | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.CONTRACT_LINKED_OBJECTS_VIEW);

    const container = getContainer();
    const useCase = container.get<GetContractLinkedObjectUseCase>(
      DI_TOKENS.GetContractLinkedObjectUseCase,
    );

    const linkedObject = await useCase.execute({ id });

    return {
      success: true,
      data: ContractLinkedObjectPresenter.toDTO(linkedObject),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get contract linked object",
    };
  }
}

/**
 * List contract linked objects
 */
export async function listContractLinkedObjects(options?: {
  contractId?: string;
  targetType?: TargetObjectType;
  targetId?: string;
}): Promise<
  | { success: true; data: ContractLinkedObjectDTO[] }
  | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.CONTRACT_LINKED_OBJECTS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListContractLinkedObjectsUseCase>(
      DI_TOKENS.ListContractLinkedObjectsUseCase,
    );

    const linkedObjects = await useCase.execute({
      contractId: options?.contractId,
      targetType: options?.targetType,
      targetId: options?.targetId,
    });

    return {
      success: true,
      data: ContractLinkedObjectPresenter.toDTOList(linkedObjects),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to list contract linked objects",
    };
  }
}

/**
 * Update a contract linked object
 */
export async function updateContractLinkedObject(
  id: string,
  data: UpdateContractLinkedObjectDTO,
): Promise<
  | { success: true; data: ContractLinkedObjectDTO }
  | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.CONTRACT_LINKED_OBJECTS_UPDATE);

    // Validate input
    const validatedData = UpdateContractLinkedObjectSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateContractLinkedObjectUseCase>(
      DI_TOKENS.UpdateContractLinkedObjectUseCase,
    );

    const linkedObject = await useCase.execute({
      id,
      ...validatedData,
    });

    // Revalidate relevant paths
    revalidatePath("/contracts");
    revalidatePath(`/contracts/${linkedObject.contractId}`);

    return {
      success: true,
      data: ContractLinkedObjectPresenter.toDTO(linkedObject),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update contract linked object",
    };
  }
}

/**
 * Delete a contract linked object
 */
export async function deleteContractLinkedObject(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePermission(PERMISSIONS.CONTRACT_LINKED_OBJECTS_DELETE);

    const container = getContainer();
    const useCase = container.get<DeleteContractLinkedObjectUseCase>(
      DI_TOKENS.DeleteContractLinkedObjectUseCase,
    );

    await useCase.execute({ id });

    // Revalidate relevant paths
    revalidatePath("/contracts");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete contract linked object",
    };
  }
}

/**
 * Bulk create contract linked objects
 * Processes multiple contract linked objects sequentially, tracking failures
 */
export async function bulkCreateContractLinkedObjectsAction(
  items: CreateContractLinkedObjectDTO[],
): Promise<BulkCreateResult> {
  try {
    await requirePermission(PERMISSIONS.CONTRACT_LINKED_OBJECTS_CREATE);

    const container = getContainer();
    const useCase = container.get<CreateContractLinkedObjectUseCase>(
      DI_TOKENS.CreateContractLinkedObjectUseCase,
    );

    const results: BulkCreateResult = {
      success: true,
      successCount: 0,
      errorCount: 0,
      errors: [],
    };

    // Process contract linked objects sequentially to avoid overwhelming the database
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const validated = CreateContractLinkedObjectSchema.parse(item);

        await useCase.execute(validated);

        results.successCount++;
      } catch (error) {
        results.success = false;
        results.errorCount++;
        results.errors.push({
          index: i,
          name: item.contractId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    revalidatePath("/contract-linked-objects");

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
