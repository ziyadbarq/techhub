/**
 * LicenseEntitlement Controller - Server Actions
 */

"use server";

import { revalidatePath } from "next/cache";
import { controllerLogger } from "@/lib/logger";
import { handleControllerError } from "./error-handler";
import { resolve, ensureModuleLoaded } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

import type {
  CreateLicenseEntitlementDTO,
  UpdateLicenseEntitlementDTO,
  LicenseEntitlementDTO,
} from "../dtos/generated/license-entitlement.dto";
import {
  CreateLicenseEntitlementSchema,
  UpdateLicenseEntitlementSchema,
} from "../dtos/generated/license-entitlement.dto";
import { LicenseEntitlementPresenter } from "../presenters/license-entitlement.presenter";
import type { CreateLicenseEntitlementUseCase } from "@/core/use-cases/license-entitlement/create-license-entitlement.use-case";
import type { GetLicenseEntitlementUseCase } from "@/core/use-cases/license-entitlement/get-license-entitlement.use-case";
import type { ListLicenseEntitlementsUseCase } from "@/core/use-cases/license-entitlement/list-license-entitlements.use-case";
import type { UpdateLicenseEntitlementUseCase } from "@/core/use-cases/license-entitlement/update-license-entitlement.use-case";
import type { DeleteLicenseEntitlementUseCase } from "@/core/use-cases/license-entitlement/delete-license-entitlement.use-case";
import type { ActionResponse, BulkCreateResult } from "./types";

/**
 * Create a new license entitlement
 */
export async function createLicenseEntitlement(
  data: CreateLicenseEntitlementDTO,
): Promise<ActionResponse<LicenseEntitlementDTO>> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_ENTITLEMENTS_CREATE);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("licenses");

    const validated = CreateLicenseEntitlementSchema.parse(data);

    const useCase = resolve<CreateLicenseEntitlementUseCase>(
      DI_TOKENS.CreateLicenseEntitlementUseCase,
    );

    const entitlement = await useCase.execute({
      licenseProductId: validated.licenseProductId,
      contractId: validated.contractId,
      purchasedQuantity: validated.purchasedQuantity,
      effectiveStart: validated.effectiveStart,
      effectiveEnd: validated.effectiveEnd,
      allowedScope: validated.allowedScope,
      note: validated.note,
      unitCost: validated.unitCost,
      currency: validated.currency,
    });

    revalidatePath("/license-entitlements");

    return {
      success: true,
      data: LicenseEntitlementPresenter.toDTO(entitlement),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createLicenseEntitlement" },
      "Failed to create license entitlement",
    );
  }
}

/**
 * Get a license entitlement by ID
 */
export async function getLicenseEntitlement(
  id: string,
): Promise<ActionResponse<LicenseEntitlementDTO>> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_ENTITLEMENTS_VIEW);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("licenses");

    const useCase = resolve<GetLicenseEntitlementUseCase>(
      DI_TOKENS.GetLicenseEntitlementUseCase,
    );

    const entitlement = await useCase.execute({ id });

    return {
      success: true,
      data: LicenseEntitlementPresenter.toDTO(entitlement),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getLicenseEntitlement" },
      "Failed to get license entitlement",
    );
  }
}

/**
 * List license entitlements with optional filters
 */
export async function listLicenseEntitlements(params?: {
  licenseProductId?: string;
  contractId?: string;
  activeOnly?: boolean;
  asOfDate?: Date;
}): Promise<ActionResponse<LicenseEntitlementDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_ENTITLEMENTS_VIEW);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("licenses");

    const useCase = resolve<ListLicenseEntitlementsUseCase>(
      DI_TOKENS.ListLicenseEntitlementsUseCase,
    );

    const entitlements = await useCase.execute(params ?? {});

    return {
      success: true,
      data: LicenseEntitlementPresenter.toDTOList(entitlements),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listLicenseEntitlements" },
      "Failed to list license entitlements",
    );
  }
}

/**
 * Update a license entitlement
 */
export async function updateLicenseEntitlement(
  data: UpdateLicenseEntitlementDTO,
): Promise<ActionResponse<LicenseEntitlementDTO>> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_ENTITLEMENTS_UPDATE);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("licenses");

    const validated = UpdateLicenseEntitlementSchema.parse(data);

    const useCase = resolve<UpdateLicenseEntitlementUseCase>(
      DI_TOKENS.UpdateLicenseEntitlementUseCase,
    );

    const entitlement = await useCase.execute({
      id: validated.id,
      purchasedQuantity: validated.purchasedQuantity,
      effectiveStart: validated.effectiveStart,
      effectiveEnd: validated.effectiveEnd,
      allowedScope: validated.allowedScope,
      note: validated.note,
      unitCost: validated.unitCost,
      currency: validated.currency,
    });

    revalidatePath("/license-entitlements");
    revalidatePath(`/license-entitlements/${validated.id}`);

    return {
      success: true,
      data: LicenseEntitlementPresenter.toDTO(entitlement),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateLicenseEntitlement" },
      "Failed to update license entitlement",
    );
  }
}

/**
 * Delete a license entitlement
 */
export async function deleteLicenseEntitlement(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_ENTITLEMENTS_DELETE);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("licenses");

    const useCase = resolve<DeleteLicenseEntitlementUseCase>(
      DI_TOKENS.DeleteLicenseEntitlementUseCase,
    );

    await useCase.execute({ id });

    revalidatePath("/license-entitlements");

    return { success: true };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteLicenseEntitlement" },
      "Failed to delete license entitlement",
    );
  }
}

/**
 * Bulk create license entitlements
 */
export async function bulkCreateLicenseEntitlementsAction(
  items: CreateLicenseEntitlementDTO[],
): Promise<BulkCreateResult> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_ENTITLEMENTS_CREATE);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("licenses");

    const useCase = resolve<CreateLicenseEntitlementUseCase>(
      DI_TOKENS.CreateLicenseEntitlementUseCase,
    );

    const results: BulkCreateResult = {
      success: true,
      successCount: 0,
      errorCount: 0,
      errors: [],
    };

    // Process items sequentially
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const validated = CreateLicenseEntitlementSchema.parse(item);

        await useCase.execute({
          licenseProductId: validated.licenseProductId,
          contractId: validated.contractId,
          purchasedQuantity: validated.purchasedQuantity,
          effectiveStart: validated.effectiveStart,
          effectiveEnd: validated.effectiveEnd,
          allowedScope: validated.allowedScope,
          note: validated.note,
          unitCost: validated.unitCost,
          currency: validated.currency,
        });

        results.successCount++;
      } catch (error) {
        results.errorCount++;
        results.errors.push({
          index: i,
          name: item.licenseProductId,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    }

    revalidatePath("/license-entitlements");

    return results;
  } catch (error) {
    controllerLogger.error(
      "bulkCreateLicenseEntitlementsAction",
      "Error bulk creating license entitlements",
      error,
    );
    return {
      success: false,
      successCount: 0,
      errorCount: 0,
      errors: [],
    };
  }
}
