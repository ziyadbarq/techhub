/**
 * LicenseEntitlementAddon Controller - Server Actions
 */

"use server";

import { revalidatePath } from "next/cache";
import { resolve, loadHeavyModule, isModuleLoaded } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

/**
 * Ensures the Licenses module is loaded before accessing its use cases
 */
async function ensureLicensesModuleLoaded(): Promise<void> {
  if (!isModuleLoaded("licenses")) {
    await loadHeavyModule("licenses");
  }
}
import type {
  AttachAddonToEntitlementDTO,
  UpdateEntitlementAddonDTO,
  LicenseEntitlementAddonDTO,
  EntitlementCostBreakdownDTO,
} from "../dtos/generated/license-entitlement-addon.dto";
import {
  AttachAddonToEntitlementSchema,
  UpdateEntitlementAddonSchema,
} from "../dtos/generated/license-entitlement-addon.dto";
import { LicenseEntitlementAddonPresenter } from "../presenters/license-entitlement-addon.presenter";
import type { AttachAddonToEntitlementUseCase } from "@/core/use-cases/license-entitlement-addon/attach-addon-to-entitlement.use-case";
import type { DetachAddonFromEntitlementUseCase } from "@/core/use-cases/license-entitlement-addon/detach-addon-from-entitlement.use-case";
import type { UpdateEntitlementAddonUseCase } from "@/core/use-cases/license-entitlement-addon/update-entitlement-addon.use-case";
import type { ListEntitlementAddonsUseCase } from "@/core/use-cases/license-entitlement-addon/list-entitlement-addons.use-case";
import type { CalculateEntitlementTotalCostUseCase } from "@/core/use-cases/license-entitlement-addon/calculate-entitlement-total-cost.use-case";

/**
 * Attach an addon to an entitlement
 */
export async function attachAddonToEntitlement(
  data: AttachAddonToEntitlementDTO,
): Promise<
  | { success: true; data: LicenseEntitlementAddonDTO }
  | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_ENTITLEMENTS_UPDATE);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureLicensesModuleLoaded();

    const validated = AttachAddonToEntitlementSchema.parse(data);

    const useCase = resolve<AttachAddonToEntitlementUseCase>(
      DI_TOKENS.AttachAddonToEntitlementUseCase,
    );

    const entitlementAddon = await useCase.execute({
      licenseEntitlementId: validated.licenseEntitlementId,
      licenseAddonId: validated.licenseAddonId,
      cost: validated.cost,
      currency: validated.currency,
      note: validated.note,
    });

    revalidatePath("/license-entitlements");

    return {
      success: true,
      data: LicenseEntitlementAddonPresenter.toDTO(entitlementAddon),
    };
  } catch (error) {
    console.error("Error attaching addon to entitlement:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to attach addon to entitlement",
    };
  }
}

/**
 * Detach an addon from an entitlement
 */
export async function detachAddonFromEntitlement(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_ENTITLEMENTS_UPDATE);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureLicensesModuleLoaded();

    const useCase = resolve<DetachAddonFromEntitlementUseCase>(
      DI_TOKENS.DetachAddonFromEntitlementUseCase,
    );

    await useCase.execute(id);

    revalidatePath("/license-entitlements");

    return { success: true };
  } catch (error) {
    console.error("Error detaching addon from entitlement:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to detach addon from entitlement",
    };
  }
}

/**
 * Update an entitlement addon
 */
export async function updateEntitlementAddon(
  data: UpdateEntitlementAddonDTO,
): Promise<
  | { success: true; data: LicenseEntitlementAddonDTO }
  | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_ENTITLEMENTS_UPDATE);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureLicensesModuleLoaded();

    const validated = UpdateEntitlementAddonSchema.parse(data);

    const useCase = resolve<UpdateEntitlementAddonUseCase>(
      DI_TOKENS.UpdateEntitlementAddonUseCase,
    );

    const entitlementAddon = await useCase.execute({
      id: validated.id,
      cost: validated.cost,
      currency: validated.currency,
      note: validated.note,
    });

    revalidatePath("/license-entitlements");

    return {
      success: true,
      data: LicenseEntitlementAddonPresenter.toDTO(entitlementAddon),
    };
  } catch (error) {
    console.error("Error updating entitlement addon:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update entitlement addon",
    };
  }
}

/**
 * List addons attached to an entitlement
 */
export async function listEntitlementAddons(params?: {
  licenseEntitlementId?: string;
  licenseAddonId?: string;
}): Promise<
  | { success: true; data: LicenseEntitlementAddonDTO[] }
  | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_ENTITLEMENTS_VIEW);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureLicensesModuleLoaded();

    const useCase = resolve<ListEntitlementAddonsUseCase>(
      DI_TOKENS.ListEntitlementAddonsUseCase,
    );

    const entitlementAddons = await useCase.execute(params ?? {});

    return {
      success: true,
      data: LicenseEntitlementAddonPresenter.toDTOList(entitlementAddons),
    };
  } catch (error) {
    console.error("Error listing entitlement addons:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to list entitlement addons",
    };
  }
}

/**
 * Calculate total cost breakdown for an entitlement
 */
export async function calculateEntitlementTotalCost(
  entitlementId: string,
): Promise<
  | { success: true; data: EntitlementCostBreakdownDTO }
  | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_ENTITLEMENTS_VIEW);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureLicensesModuleLoaded();

    const useCase = resolve<CalculateEntitlementTotalCostUseCase>(
      DI_TOKENS.CalculateEntitlementTotalCostUseCase,
    );

    const breakdown = await useCase.execute(entitlementId);

    return {
      success: true,
      data: LicenseEntitlementAddonPresenter.toCostBreakdownDTO(breakdown),
    };
  } catch (error) {
    console.error("Error calculating entitlement total cost:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to calculate entitlement total cost",
    };
  }
}
