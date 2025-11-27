/**
 * Organization Unit Controller
 * Server actions for Organization Unit CRUD operations
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateOrganizationUnitSchema,
  UpdateOrganizationUnitSchema,
  OrganizationUnitIdSchema,
  type CreateOrganizationUnitDTO,
  type UpdateOrganizationUnitDTO,
} from "../dtos/generated/organization-unit.dto";
import {
  presentOrganizationUnit,
  presentOrganizationUnits,
  type OrganizationUnitDTO,
} from "../presenters/organization-unit.presenter";
import type {
  CreateOrganizationUnitUseCase,
  ListOrganizationUnitsUseCase,
  GetOrganizationUnitUseCase,
  UpdateOrganizationUnitUseCase,
  DeleteOrganizationUnitUseCase,
} from "@/core/use-cases/foundation/organization-unit";
import type { IOrganizationUnitRepository } from "@/core/repositories/organization-unit.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export async function createOrganizationUnitAction(
  data: CreateOrganizationUnitDTO,
): Promise<ActionResponse<OrganizationUnitDTO>> {
  try {
    await requirePermission(PERMISSIONS.ORGANIZATION_UNITS_CREATE);

    const validated = CreateOrganizationUnitSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<CreateOrganizationUnitUseCase>(
      DI_TOKENS.CreateOrganizationUnitUseCase,
    );

    const unit = await useCase.execute({
      name: validated.name,
      code: validated.code,
      description: validated.description ?? undefined,
      unitType: validated.unitType,
      level: validated.level ?? 0,
      parentId: validated.parentId ?? undefined,
      managerId: validated.managerId ?? undefined,
      costCenter: validated.costCenter ?? undefined,
      metadata: validated.metadata ?? undefined,
    });

    revalidatePath("/organization-units");

    return {
      success: true,
      data: presentOrganizationUnit(unit),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createOrganizationUnitAction" },
      "Failed to create organization unit",
    );
  }
}

export async function listOrganizationUnitsAction(): Promise<
  ActionResponse<OrganizationUnitDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.ORGANIZATION_UNITS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListOrganizationUnitsUseCase>(
      DI_TOKENS.ListOrganizationUnitsUseCase,
    );

    const units = await useCase.execute();

    return {
      success: true,
      data: presentOrganizationUnits(units),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listOrganizationUnitsAction" },
      "Failed to list organization units",
    );
  }
}

export async function getOrganizationUnitAction(
  id: string,
): Promise<ActionResponse<OrganizationUnitDTO>> {
  try {
    await requirePermission(PERMISSIONS.ORGANIZATION_UNITS_VIEW);

    const validated = OrganizationUnitIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<GetOrganizationUnitUseCase>(
      DI_TOKENS.GetOrganizationUnitUseCase,
    );

    const unit = await useCase.execute(validated.id);

    if (!unit) {
      return {
        success: false,
        error: "Organization unit not found",
      };
    }

    return {
      success: true,
      data: presentOrganizationUnit(unit),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getOrganizationUnitAction" },
      "Failed to get organization unit",
    );
  }
}

export async function updateOrganizationUnitAction(
  data: UpdateOrganizationUnitDTO,
): Promise<ActionResponse<OrganizationUnitDTO>> {
  try {
    await requirePermission(PERMISSIONS.ORGANIZATION_UNITS_UPDATE);

    const validated = UpdateOrganizationUnitSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateOrganizationUnitUseCase>(
      DI_TOKENS.UpdateOrganizationUnitUseCase,
    );

    const unit = await useCase.execute({
      id: validated.id,
      name: validated.name,
      code: validated.code,
      description: validated.description,
      unitType: validated.unitType,
      parentId: validated.parentId,
      managerId: validated.managerId,
      costCenter: validated.costCenter,
      metadata: validated.metadata,
    });

    revalidatePath("/organization-units");
    revalidatePath(`/organization-units/${validated.id}`);

    return {
      success: true,
      data: presentOrganizationUnit(unit),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateOrganizationUnitAction" },
      "Failed to update organization unit",
    );
  }
}

export async function deleteOrganizationUnitAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.ORGANIZATION_UNITS_DELETE);

    const validated = OrganizationUnitIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<DeleteOrganizationUnitUseCase>(
      DI_TOKENS.DeleteOrganizationUnitUseCase,
    );

    await useCase.execute(validated.id);

    revalidatePath("/organization-units");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteOrganizationUnitAction" },
      "Failed to delete organization unit",
    );
  }
}

export async function bulkCreateOrganizationUnitsAction(
  itemsData: CreateOrganizationUnitDTO[],
): Promise<
  ActionResponse<{
    successCount: number;
    failureCount: number;
    failures: Array<{ index: number; code: string; error: string }>;
  }>
> {
  try {
    await requirePermission(PERMISSIONS.ORGANIZATION_UNITS_CREATE);

    const container = getContainer();
    const useCase = container.get<CreateOrganizationUnitUseCase>(
      DI_TOKENS.CreateOrganizationUnitUseCase,
    );

    const results = {
      successCount: 0,
      failureCount: 0,
      failures: [] as Array<{ index: number; code: string; error: string }>,
    };

    // Process organization units sequentially to avoid overwhelming the database
    for (let i = 0; i < itemsData.length; i++) {
      const itemData = itemsData[i];
      try {
        const validated = CreateOrganizationUnitSchema.parse(itemData);

        await useCase.execute({
          name: validated.name,
          code: validated.code,
          description: validated.description ?? undefined,
          unitType: validated.unitType,
          level: validated.level ?? 0,
          parentId: validated.parentId ?? undefined,
          managerId: validated.managerId ?? undefined,
          costCenter: validated.costCenter ?? undefined,
          metadata: validated.metadata ?? undefined,
        });

        results.successCount++;
      } catch (error) {
        results.failureCount++;
        results.failures.push({
          index: i,
          code: itemData.code || itemData.name || "Unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    revalidatePath("/organization-units");

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "bulkCreateOrganizationUnitsAction" },
      "Failed to bulk create organization units",
    );
  }
}

/**
 * Check for existing organization units by code (batch lookup for duplicate detection)
 */
export async function checkOrganizationUnitDuplicatesAction(
  codes: string[],
): Promise<{
  success: boolean;
  data?: {
    duplicates: Array<{ id: string; code: string; name: string }>;
    duplicateCount: number;
  };
  error?: string;
}> {
  try {
    await requirePermission(PERMISSIONS.ORGANIZATION_UNITS_CREATE);

    const container = getContainer();
    const repository = container.get<IOrganizationUnitRepository>(
      DI_TOKENS.IOrganizationUnitRepository,
    );

    const validCodes = codes.filter(
      (c) => c !== null && c !== undefined && c.trim() !== "",
    );

    if (validCodes.length === 0) {
      return { success: true, data: { duplicates: [], duplicateCount: 0 } };
    }

    const existingUnits = await repository.findByCodes(validCodes);

    const duplicates = existingUnits.map((unit) => ({
      id: unit.id,
      code: unit.code,
      name: unit.name,
    }));

    return {
      success: true,
      data: { duplicates, duplicateCount: duplicates.length },
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
 * Bulk upsert organization units (create or update based on duplicate strategy)
 */
export async function bulkUpsertOrganizationUnitsAction(
  unitsData: Record<string, unknown>[],
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
    await requirePermission(PERMISSIONS.ORGANIZATION_UNITS_CREATE);

    const container = getContainer();
    const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);
    const repository = container.get<IOrganizationUnitRepository>(
      DI_TOKENS.IOrganizationUnitRepository,
    );
    const createUseCase = container.get<CreateOrganizationUnitUseCase>(
      DI_TOKENS.CreateOrganizationUnitUseCase,
    );
    const updateUseCase = container.get<UpdateOrganizationUnitUseCase>(
      DI_TOKENS.UpdateOrganizationUnitUseCase,
    );

    const log = logger.child({
      controller: "orgUnit.bulkUpsert",
      rows: unitsData.length,
      strategy,
    });
    log.info("Bulk organization unit upsert started");

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

    const codes = unitsData
      .map((u) => u.code as string | undefined)
      .filter((c): c is string => !!c && c.trim() !== "");

    const existingUnits = await repository.findByCodes(codes);
    const existingByCode = new Map(
      existingUnits.map((u) => [u.code.toUpperCase(), u]),
    );

    for (let i = 0; i < unitsData.length; i++) {
      const unitData = unitsData[i];
      const identifier =
        (unitData.code as string) ||
        (unitData.name as string) ||
        `Row ${i + 1}`;

      try {
        const validated = CreateOrganizationUnitSchema.parse(unitData);
        const existingUnit = validated.code
          ? existingByCode.get(validated.code.toUpperCase())
          : null;

        if (existingUnit) {
          switch (strategy) {
            case "skip":
              results.skipCount++;
              results.skipped.push({
                identifier,
                reason: `Code "${validated.code}" already exists`,
              });
              break;
            case "overwrite": {
              await updateUseCase.execute({
                id: existingUnit.id,
                name: validated.name || undefined,
                description: validated.description ?? undefined,
                unitType: validated.unitType || undefined,
                parentId: validated.parentId ?? undefined,
                managerId: validated.managerId ?? undefined,
                costCenter: validated.costCenter ?? undefined,
                metadata: validated.metadata ?? undefined,
              });
              results.updatedCount++;
              results.updated.push({
                code: existingUnit.code,
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
              const modifiedCode = `${validated.code}-COPY-${Date.now()}`;
              await createUseCase.execute({
                name: validated.name,
                code: modifiedCode,
                description: validated.description ?? undefined,
                unitType: validated.unitType,
                level: validated.level ?? 0,
                parentId: validated.parentId ?? undefined,
                managerId: validated.managerId ?? undefined,
                costCenter: validated.costCenter ?? undefined,
                metadata: validated.metadata ?? undefined,
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
          await createUseCase.execute({
            name: validated.name,
            code: validated.code,
            description: validated.description ?? undefined,
            unitType: validated.unitType,
            level: validated.level ?? 0,
            parentId: validated.parentId ?? undefined,
            managerId: validated.managerId ?? undefined,
            costCenter: validated.costCenter ?? undefined,
            metadata: validated.metadata ?? undefined,
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

    revalidatePath("/organization-units");
    log.info("Bulk organization unit upsert completed", results);

    return { success: true, data: results };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to bulk upsert organization units",
    };
  }
}
