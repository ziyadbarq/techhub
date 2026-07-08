/**
 * LicenseProductField Controller
 * Handles HTTP requests and responses for license product field operations
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer, ensureModuleLoaded } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type {
  CreateLicenseProductFieldUseCase,
  GetLicenseProductFieldUseCase,
  ListLicenseProductFieldsUseCase,
  UpdateLicenseProductFieldUseCase,
  DeleteLicenseProductFieldUseCase,
} from "@/core/use-cases/license-product-field";
import {
  CreateLicenseProductFieldSchema,
  UpdateLicenseProductFieldSchema,
  type CreateLicenseProductFieldDTO,
  type UpdateLicenseProductFieldDTO,
} from "@/interface-adapters/dtos/generated/license-product-field.dto";
import {
  LicenseProductFieldPresenter,
  type LicenseProductFieldDTO,
  type EnrichedLicenseProductFieldDTO,
} from "@/interface-adapters/presenters/license-product-field.presenter";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

import type { BulkCreateResult } from "./types";
import type { ILicenseProductFieldRepository } from "@/core/repositories/license-product-field.repository.interface";

/**
 * Create a new license product field
 */
export async function createLicenseProductField(
  data: CreateLicenseProductFieldDTO,
): Promise<
  | { success: true; data: LicenseProductFieldDTO }
  | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_PRODUCT_FIELDS_CREATE);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("licenses");

    // Validate input
    const validatedData = CreateLicenseProductFieldSchema.parse(data);

    // Get use case from DI container
    const container = getContainer();
    const useCase = container.get<CreateLicenseProductFieldUseCase>(
      DI_TOKENS.CreateLicenseProductFieldUseCase,
    );

    // Execute use case
    const field = await useCase.execute(validatedData);

    // Revalidate relevant paths
    revalidatePath("/license-products");

    return {
      success: true,
      data: LicenseProductFieldPresenter.toDTO(field),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create license product field",
    };
  }
}

/**
 * Get a license product field by ID
 */
export async function getLicenseProductField(
  id: string,
): Promise<
  | { success: true; data: LicenseProductFieldDTO }
  | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_PRODUCT_FIELDS_VIEW);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("licenses");

    const container = getContainer();
    const useCase = container.get<GetLicenseProductFieldUseCase>(
      DI_TOKENS.GetLicenseProductFieldUseCase,
    );

    const field = await useCase.execute({ id });

    return {
      success: true,
      data: LicenseProductFieldPresenter.toDTO(field),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get license product field",
    };
  }
}

/**
 * List license product fields
 */
export async function listLicenseProductFields(
  licenseProductId: string,
): Promise<
  | { success: true; data: LicenseProductFieldDTO[] }
  | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_PRODUCT_FIELDS_VIEW);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("licenses");

    const container = getContainer();
    const useCase = container.get<ListLicenseProductFieldsUseCase>(
      DI_TOKENS.ListLicenseProductFieldsUseCase,
    );

    const fields = await useCase.execute({ licenseProductId });

    return {
      success: true,
      data: LicenseProductFieldPresenter.toDTOList(fields),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to list license product fields",
    };
  }
}

/**
 * Update a license product field
 */
export async function updateLicenseProductField(
  id: string,
  data: UpdateLicenseProductFieldDTO,
): Promise<
  | { success: true; data: LicenseProductFieldDTO }
  | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_PRODUCT_FIELDS_UPDATE);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("licenses");

    // Validate input
    const validatedData = UpdateLicenseProductFieldSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateLicenseProductFieldUseCase>(
      DI_TOKENS.UpdateLicenseProductFieldUseCase,
    );

    const field = await useCase.execute({
      id,
      ...validatedData,
    });

    // Revalidate relevant paths
    revalidatePath("/license-products");

    return {
      success: true,
      data: LicenseProductFieldPresenter.toDTO(field),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update license product field",
    };
  }
}

/**
 * Delete a license product field
 */
export async function deleteLicenseProductField(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_PRODUCT_FIELDS_DELETE);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("licenses");

    const container = getContainer();
    const useCase = container.get<DeleteLicenseProductFieldUseCase>(
      DI_TOKENS.DeleteLicenseProductFieldUseCase,
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
          : "Failed to delete license product field",
    };
  }
}

/**
 * Bulk create license product fields
 *
 * @param items - Array of license product field creation data
 * @returns BulkCreateResult containing success count, error count, and error details
 */
export async function bulkCreateLicenseProductFieldsAction(
  items: CreateLicenseProductFieldDTO[],
): Promise<BulkCreateResult> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_PRODUCT_FIELDS_CREATE);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("licenses");

    const container = getContainer();
    const useCase = container.get<CreateLicenseProductFieldUseCase>(
      DI_TOKENS.CreateLicenseProductFieldUseCase,
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
        const validated = CreateLicenseProductFieldSchema.parse(item);

        await useCase.execute({
          licenseProductId: validated.licenseProductId,
          fieldDefinitionId: validated.fieldDefinitionId,
          isRequired: validated.isRequired ?? false,
          isVisible: validated.isVisible ?? true,
          uiOrder: validated.uiOrder ?? 0,
          defaultValue: validated.defaultValue ?? undefined,
        });

        results.successCount++;
      } catch (error) {
        results.errorCount++;
        results.success = false;
        results.errors.push({
          index: i,
          name: item.licenseProductId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    revalidatePath("/license-product-fields");

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

/**
 * List enriched license product fields for a specific license product
 * Returns fields with full FieldDefinition details for form rendering
 */
export async function listEnrichedLicenseProductFieldsAction(
  licenseProductId: string,
): Promise<
  | { success: true; data: EnrichedLicenseProductFieldDTO[] }
  | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.LICENSE_PRODUCT_FIELDS_VIEW);

    // Ensure Licenses module is loaded (HEAVY tier, lazy loaded)
    await ensureModuleLoaded("licenses");

    // Use repository directly for enriched query
    const container = getContainer();
    const repository = container.get<ILicenseProductFieldRepository>(
      DI_TOKENS.ILicenseProductFieldRepository,
    );
    const fieldsWithDefinition =
      await repository.findByLicenseProductIdWithDefinition(licenseProductId);

    return {
      success: true,
      data: LicenseProductFieldPresenter.toEnrichedDTOList(
        fieldsWithDefinition,
      ),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to list enriched license product fields",
    };
  }
}
