"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { handleControllerError } from "./error-handler";
import type { ActionResponse, BulkCreateResult } from "./types";
import type { PrismaClient } from "@/generated/prisma/server";
import type {
  CIRelationshipDTO,
  CreateCIRelationshipDTO,
} from "@/interface-adapters/dtos/generated/ci-relationship.dto";
import { CreateCIRelationshipSchema } from "@/interface-adapters/dtos/generated/ci-relationship.dto";
import { CIRelationshipPresenter } from "@/interface-adapters/presenters/ci-relationship.presenter";
import type { CreateCIRelationshipUseCase } from "@/core/use-cases/cmdb/ci-relationship/create-ci-relationship.use-case";
import type { GetCIRelationshipUseCase } from "@/core/use-cases/cmdb/ci-relationship/get-ci-relationship.use-case";
import type { ListCIRelationshipsUseCase } from "@/core/use-cases/cmdb/ci-relationship/list-ci-relationships.use-case";
import type { UpdateCIRelationshipUseCase } from "@/core/use-cases/cmdb/ci-relationship/update-ci-relationship.use-case";
import type { DeleteCIRelationshipUseCase } from "@/core/use-cases/cmdb/ci-relationship/delete-ci-relationship.use-case";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export async function createCIRelationshipAction(
  fromCiId: string,
  toCiId: string,
  relationshipTypeId: string,
  note?: string,
): Promise<ActionResponse<CIRelationshipDTO>> {
  try {
    await requirePermission(PERMISSIONS.CI_RELATIONSHIPS_CREATE);

    const container = getContainer();
    const useCase = container.get<CreateCIRelationshipUseCase>(
      DI_TOKENS.CreateCIRelationshipUseCase,
    );

    const relationship = await useCase.execute({
      fromCiId,
      toCiId,
      relationshipTypeId,
      note,
    });

    const dto = CIRelationshipPresenter.toDTO(relationship);

    return { success: true, data: dto };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createCIRelationshipAction" },
      "Failed to create CI relationship",
    );
  }
}

export async function getCIRelationshipAction(
  id: string,
): Promise<ActionResponse<CIRelationshipDTO>> {
  try {
    await requirePermission(PERMISSIONS.CI_RELATIONSHIPS_VIEW);

    const container = getContainer();
    const useCase = container.get<GetCIRelationshipUseCase>(
      DI_TOKENS.GetCIRelationshipUseCase,
    );

    const relationship = await useCase.execute({ id });
    if (!relationship) {
      return {
        success: false,
        error: "CI relationship not found",
      };
    }

    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    const [fromCi, toCi, relType] = await Promise.all([
      prisma.configurationItem.findUnique({
        where: { id: relationship.fromCiId },
        select: { name: true, ciClass: { select: { name: true } } },
      }),
      prisma.configurationItem.findUnique({
        where: { id: relationship.toCiId },
        select: { name: true, ciClass: { select: { name: true } } },
      }),
      prisma.relationshipType.findUnique({
        where: { id: relationship.relationshipTypeId },
        select: { name: true, code: true },
      }),
    ]);

    const dto = CIRelationshipPresenter.toDTO(relationship, {
      fromCiName: fromCi
        ? `${fromCi.name} (${fromCi.ciClass.name})`
        : undefined,
      toCiName: toCi ? `${toCi.name} (${toCi.ciClass.name})` : undefined,
      relationshipTypeName: relType?.name,
      relationshipTypeCode: relType?.code,
    });

    return { success: true, data: dto };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getCIRelationshipAction" },
      "Failed to get CI relationship",
    );
  }
}

export async function listCIRelationshipsAction(
  ciId?: string,
  relationshipTypeId?: string,
  activeOnly?: boolean,
): Promise<ActionResponse<CIRelationshipDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.CI_RELATIONSHIPS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListCIRelationshipsUseCase>(
      DI_TOKENS.ListCIRelationshipsUseCase,
    );

    const relationships = await useCase.execute({
      ciId,
      relationshipTypeId,
      activeOnly,
    });

    if (relationships.length === 0) {
      return { success: true, data: [] };
    }

    const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);

    const fromIds = Array.from(new Set(relationships.map((r) => r.fromCiId)));
    const toIds = Array.from(new Set(relationships.map((r) => r.toCiId)));
    const relTypeIds = Array.from(
      new Set(relationships.map((r) => r.relationshipTypeId)),
    );

    const [fromCis, toCis, relTypes] = await Promise.all([
      prisma.configurationItem.findMany({
        where: { id: { in: fromIds } },
        select: { id: true, name: true, ciClass: { select: { name: true } } },
      }),
      prisma.configurationItem.findMany({
        where: { id: { in: toIds } },
        select: { id: true, name: true, ciClass: { select: { name: true } } },
      }),
      prisma.relationshipType.findMany({
        where: { id: { in: relTypeIds } },
        select: { id: true, name: true, code: true },
      }),
    ]);

    const fromMap = new Map(
      fromCis.map((ci) => [ci.id, `${ci.name} (${ci.ciClass.name})`]),
    );
    const toMap = new Map(
      toCis.map((ci) => [ci.id, `${ci.name} (${ci.ciClass.name})`]),
    );
    const relTypeMap = new Map(
      relTypes.map((rt) => [rt.id, { name: rt.name, code: rt.code }]),
    );

    const dtos = relationships.map((relationship) =>
      CIRelationshipPresenter.toDTO(relationship, {
        fromCiName: fromMap.get(relationship.fromCiId),
        toCiName: toMap.get(relationship.toCiId),
        relationshipTypeName: relTypeMap.get(relationship.relationshipTypeId)
          ?.name,
        relationshipTypeCode: relTypeMap.get(relationship.relationshipTypeId)
          ?.code,
      }),
    );

    return { success: true, data: dtos };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listCIRelationshipsAction" },
      "Failed to list CI relationships",
    );
  }
}

export async function updateCIRelationshipAction(
  id: string,
  updates: { validTo?: Date | null; note?: string | null; isActive?: boolean },
): Promise<ActionResponse<CIRelationshipDTO>> {
  try {
    await requirePermission(PERMISSIONS.CI_RELATIONSHIPS_UPDATE);

    const container = getContainer();
    const useCase = container.get<UpdateCIRelationshipUseCase>(
      DI_TOKENS.UpdateCIRelationshipUseCase,
    );

    const relationship = await useCase.execute({ id, updates });
    const dto = CIRelationshipPresenter.toDTO(relationship);

    return { success: true, data: dto };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateCIRelationshipAction" },
      "Failed to update CI relationship",
    );
  }
}

export async function deleteCIRelationshipAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.CI_RELATIONSHIPS_DELETE);

    const container = getContainer();
    const useCase = container.get<DeleteCIRelationshipUseCase>(
      DI_TOKENS.DeleteCIRelationshipUseCase,
    );

    await useCase.execute({ id });

    return { success: true, data: undefined };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteCIRelationshipAction" },
      "Failed to delete CI relationship",
    );
  }
}

export async function bulkCreateCIRelationshipsAction(
  items: CreateCIRelationshipDTO[],
): Promise<BulkCreateResult> {
  try {
    await requirePermission(PERMISSIONS.CI_RELATIONSHIPS_CREATE);

    const container = getContainer();
    const useCase = container.get<CreateCIRelationshipUseCase>(
      DI_TOKENS.CreateCIRelationshipUseCase,
    );

    const errors: Array<{ index: number; name: string; error: string }> = [];
    let successCount = 0;

    // Process items sequentially to avoid overwhelming the database
    for (let i = 0; i < items.length; i++) {
      const itemData = items[i];
      try {
        const validated = CreateCIRelationshipSchema.parse(itemData);

        await useCase.execute({
          fromCiId: validated.fromCiId,
          toCiId: validated.toCiId,
          relationshipTypeId: validated.relationshipTypeId,
          validFrom: validated.validFrom ?? undefined,
          validTo: validated.validTo ?? undefined,
          note: validated.note ?? undefined,
        });

        successCount++;
      } catch (error) {
        errors.push({
          index: i,
          name: itemData.fromCiId || "Unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    revalidatePath("/ci-relationships");

    return {
      success: errors.length === 0,
      successCount,
      errorCount: errors.length,
      errors,
    };
  } catch (_error) {
    return {
      success: false,
      successCount: 0,
      errorCount: 0,
      errors: [],
    };
  }
}
