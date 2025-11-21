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
