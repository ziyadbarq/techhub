/**
 * LicenseAllocation Controller - Server Actions
 */

"use server";

import { revalidatePath } from "next/cache";
import { handleControllerError } from "./error-handler";
import { resolve, ensureModuleLoaded } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

import type { ActionResponse, BulkCreateResult } from "./types";
import type {
  CreateLicenseAllocationDTO,
  UpdateLicenseAllocationDTO,
  DeallocateLicenseAllocationDTO,
  LicenseAllocationDTO,
} from "../dtos/generated/license-allocation.dto";
import {
  CreateLicenseAllocationSchema,
  UpdateLicenseAllocationSchema,
  DeallocateLicenseAllocationSchema,
} from "../dtos/generated/license-allocation.dto";
import { LicenseAllocationPresenter } from "../presenters/license-allocation.presenter";
import type { CreateLicenseAllocationUseCase } from "@/core/use-cases/license-allocation/create-license-allocation.use-case";
import type { GetLicenseAllocationUseCase } from "@/core/use-cases/license-allocation/get-license-allocation.use-case";
import type { ListLicenseAllocationsUseCase } from "@/core/use-cases/license-allocation/list-license-allocations.use-case";
import type { UpdateLicenseAllocationUseCase } from "@/core/use-cases/license-allocation/update-license-allocation.use-case";
import type { DeleteLicenseAllocationUseCase } from "@/core/use-cases/license-allocation/delete-license-allocation.use-case";
import type { DeallocateLicenseAllocationUseCase } from "@/core/use-cases/license-allocation/deallocate-license-allocation.use-case";
import type { ReactivateLicenseAllocationUseCase } from "@/core/use-cases/license-allocation/reactivate-license-allocation.use-case";
import type { AllocationTargetType } from "@/core/domain/entities/license-allocation.entity";

/**
 * Create a new license allocation
 */
export async function createLicenseAllocation(
  data: CreateLicenseAllocationDTO,
): Promise<ActionResponse<LicenseAllocationDTO>> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_ALLOCATIONS_CREATE);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("licenses");

    const validated = CreateLicenseAllocationSchema.parse(data);

    const useCase = resolve<CreateLicenseAllocationUseCase>(
      DI_TOKENS.CreateLicenseAllocationUseCase,
    );

    const allocation = await useCase.execute({
      licenseEntitlementId: validated.licenseEntitlementId,
      targetType: validated.targetType,
      targetId: validated.targetId,
      allocatedQuantity: validated.allocatedQuantity,
      note: validated.note,
    });

    revalidatePath("/license-allocations");

    return {
      success: true,
      data: LicenseAllocationPresenter.toDTO(allocation),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createLicenseAllocation" },
      "Failed to create license allocation",
    );
  }
}

/**
 * Get a license allocation by ID
 */
export async function getLicenseAllocation(
  id: string,
): Promise<ActionResponse<LicenseAllocationDTO>> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_ALLOCATIONS_VIEW);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("licenses");

    const useCase = resolve<GetLicenseAllocationUseCase>(
      DI_TOKENS.GetLicenseAllocationUseCase,
    );

    const allocation = await useCase.execute({ id });

    return {
      success: true,
      data: LicenseAllocationPresenter.toDTO(allocation),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getLicenseAllocation" },
      "Failed to get license allocation",
    );
  }
}

/**
 * List license allocations with optional filters
 */
export async function listLicenseAllocations(params?: {
  licenseEntitlementId?: string;
  targetType?: AllocationTargetType;
  targetId?: string;
  activeOnly?: boolean;
}): Promise<ActionResponse<LicenseAllocationDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_ALLOCATIONS_VIEW);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("licenses");

    const useCase = resolve<ListLicenseAllocationsUseCase>(
      DI_TOKENS.ListLicenseAllocationsUseCase,
    );

    const allocations = await useCase.execute(params ?? {});

    return {
      success: true,
      data: LicenseAllocationPresenter.toDTOList(allocations),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listLicenseAllocations" },
      "Failed to list license allocations",
    );
  }
}

/**
 * Update a license allocation
 */
export async function updateLicenseAllocation(
  data: UpdateLicenseAllocationDTO,
): Promise<ActionResponse<LicenseAllocationDTO>> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_ALLOCATIONS_UPDATE);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("licenses");

    const validated = UpdateLicenseAllocationSchema.parse(data);

    const useCase = resolve<UpdateLicenseAllocationUseCase>(
      DI_TOKENS.UpdateLicenseAllocationUseCase,
    );

    const allocation = await useCase.execute({
      id: validated.id,
      allocatedQuantity: validated.allocatedQuantity,
      note: validated.note,
    });

    revalidatePath("/license-allocations");
    revalidatePath(`/license-allocations/${validated.id}`);

    return {
      success: true,
      data: LicenseAllocationPresenter.toDTO(allocation),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateLicenseAllocation" },
      "Failed to update license allocation",
    );
  }
}

/**
 * Delete a license allocation
 */
export async function deleteLicenseAllocation(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_ALLOCATIONS_DELETE);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("licenses");

    const useCase = resolve<DeleteLicenseAllocationUseCase>(
      DI_TOKENS.DeleteLicenseAllocationUseCase,
    );

    await useCase.execute({ id });

    revalidatePath("/license-allocations");

    return { success: true };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteLicenseAllocation" },
      "Failed to delete license allocation",
    );
  }
}

/**
 * Deallocate a license allocation (soft deactivation)
 */
export async function deallocateLicenseAllocation(
  data: DeallocateLicenseAllocationDTO,
): Promise<ActionResponse<LicenseAllocationDTO>> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_ALLOCATIONS_DEALLOCATE);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("licenses");

    const validated = DeallocateLicenseAllocationSchema.parse(data);

    const useCase = resolve<DeallocateLicenseAllocationUseCase>(
      DI_TOKENS.DeallocateLicenseAllocationUseCase,
    );

    const allocation = await useCase.execute({
      id: validated.id,
      deallocatedAt: validated.deallocatedAt,
    });

    revalidatePath("/license-allocations");
    revalidatePath(`/license-allocations/${validated.id}`);

    return {
      success: true,
      data: LicenseAllocationPresenter.toDTO(allocation),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deallocateLicenseAllocation" },
      "Failed to deallocate license allocation",
    );
  }
}

/**
 * Reactivate a previously deallocated license allocation
 */
export async function reactivateLicenseAllocation(
  id: string,
): Promise<ActionResponse<LicenseAllocationDTO>> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_ALLOCATIONS_REACTIVATE);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("licenses");

    const useCase = resolve<ReactivateLicenseAllocationUseCase>(
      DI_TOKENS.ReactivateLicenseAllocationUseCase,
    );

    const allocation = await useCase.execute({ id });

    revalidatePath("/license-allocations");
    revalidatePath(`/license-allocations/${id}`);

    return {
      success: true,
      data: LicenseAllocationPresenter.toDTO(allocation),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "reactivateLicenseAllocation" },
      "Failed to reactivate license allocation",
    );
  }
}

/**
 * Bulk create license allocations
 */
export async function bulkCreateLicenseAllocationsAction(
  items: CreateLicenseAllocationDTO[],
): Promise<BulkCreateResult> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_ALLOCATIONS_CREATE);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("licenses");

    const useCase = resolve<CreateLicenseAllocationUseCase>(
      DI_TOKENS.CreateLicenseAllocationUseCase,
    );

    const results: BulkCreateResult = {
      success: true,
      successCount: 0,
      errorCount: 0,
      errors: [],
    };

    // Process items sequentially to avoid overwhelming the database
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const validated = CreateLicenseAllocationSchema.parse(item);

        await useCase.execute({
          licenseEntitlementId: validated.licenseEntitlementId,
          targetType: validated.targetType,
          targetId: validated.targetId,
          allocatedQuantity: validated.allocatedQuantity,
          note: validated.note,
        });

        results.successCount++;
      } catch (error) {
        results.errorCount++;
        results.errors.push({
          index: i,
          name: item.licenseEntitlementId || "Unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Set overall success status based on whether there were any errors
    results.success = results.errorCount === 0;

    revalidatePath("/license-allocations");

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
