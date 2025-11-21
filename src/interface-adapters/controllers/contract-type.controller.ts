/**
 * Contract Type Controller
 * Handles HTTP requests and responses for contract type operations
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type {
  CreateContractTypeUseCase,
  GetContractTypeUseCase,
  ListContractTypesUseCase,
  UpdateContractTypeUseCase,
  DeleteContractTypeUseCase,
} from "@/core/use-cases/contract-type";
import {
  CreateContractTypeSchema,
  UpdateContractTypeSchema,
  type CreateContractTypeDTO,
  type UpdateContractTypeDTO,
} from "@/interface-adapters/dtos/generated/contract-type.dto";
import {
  ContractTypePresenter,
  type ContractTypeDTO,
} from "@/interface-adapters/presenters/contract-type.presenter";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

/**
 * Create a new contract type
 */
export async function createContractType(
  data: CreateContractTypeDTO,
): Promise<
  { success: true; data: ContractTypeDTO } | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.CONTRACT_TYPES_CREATE);

    // Validate input
    const validatedData = CreateContractTypeSchema.parse(data);

    // Get use case from DI container
    const container = getContainer();
    const useCase = container.get<CreateContractTypeUseCase>(
      DI_TOKENS.CreateContractTypeUseCase,
    );

    // Execute use case
    const contractType = await useCase.execute(validatedData);

    // Revalidate relevant paths
    revalidatePath("/contract-types");

    return {
      success: true,
      data: ContractTypePresenter.toDTO(contractType),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create contract type",
    };
  }
}

/**
 * Get a contract type by ID
 */
export async function getContractType(
  id: string,
): Promise<
  { success: true; data: ContractTypeDTO } | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.CONTRACT_TYPES_VIEW);

    const container = getContainer();
    const useCase = container.get<GetContractTypeUseCase>(
      DI_TOKENS.GetContractTypeUseCase,
    );

    const contractType = await useCase.execute({ id });

    return {
      success: true,
      data: ContractTypePresenter.toDTO(contractType),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get contract type",
    };
  }
}

/**
 * List all contract types
 */
export async function listContractTypes(options?: {
  activeOnly?: boolean;
}): Promise<
  { success: true; data: ContractTypeDTO[] } | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.CONTRACT_TYPES_VIEW);

    const container = getContainer();
    const useCase = container.get<ListContractTypesUseCase>(
      DI_TOKENS.ListContractTypesUseCase,
    );

    const contractTypes = await useCase.execute({
      activeOnly: options?.activeOnly,
    });

    return {
      success: true,
      data: ContractTypePresenter.toDTOList(contractTypes),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to list contract types",
    };
  }
}

/**
 * Update a contract type
 */
export async function updateContractType(
  id: string,
  data: UpdateContractTypeDTO,
): Promise<
  { success: true; data: ContractTypeDTO } | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.CONTRACT_TYPES_UPDATE);

    // Validate input
    const validatedData = UpdateContractTypeSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateContractTypeUseCase>(
      DI_TOKENS.UpdateContractTypeUseCase,
    );

    const contractType = await useCase.execute({
      id,
      ...validatedData,
    });

    // Revalidate relevant paths
    revalidatePath("/contract-types");
    revalidatePath(`/contract-types/${id}`);

    return {
      success: true,
      data: ContractTypePresenter.toDTO(contractType),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update contract type",
    };
  }
}

/**
 * Delete a contract type
 */
export async function deleteContractType(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePermission(PERMISSIONS.CONTRACT_TYPES_DELETE);

    const container = getContainer();
    const useCase = container.get<DeleteContractTypeUseCase>(
      DI_TOKENS.DeleteContractTypeUseCase,
    );

    await useCase.execute({ id });

    // Revalidate relevant paths
    revalidatePath("/contract-types");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete contract type",
    };
  }
}
