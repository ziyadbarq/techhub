/**
 * Contract Controller
 * Handles HTTP requests and responses for contract operations
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { handleControllerError } from "./error-handler";
import type { ActionResponse } from "./types";
import type {
  CreateContractUseCase,
  GetContractUseCase,
  ListContractsUseCase,
  UpdateContractUseCase,
  DeleteContractUseCase,
} from "@/core/use-cases/contract";
import type { ListVendorsUseCase } from "@/core/use-cases/foundation/vendor";
import type { ListContractTypesUseCase } from "@/core/use-cases/contract-type";
import type { Contract } from "@/core/domain/entities/contract.entity";
import {
  CreateContractSchema,
  UpdateContractSchema,
  type CreateContractDTO,
  type UpdateContractDTO,
} from "@/interface-adapters/dtos/generated/contract.dto";
import {
  ContractPresenter,
  type ContractDTO,
  type ContractEnrichment,
} from "@/interface-adapters/presenters/contract.presenter";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

/**
 * Enrich contracts with related entity display data
 */
async function enrichContracts(
  contracts: Contract[],
): Promise<Map<string, ContractEnrichment>> {
  if (contracts.length === 0) {
    return new Map();
  }

  const container = getContainer();

  // Collect unique IDs
  const vendorIds = [
    ...new Set(contracts.map((c) => c.vendorId).filter(Boolean)),
  ] as string[];
  const contractTypeIds = [...new Set(contracts.map((c) => c.contractTypeId))];

  // Fetch related entities in parallel
  const [vendorsMap, contractTypesMap] = await Promise.all([
    (async () => {
      if (vendorIds.length === 0) return new Map<string, string>();

      const useCase = container.get<ListVendorsUseCase>(
        DI_TOKENS.ListVendorsUseCase,
      );
      const vendors = await useCase.execute();

      return new Map(
        vendors
          .filter((v) => vendorIds.includes(v.id))
          .map((v) => [v.id, v.name]),
      );
    })(),
    (async () => {
      if (contractTypeIds.length === 0) return new Map<string, string>();

      const useCase = container.get<ListContractTypesUseCase>(
        DI_TOKENS.ListContractTypesUseCase,
      );
      const types = await useCase.execute({});

      return new Map(
        types
          .filter((t) => contractTypeIds.includes(t.id))
          .map((t) => [t.id, t.name]),
      );
    })(),
  ]);

  // Build enrichment map
  const enrichmentMap = new Map<string, ContractEnrichment>();
  for (const contract of contracts) {
    enrichmentMap.set(contract.id, {
      vendorName: contract.vendorId
        ? vendorsMap.get(contract.vendorId) || null
        : null,
      contractTypeName: contractTypesMap.get(contract.contractTypeId) || null,
    });
  }

  return enrichmentMap;
}

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

    // Enrich with related entity names
    const enrichmentMap = await enrichContracts([contract]);

    return {
      success: true,
      data: ContractPresenter.toDTO(
        contract,
        true,
        enrichmentMap.get(contract.id),
      ),
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

    // Enrich with related entity names
    const enrichmentMap = await enrichContracts(contracts);

    return {
      success: true,
      data: ContractPresenter.toDTOList(contracts, true, enrichmentMap),
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

/**
 * Bulk create contracts
 * Processes multiple contracts sequentially, tracking failures
 */
export async function bulkCreateContractsAction(
  itemsData: CreateContractDTO[],
): Promise<
  ActionResponse<{
    successCount: number;
    failureCount: number;
    failures: Array<{
      index: number;
      contractNumber?: string;
      name: string;
      error: string;
    }>;
  }>
> {
  try {
    await requirePermission(PERMISSIONS.CONTRACTS_CREATE);

    const container = getContainer();
    const useCase = container.get<CreateContractUseCase>(
      DI_TOKENS.CreateContractUseCase,
    );

    const results = {
      successCount: 0,
      failureCount: 0,
      failures: [] as Array<{
        index: number;
        contractNumber?: string;
        name: string;
        error: string;
      }>,
    };

    // Process contracts sequentially to avoid overwhelming the database
    for (let i = 0; i < itemsData.length; i++) {
      const contractData = itemsData[i];
      try {
        const validated = CreateContractSchema.parse(contractData);

        await useCase.execute({
          contractTypeId: validated.contractTypeId,
          vendorId: validated.vendorId,
          name: validated.name,
          contractNumber: validated.contractNumber ?? undefined,
          startDate: validated.startDate,
          endDate: validated.endDate ?? undefined,
          autoRenew: validated.autoRenew ?? undefined,
          renewalTerms: validated.renewalTerms ?? undefined,
          slaDefinition: validated.slaDefinition ?? undefined,
          totalValue: validated.totalValue ?? undefined,
          currency: validated.currency ?? undefined,
          note: validated.note ?? undefined,
        });

        results.successCount++;
      } catch (error) {
        results.failureCount++;
        results.failures.push({
          index: i,
          contractNumber: contractData.contractNumber || undefined,
          name: contractData.name || "Unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    revalidatePath("/contracts");

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "bulkCreateContractsAction" },
      "Failed to bulk create contracts",
    );
  }
}
