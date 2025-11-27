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
import type { IVendorRepository } from "@/core/repositories/vendor.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
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

/**
 * Check for existing vendors by code (batch lookup for duplicate detection)
 * Uses code as the primary unique field for duplicate detection
 */
export async function checkVendorDuplicatesAction(codes: string[]): Promise<{
  success: boolean;
  data?: {
    duplicates: Array<{ id: string; code: string; name: string }>;
    duplicateCount: number;
  };
  error?: string;
}> {
  try {
    await requirePermission(PERMISSIONS.VENDORS_CREATE);

    const container = getContainer();
    const repository = container.get<IVendorRepository>(
      DI_TOKENS.IVendorRepository,
    );

    // Filter out empty values
    const validCodes = codes.filter(
      (c) => c !== null && c !== undefined && c.trim() !== "",
    );

    if (validCodes.length === 0) {
      return {
        success: true,
        data: { duplicates: [], duplicateCount: 0 },
      };
    }

    // Batch lookup existing vendors by code
    const existingVendors = await repository.findByCodes(validCodes);

    const duplicates = existingVendors.map((vendor) => ({
      id: vendor.id,
      code: vendor.code,
      name: vendor.name,
    }));

    return {
      success: true,
      data: {
        duplicates,
        duplicateCount: duplicates.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to check duplicates",
    };
  }
}

/**
 * Bulk upsert vendors (create or update based on duplicate strategy)
 * For "overwrite" strategy: updates existing records, creates new ones
 * For "skip" strategy: skips existing records, creates new ones
 */
export async function bulkUpsertVendorsAction(
  vendorsData: Record<string, unknown>[],
  strategy: "skip" | "overwrite" | "fail" | "append",
): Promise<{
  success: boolean;
  data?: {
    createdCount: number;
    updatedCount: number;
    skipCount: number;
    failureCount: number;
    created?: Array<{ code: string; name: string }>;
    updated?: Array<{ code: string; name: string }>;
    skipped?: Array<{ identifier: string; reason: string }>;
    failures?: Array<{ index: number; identifier: string; error: string }>;
  };
  error?: string;
}> {
  try {
    await requirePermission(PERMISSIONS.VENDORS_CREATE);

    const container = getContainer();
    const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);
    const repository = container.get<IVendorRepository>(
      DI_TOKENS.IVendorRepository,
    );
    const createUseCase = container.get<CreateVendorUseCase>(
      DI_TOKENS.CreateVendorUseCase,
    );
    const updateUseCase = container.get<UpdateVendorUseCase>(
      DI_TOKENS.UpdateVendorUseCase,
    );

    const log = logger.child({
      controller: "vendor.bulkUpsert",
      rows: vendorsData.length,
      strategy,
    });
    log.info("Bulk vendor upsert started");

    const results = {
      createdCount: 0,
      updatedCount: 0,
      skipCount: 0,
      failureCount: 0,
      created: [] as Array<{ code: string; name: string }>,
      updated: [] as Array<{ code: string; name: string }>,
      skipped: [] as Array<{ identifier: string; reason: string }>,
      failures: [] as Array<{
        index: number;
        identifier: string;
        error: string;
      }>,
    };

    // Step 1: Collect codes for batch lookup
    const codes = vendorsData
      .map((v) => v.code as string | undefined)
      .filter((c): c is string => !!c && c.trim() !== "");

    // Step 2: Batch lookup existing vendors
    const existingVendors = await repository.findByCodes(codes);
    const existingByCode = new Map(
      existingVendors.map((v) => [v.code.toUpperCase(), v]),
    );

    // Step 3: Process each record
    for (let i = 0; i < vendorsData.length; i++) {
      const vendorData = vendorsData[i];
      const identifier =
        (vendorData.code as string) ||
        (vendorData.name as string) ||
        `Row ${i + 1}`;

      try {
        const validated = CreateVendorSchema.parse(vendorData);
        const existingVendor = validated.code
          ? existingByCode.get(validated.code.toUpperCase())
          : null;

        if (existingVendor) {
          // Handle duplicate based on strategy
          switch (strategy) {
            case "skip":
              results.skipCount++;
              results.skipped.push({
                identifier,
                reason: `Code "${validated.code}" already exists`,
              });
              break;

            case "overwrite": {
              // Merge/patch: only update non-empty fields from import
              const updateData: Record<string, unknown> = {
                id: existingVendor.id,
              };
              if (validated.name) updateData.name = validated.name;
              if (validated.legalName)
                updateData.legalName = validated.legalName;
              if (validated.description)
                updateData.description = validated.description;
              if (validated.vendorType)
                updateData.vendorType = validated.vendorType;
              if (validated.website) updateData.website = validated.website;
              if (validated.email) updateData.email = validated.email;
              if (validated.phone) updateData.phone = validated.phone;
              if (validated.address) updateData.address = validated.address;
              if (validated.city) updateData.city = validated.city;
              if (validated.state) updateData.state = validated.state;
              if (validated.country) updateData.country = validated.country;
              if (validated.postalCode)
                updateData.postalCode = validated.postalCode;
              if (validated.taxId) updateData.taxId = validated.taxId;
              if (validated.note) updateData.note = validated.note;

              await updateUseCase.execute(updateData as UpdateVendorDTO);
              results.updatedCount++;
              results.updated.push({
                code: existingVendor.code,
                name: validated.name,
              });
              break;
            }

            case "fail":
              results.failureCount++;
              results.failures.push({
                index: i,
                identifier,
                error: `Duplicate code "${validated.code}" not allowed`,
              });
              break;

            case "append": {
              // Create with modified code
              const modifiedCode = `${validated.code}-COPY-${Date.now()}`;
              await createUseCase.execute({
                name: validated.name,
                code: modifiedCode,
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
                note: validated.note ?? undefined,
              });
              results.createdCount++;
              results.created.push({
                code: modifiedCode,
                name: validated.name,
              });
              break;
            }
          }
        } else {
          // No duplicate - create new record
          await createUseCase.execute({
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
            note: validated.note ?? undefined,
          });
          results.createdCount++;
          results.created.push({
            code: validated.code || "AUTO",
            name: validated.name,
          });
        }
      } catch (error) {
        results.failureCount++;
        results.failures.push({
          index: i,
          identifier,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    revalidatePath("/vendors");

    log.info("Bulk vendor upsert completed", {
      createdCount: results.createdCount,
      updatedCount: results.updatedCount,
      skipCount: results.skipCount,
      failureCount: results.failureCount,
    });

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to bulk upsert vendors",
    };
  }
}
