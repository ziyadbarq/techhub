/**
 * DataDomain Controller
 * Handles HTTP requests and responses for data domain operations
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type {
  CreateDataDomainUseCase,
  GetDataDomainUseCase,
  ListDataDomainsUseCase,
  UpdateDataDomainUseCase,
  DeleteDataDomainUseCase,
} from "@/core/use-cases/governance/data-domain";
import {
  CreateDataDomainSchema,
  UpdateDataDomainSchema,
  type CreateDataDomainDTO,
  type UpdateDataDomainDTO,
} from "@/interface-adapters/dtos/generated/data-domain.dto";
import {
  DataDomainPresenter,
  type DataDomainDTO,
} from "@/interface-adapters/presenters/data-domain.presenter";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

/**
 * Create a new data domain
 */
export async function createDataDomain(
  data: CreateDataDomainDTO,
): Promise<
  { success: true; data: DataDomainDTO } | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.DATA_DOMAINS_CREATE);

    // Validate input
    const validatedData = CreateDataDomainSchema.parse(data);

    // Get use case from DI container
    const container = getContainer();
    const useCase = container.get<CreateDataDomainUseCase>(
      DI_TOKENS.CreateDataDomainUseCase,
    );

    // Execute use case
    const dataDomain = await useCase.execute(validatedData);

    // Revalidate relevant paths
    revalidatePath("/data-domains");

    return {
      success: true,
      data: DataDomainPresenter.toDTO(dataDomain),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create data domain",
    };
  }
}

/**
 * Get a data domain by ID
 */
export async function getDataDomain(
  id: string,
): Promise<
  { success: true; data: DataDomainDTO } | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.DATA_DOMAINS_VIEW);

    const container = getContainer();
    const useCase = container.get<GetDataDomainUseCase>(
      DI_TOKENS.GetDataDomainUseCase,
    );

    const dataDomain = await useCase.execute({ id });

    return {
      success: true,
      data: DataDomainPresenter.toDTO(dataDomain),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get data domain",
    };
  }
}

/**
 * List all data domains
 */
export async function listDataDomains(options?: {
  activeOnly?: boolean;
}): Promise<
  | { success: true; data: DataDomainDTO[] }
  | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.DATA_DOMAINS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListDataDomainsUseCase>(
      DI_TOKENS.ListDataDomainsUseCase,
    );

    const dataDomains = await useCase.execute({
      activeOnly: options?.activeOnly,
    });

    return {
      success: true,
      data: DataDomainPresenter.toDTOList(dataDomains),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to list data domains",
    };
  }
}

/**
 * Update a data domain
 */
export async function updateDataDomain(
  id: string,
  data: UpdateDataDomainDTO,
): Promise<
  { success: true; data: DataDomainDTO } | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.DATA_DOMAINS_UPDATE);

    // Validate input
    const validatedData = UpdateDataDomainSchema.parse(data);

    // Get use case from DI container
    const container = getContainer();
    const useCase = container.get<UpdateDataDomainUseCase>(
      DI_TOKENS.UpdateDataDomainUseCase,
    );

    // Execute use case
    const dataDomain = await useCase.execute({ id, ...validatedData });

    // Revalidate relevant paths
    revalidatePath("/data-domains");
    revalidatePath(`/data-domains/${id}`);

    return {
      success: true,
      data: DataDomainPresenter.toDTO(dataDomain),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update data domain",
    };
  }
}

/**
 * Delete a data domain
 */
export async function deleteDataDomain(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePermission(PERMISSIONS.DATA_DOMAINS_DELETE);

    const container = getContainer();
    const useCase = container.get<DeleteDataDomainUseCase>(
      DI_TOKENS.DeleteDataDomainUseCase,
    );

    await useCase.execute({ id });

    // Revalidate relevant paths
    revalidatePath("/data-domains");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete data domain",
    };
  }
}
