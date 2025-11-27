/**
 * LicenseAddon Controller - Server Actions
 */

"use server";

import { revalidatePath } from "next/cache";
import { resolve } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type {
  CreateLicenseAddonDTO,
  UpdateLicenseAddonDTO,
  LicenseAddonDTO,
} from "../dtos/generated/license-addon.dto";
import {
  CreateLicenseAddonSchema,
  UpdateLicenseAddonSchema,
} from "../dtos/generated/license-addon.dto";
import { LicenseAddonPresenter } from "../presenters/license-addon.presenter";
import type { CreateLicenseAddonUseCase } from "@/core/use-cases/license-addon/create-license-addon.use-case";
import type { GetLicenseAddonUseCase } from "@/core/use-cases/license-addon/get-license-addon.use-case";
import type { ListLicenseAddonsUseCase } from "@/core/use-cases/license-addon/list-license-addons.use-case";
import type { UpdateLicenseAddonUseCase } from "@/core/use-cases/license-addon/update-license-addon.use-case";
import type { DeleteLicenseAddonUseCase } from "@/core/use-cases/license-addon/delete-license-addon.use-case";

/**
 * Create a new license addon
 */
export async function createLicenseAddon(
  data: CreateLicenseAddonDTO,
): Promise<
  { success: true; data: LicenseAddonDTO } | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_PRODUCTS_UPDATE);

    const validated = CreateLicenseAddonSchema.parse(data);

    const useCase = resolve<CreateLicenseAddonUseCase>(
      DI_TOKENS.CreateLicenseAddonUseCase,
    );

    const addon = await useCase.execute({
      licenseProductId: validated.licenseProductId,
      name: validated.name,
      code: validated.code,
      description: validated.description,
      isActive: validated.isActive,
    });

    revalidatePath("/license-products");

    return {
      success: true,
      data: LicenseAddonPresenter.toDTO(addon),
    };
  } catch (error) {
    console.error("Error creating license addon:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create license addon",
    };
  }
}

/**
 * Get a license addon by ID
 */
export async function getLicenseAddon(
  id: string,
): Promise<
  { success: true; data: LicenseAddonDTO } | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_PRODUCTS_VIEW);

    const useCase = resolve<GetLicenseAddonUseCase>(
      DI_TOKENS.GetLicenseAddonUseCase,
    );

    const addon = await useCase.execute(id);

    if (!addon) {
      return {
        success: false,
        error: "License addon not found",
      };
    }

    return {
      success: true,
      data: LicenseAddonPresenter.toDTO(addon),
    };
  } catch (error) {
    console.error("Error getting license addon:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get license addon",
    };
  }
}

/**
 * List license addons with optional filters
 */
export async function listLicenseAddons(params?: {
  licenseProductId?: string;
  activeOnly?: boolean;
}): Promise<
  { success: true; data: LicenseAddonDTO[] } | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_PRODUCTS_VIEW);

    const useCase = resolve<ListLicenseAddonsUseCase>(
      DI_TOKENS.ListLicenseAddonsUseCase,
    );

    const addons = await useCase.execute(params ?? {});

    return {
      success: true,
      data: LicenseAddonPresenter.toDTOList(addons),
    };
  } catch (error) {
    console.error("Error listing license addons:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to list license addons",
    };
  }
}

/**
 * Update a license addon
 */
export async function updateLicenseAddon(
  data: UpdateLicenseAddonDTO,
): Promise<
  { success: true; data: LicenseAddonDTO } | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_PRODUCTS_UPDATE);

    const validated = UpdateLicenseAddonSchema.parse(data);

    const useCase = resolve<UpdateLicenseAddonUseCase>(
      DI_TOKENS.UpdateLicenseAddonUseCase,
    );

    const addon = await useCase.execute({
      id: validated.id,
      name: validated.name,
      description: validated.description,
      isActive: validated.isActive,
    });

    revalidatePath("/license-products");

    return {
      success: true,
      data: LicenseAddonPresenter.toDTO(addon),
    };
  } catch (error) {
    console.error("Error updating license addon:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update license addon",
    };
  }
}

/**
 * Delete a license addon
 */
export async function deleteLicenseAddon(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_PRODUCTS_UPDATE);

    const useCase = resolve<DeleteLicenseAddonUseCase>(
      DI_TOKENS.DeleteLicenseAddonUseCase,
    );

    await useCase.execute(id);

    revalidatePath("/license-products");

    return { success: true };
  } catch (error) {
    console.error("Error deleting license addon:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete license addon",
    };
  }
}
