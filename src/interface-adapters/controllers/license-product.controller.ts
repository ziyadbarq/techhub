/**
 * LicenseProduct Controller
 * Handles HTTP requests and responses for license product operations
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer, ensureModuleLoaded } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import type {
  CreateLicenseProductUseCase,
  GetLicenseProductUseCase,
  ListLicenseProductsUseCase,
  UpdateLicenseProductUseCase,
  DeleteLicenseProductUseCase,
} from "@/core/use-cases/license-product";
import {
  CreateLicenseProductSchema,
  UpdateLicenseProductSchema,
  type CreateLicenseProductDTO,
  type UpdateLicenseProductDTO,
} from "@/interface-adapters/dtos/generated/license-product.dto";
import {
  LicenseProductPresenter,
  type LicenseProductDTO,
} from "@/interface-adapters/presenters/license-product.presenter";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

/**
 * Create a new license product
 */
export async function createLicenseProduct(
  data: CreateLicenseProductDTO,
): Promise<
  { success: true; data: LicenseProductDTO } | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_PRODUCTS_CREATE);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("licenses");

    // Validate input
    const validatedData = CreateLicenseProductSchema.parse(data);

    // Get use case from DI container
    const container = getContainer();
    const useCase = container.get<CreateLicenseProductUseCase>(
      DI_TOKENS.CreateLicenseProductUseCase,
    );

    // Execute use case
    const licenseProduct = await useCase.execute(validatedData);

    // Revalidate relevant paths
    revalidatePath("/license-products");

    return {
      success: true,
      data: LicenseProductPresenter.toDTO(licenseProduct),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create license product",
    };
  }
}

/**
 * Get a license product by ID
 */
export async function getLicenseProduct(
  id: string,
): Promise<
  { success: true; data: LicenseProductDTO } | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_PRODUCTS_VIEW);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("licenses");

    const container = getContainer();
    const useCase = container.get<GetLicenseProductUseCase>(
      DI_TOKENS.GetLicenseProductUseCase,
    );

    const licenseProduct = await useCase.execute({ id });

    return {
      success: true,
      data: LicenseProductPresenter.toDTO(licenseProduct),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get license product",
    };
  }
}

/**
 * List all license products
 */
export async function listLicenseProducts(options?: {
  vendorId?: string;
}): Promise<
  | { success: true; data: LicenseProductDTO[] }
  | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_PRODUCTS_VIEW);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("licenses");

    const container = getContainer();
    const useCase = container.get<ListLicenseProductsUseCase>(
      DI_TOKENS.ListLicenseProductsUseCase,
    );

    const licenseProducts = await useCase.execute({
      vendorId: options?.vendorId,
    });

    return {
      success: true,
      data: LicenseProductPresenter.toDTOList(licenseProducts),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to list license products",
    };
  }
}

/**
 * Update a license product
 */
export async function updateLicenseProduct(
  id: string,
  data: UpdateLicenseProductDTO,
): Promise<
  { success: true; data: LicenseProductDTO } | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_PRODUCTS_UPDATE);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("licenses");

    // Validate input
    const validatedData = UpdateLicenseProductSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateLicenseProductUseCase>(
      DI_TOKENS.UpdateLicenseProductUseCase,
    );

    const licenseProduct = await useCase.execute({
      id,
      ...validatedData,
    });

    // Revalidate relevant paths
    revalidatePath("/license-products");
    revalidatePath(`/license-products/${id}`);

    return {
      success: true,
      data: LicenseProductPresenter.toDTO(licenseProduct),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update license product",
    };
  }
}

/**
 * Delete a license product
 */
export async function deleteLicenseProduct(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_PRODUCTS_DELETE);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("licenses");

    const container = getContainer();
    const useCase = container.get<DeleteLicenseProductUseCase>(
      DI_TOKENS.DeleteLicenseProductUseCase,
    );

    await useCase.execute({ id });

    // Revalidate relevant paths
    revalidatePath("/license-products");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete license product",
    };
  }
}

/**
 * Bulk create license products
 */
export async function bulkCreateLicenseProductsAction(
  itemsData: CreateLicenseProductDTO[],
): Promise<
  ActionResponse<{
    successCount: number;
    failureCount: number;
    failures: Array<{ index: number; code: string; error: string }>;
  }>
> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_PRODUCTS_CREATE);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("licenses");

    const container = getContainer();
    const useCase = container.get<CreateLicenseProductUseCase>(
      DI_TOKENS.CreateLicenseProductUseCase,
    );

    const results = {
      successCount: 0,
      failureCount: 0,
      failures: [] as Array<{ index: number; code: string; error: string }>,
    };

    // Process license products sequentially to avoid overwhelming the database
    for (let i = 0; i < itemsData.length; i++) {
      const licenseProductData = itemsData[i];
      try {
        const validated = CreateLicenseProductSchema.parse(licenseProductData);

        await useCase.execute({
          name: validated.name,
          code: validated.code ?? undefined,
          vendorId: validated.vendorId,
          metricType: validated.metricType,
          description: validated.description ?? undefined,
          lifecycleModelId: validated.lifecycleModelId ?? undefined,
        });

        results.successCount++;
      } catch (error) {
        results.failureCount++;
        results.failures.push({
          index: i,
          code: licenseProductData.code || "Unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    revalidatePath("/license-products");

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "bulkCreateLicenseProductsAction" },
      "Failed to bulk create license products",
    );
  }
}
