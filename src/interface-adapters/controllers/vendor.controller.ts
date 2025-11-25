/**
 * Vendor Controller
 * Server actions for Vendor CRUD operations
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateVendorSchema,
  UpdateVendorSchema,
  VendorIdSchema,
  type CreateVendorDTO,
  type UpdateVendorDTO,
} from "../dtos/generated/vendor.dto";
import {
  presentVendor,
  presentVendors,
  type VendorDTO,
} from "../presenters/vendor.presenter";
import type {
  CreateVendorUseCase,
  ListVendorsUseCase,
  GetVendorUseCase,
  UpdateVendorUseCase,
  DeleteVendorUseCase,
} from "@/core/use-cases/foundation/vendor";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export async function createVendorAction(
  data: CreateVendorDTO,
): Promise<ActionResponse<VendorDTO>> {
  try {
    await requirePermission(PERMISSIONS.VENDORS_CREATE);

    const validated = CreateVendorSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<CreateVendorUseCase>(
      DI_TOKENS.CreateVendorUseCase,
    );

    const vendor = await useCase.execute({
      name: validated.name,
      code: validated.code,
      legalName: validated.legalName ?? undefined,
      description: validated.description ?? undefined,
      vendorType: validated.vendorType,
      website: validated.website ?? undefined,
      email: validated.email ?? undefined,
      phone: validated.phone ?? undefined,
      address: validated.address ?? undefined,
      city: validated.city ?? undefined,
      state: validated.state ?? undefined,
      country: validated.country ?? undefined,
      postalCode: validated.postalCode ?? undefined,
      taxId: validated.taxId ?? undefined,
      paymentTerms: validated.paymentTerms ?? undefined,
      isPreferred: validated.isPreferred ?? false,
      tags: validated.tags ?? [],
      note: validated.note ?? undefined,
      metadata: validated.metadata ?? undefined,
    });

    revalidatePath("/vendors");

    return {
      success: true,
      data: presentVendor(vendor),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createVendorAction" },
      "Failed to create vendor",
    );
  }
}

export async function listVendorsAction(): Promise<
  ActionResponse<VendorDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.VENDORS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListVendorsUseCase>(
      DI_TOKENS.ListVendorsUseCase,
    );

    const vendors = await useCase.execute();

    return {
      success: true,
      data: presentVendors(vendors),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listVendorsAction" },
      "Failed to list vendors",
    );
  }
}

export async function getVendorAction(
  id: string,
): Promise<ActionResponse<VendorDTO>> {
  try {
    await requirePermission(PERMISSIONS.VENDORS_VIEW);

    const validated = VendorIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<GetVendorUseCase>(DI_TOKENS.GetVendorUseCase);

    const vendor = await useCase.execute(validated.id);

    if (!vendor) {
      return {
        success: false,
        error: "Vendor not found",
      };
    }

    return {
      success: true,
      data: presentVendor(vendor),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getVendorAction" },
      "Failed to get vendor",
    );
  }
}

export async function updateVendorAction(
  data: UpdateVendorDTO,
): Promise<ActionResponse<VendorDTO>> {
  try {
    await requirePermission(PERMISSIONS.VENDORS_UPDATE);

    const validated = UpdateVendorSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateVendorUseCase>(
      DI_TOKENS.UpdateVendorUseCase,
    );

    const vendor = await useCase.execute({
      id: validated.id,
      name: validated.name,
      code: validated.code,
      legalName: validated.legalName,
      description: validated.description,
      vendorType: validated.vendorType,
      website: validated.website,
      email: validated.email,
      phone: validated.phone,
      address: validated.address,
      city: validated.city,
      state: validated.state,
      country: validated.country,
      postalCode: validated.postalCode,
      taxId: validated.taxId,
      paymentTerms: validated.paymentTerms,
      isPreferred: validated.isPreferred,
      tags: validated.tags,
      note: validated.note,
      metadata: validated.metadata,
    });

    revalidatePath("/vendors");
    revalidatePath(`/vendors/${validated.id}`);

    return {
      success: true,
      data: presentVendor(vendor),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateVendorAction" },
      "Failed to update vendor",
    );
  }
}

export async function deleteVendorAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.VENDORS_DELETE);

    const validated = VendorIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<DeleteVendorUseCase>(
      DI_TOKENS.DeleteVendorUseCase,
    );

    await useCase.execute(validated.id);

    revalidatePath("/vendors");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteVendorAction" },
      "Failed to delete vendor",
    );
  }
}

export async function bulkCreateVendorsAction(
  vendorsData: CreateVendorDTO[],
): Promise<
  ActionResponse<{
    successCount: number;
    failureCount: number;
    failures: Array<{ index: number; code: string; error: string }>;
  }>
> {
  try {
    await requirePermission(PERMISSIONS.VENDORS_CREATE);

    const container = getContainer();
    const useCase = container.get<CreateVendorUseCase>(
      DI_TOKENS.CreateVendorUseCase,
    );

    const results = {
      successCount: 0,
      failureCount: 0,
      failures: [] as Array<{ index: number; code: string; error: string }>,
    };

    // Process vendors sequentially to avoid overwhelming the database
    for (let i = 0; i < vendorsData.length; i++) {
      const vendorData = vendorsData[i];
      try {
        const validated = CreateVendorSchema.parse(vendorData);

        await useCase.execute({
          name: validated.name,
          code: validated.code,
          legalName: validated.legalName ?? undefined,
          description: validated.description ?? undefined,
          vendorType: validated.vendorType,
          website: validated.website ?? undefined,
          email: validated.email ?? undefined,
          phone: validated.phone ?? undefined,
          address: validated.address ?? undefined,
          city: validated.city ?? undefined,
          state: validated.state ?? undefined,
          country: validated.country ?? undefined,
          postalCode: validated.postalCode ?? undefined,
          taxId: validated.taxId ?? undefined,
          paymentTerms: validated.paymentTerms ?? undefined,
          isPreferred: validated.isPreferred ?? false,
          tags: validated.tags ?? [],
          note: validated.note ?? undefined,
          metadata: validated.metadata ?? undefined,
        });

        results.successCount++;
      } catch (error) {
        results.failureCount++;
        results.failures.push({
          index: i,
          code: vendorData.code || "Unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    revalidatePath("/vendors");

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "bulkCreateVendorsAction" },
      "Failed to bulk create vendors",
    );
  }
}
