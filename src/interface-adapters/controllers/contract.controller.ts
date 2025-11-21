/**
 * Contract Controller
 * Handles HTTP requests and responses for contract operations
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type {
  CreateContractUseCase,
  GetContractUseCase,
  ListContractsUseCase,
  UpdateContractUseCase,
  DeleteContractUseCase,
} from "@/core/use-cases/contract";
import {
  CreateContractSchema,
  UpdateContractSchema,
  type CreateContractDTO,
  type UpdateContractDTO,
} from "@/interface-adapters/dtos/generated/contract.dto";
import {
  ContractPresenter,
  type ContractDTO,
} from "@/interface-adapters/presenters/contract.presenter";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

/**
 * Create a new contract
 */
export async function createContract(
  data: CreateContractDTO,
): Promise<
  { success: true; data: ContractDTO } | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.CONTRACTS_CREATE);

    // Validate input
    const validatedData = CreateContractSchema.parse(data);

    // Get use case from DI container
    const container = getContainer();
    const useCase = container.get<CreateContractUseCase>(
      DI_TOKENS.CreateContractUseCase,
    );

    // Execute use case
    const contract = await useCase.execute(validatedData);

    // Revalidate relevant paths
    revalidatePath("/contracts");

    return {
      success: true,
      data: ContractPresenter.toDTO(contract, true),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create contract",
    };
  }
}

/**
 * Get a contract by ID
 */
export async function getContract(
  id: string,
): Promise<
  { success: true; data: ContractDTO } | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.CONTRACTS_VIEW);

    const container = getContainer();
    const useCase = container.get<GetContractUseCase>(
      DI_TOKENS.GetContractUseCase,
    );

    const contract = await useCase.execute({ id });

    return {
      success: true,
      data: ContractPresenter.toDTO(contract, true),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get contract",
    };
  }
}

/**
 * List all contracts
 */
export async function listContracts(options?: {
  contractTypeId?: string;
  vendorId?: string;
  activeOnly?: boolean;
  asOfDate?: Date;
}): Promise<
  { success: true; data: ContractDTO[] } | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.CONTRACTS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListContractsUseCase>(
      DI_TOKENS.ListContractsUseCase,
    );

    const contracts = await useCase.execute({
      contractTypeId: options?.contractTypeId,
      vendorId: options?.vendorId,
      activeOnly: options?.activeOnly,
      asOfDate: options?.asOfDate,
    });

    return {
      success: true,
      data: ContractPresenter.toDTOList(contracts, true),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to list contracts",
    };
  }
}

/**
 * Update a contract
 */
export async function updateContract(
  id: string,
  data: UpdateContractDTO,
): Promise<
  { success: true; data: ContractDTO } | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.CONTRACTS_UPDATE);

    // Validate input
    const validatedData = UpdateContractSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateContractUseCase>(
      DI_TOKENS.UpdateContractUseCase,
    );

    const contract = await useCase.execute({
      id,
      ...validatedData,
    });

    // Revalidate relevant paths
    revalidatePath("/contracts");
    revalidatePath(`/contracts/${id}`);

    return {
      success: true,
      data: ContractPresenter.toDTO(contract, true),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update contract",
    };
  }
}

/**
 * Delete a contract
 */
export async function deleteContract(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePermission(PERMISSIONS.CONTRACTS_DELETE);

    const container = getContainer();
    const useCase = container.get<DeleteContractUseCase>(
      DI_TOKENS.DeleteContractUseCase,
    );

    await useCase.execute({ id });

    // Revalidate relevant paths
    revalidatePath("/contracts");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete contract",
    };
  }
}
