/**
 * AssetAssignment Controller
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse, BulkCreateResult } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateAssetAssignmentSchema,
  UpdateAssetAssignmentSchema,
  AssetAssignmentIdSchema,
  ListAssetAssignmentsSchema,
  ListConflictsSchema,
  UpdateConflictStatusSchema,
  type CreateAssetAssignmentDTO,
  type UpdateAssetAssignmentDTO,
  type ListAssetAssignmentsDTO,
  type ListConflictsDTO,
  type UpdateConflictStatusDTO,
} from "../dtos/generated/asset-assignment.dto";
import {
  presentAssetAssignment,
  presentAssetAssignments,
  type AssetAssignmentDTO,
  type AssetAssignmentEnrichment,
} from "../presenters/asset-assignment.presenter";
import type {
  CreateAssetAssignmentUseCase,
  ListAssetAssignmentsUseCase,
  GetAssetAssignmentUseCase,
  UpdateAssetAssignmentUseCase,
  DeleteAssetAssignmentUseCase,
  ListConflictsUseCase,
  UpdateConflictStatusUseCase,
} from "@/core/use-cases/asset/asset-assignment";
import type { ListAssetsUseCase } from "@/core/use-cases/asset/asset";
import type { ListPeopleUseCase } from "@/core/use-cases/foundation/person";
import type { ListOrganizationUnitsUseCase } from "@/core/use-cases/foundation/organization-unit";
import type { ListLocationsUseCase } from "@/core/use-cases/foundation/location";
import type { ListConfigurationItemsUseCase } from "@/core/use-cases/cmdb/configuration-item";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import type { AssetAssignment } from "@/core/domain/entities/asset-assignment.entity";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

/**
 * Enrich asset assignments with asset tags and assignee names
 */
async function enrichAssetAssignments(
  assignments: AssetAssignment[],
): Promise<Map<string, AssetAssignmentEnrichment>> {
  if (assignments.length === 0) {
    return new Map();
  }

  const container = getContainer();

  // Collect unique IDs by assignee type
  const assetIds = [...new Set(assignments.map((a) => a.assetId))];
  const personIds = [
    ...new Set(
      assignments
        .filter((a) => a.assigneeType === "PERSON")
        .map((a) => a.assigneeId),
    ),
  ];
  const orgUnitIds = [
    ...new Set(
      assignments
        .filter((a) => a.assigneeType === "ORG_UNIT")
        .map((a) => a.assigneeId),
    ),
  ];
  const locationIds = [
    ...new Set(
      assignments
        .filter((a) => a.assigneeType === "LOCATION")
        .map((a) => a.assigneeId),
    ),
  ];
  const ciIds = [
    ...new Set(
      assignments
        .filter((a) => a.assigneeType === "CI")
        .map((a) => a.assigneeId),
    ),
  ];

  // Fetch all entities in parallel
  const [assetsMap, personsMap, orgUnitsMap, locationsMap, cisMap]: [
    Map<string, string>,
    Map<string, string>,
    Map<string, string>,
    Map<string, string>,
    Map<string, string>,
  ] = await Promise.all([
    // Assets
    (async () => {
      if (assetIds.length === 0) return new Map<string, string>();
      const useCase = container.get<ListAssetsUseCase>(
        DI_TOKENS.ListAssetsUseCase,
      );
      const assets = await useCase.execute({});
      return new Map(
        assets
          .filter((a) => assetIds.includes(a.id))
          .map((a) => [a.id, a.assetTag]),
      );
    })(),
    // Persons
    (async () => {
      if (personIds.length === 0) return new Map<string, string>();
      const useCase = container.get<ListPeopleUseCase>(
        DI_TOKENS.ListPersonsUseCase,
      );
      const persons = await useCase.execute();
      return new Map(
        persons
          .filter((p) => personIds.includes(p.id))
          .map((p) => [p.id, p.fullName]),
      );
    })(),
    // Org Units
    (async () => {
      if (orgUnitIds.length === 0) return new Map<string, string>();
      const useCase = container.get<ListOrganizationUnitsUseCase>(
        DI_TOKENS.ListOrganizationUnitsUseCase,
      );
      const orgUnits = await useCase.execute();
      return new Map(
        orgUnits
          .filter((o) => orgUnitIds.includes(o.id))
          .map((o) => [o.id, o.name]),
      );
    })(),
    // Locations
    (async () => {
      if (locationIds.length === 0) return new Map<string, string>();
      const useCase = container.get<ListLocationsUseCase>(
        DI_TOKENS.ListLocationsUseCase,
      );
      const locations = await useCase.execute();
      return new Map(
        locations
          .filter((l) => locationIds.includes(l.id))
          .map((l) => [l.id, l.name]),
      );
    })(),
    // Configuration Items
    (async () => {
      if (ciIds.length === 0) return new Map<string, string>();
      const useCase = container.get<ListConfigurationItemsUseCase>(
        DI_TOKENS.ListConfigurationItemsUseCase,
      );
      const cis = await useCase.execute({});
      return new Map(
        cis.filter((ci) => ciIds.includes(ci.id)).map((ci) => [ci.id, ci.name]),
      );
    })(),
  ]);

  // Build enrichment map
  const enrichmentMap = new Map<string, AssetAssignmentEnrichment>();
  for (const assignment of assignments) {
    let assigneeName: string | undefined;
    switch (assignment.assigneeType) {
      case "PERSON":
        assigneeName = personsMap.get(assignment.assigneeId);
        break;
      case "ORG_UNIT":
        assigneeName = orgUnitsMap.get(assignment.assigneeId);
        break;
      case "LOCATION":
        assigneeName = locationsMap.get(assignment.assigneeId);
        break;
      case "CI":
        assigneeName = cisMap.get(assignment.assigneeId);
        break;
    }

    enrichmentMap.set(assignment.id, {
      assetTag: assetsMap.get(assignment.assetId),
      assigneeName,
    });
  }

  return enrichmentMap;
}

export async function createAssetAssignmentAction(
  data: CreateAssetAssignmentDTO,
): Promise<ActionResponse<AssetAssignmentDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSET_ASSIGNMENTS_CREATE);

    const validated = CreateAssetAssignmentSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<CreateAssetAssignmentUseCase>(
      DI_TOKENS.CreateAssetAssignmentUseCase,
    );

    const assignment = await useCase.execute({
      assetId: validated.assetId,
      assigneeType: validated.assigneeType,
      assigneeId: validated.assigneeId,
      startDate: validated.startDate,
      endDate: validated.endDate ?? undefined,
      isPrimary: validated.isPrimary,
      note: validated.note ?? undefined,
    });

    // Get asset tag for revalidation
    const assetRepo = container.get<IAssetRepository>(
      DI_TOKENS.IAssetRepository,
    );
    const asset = await assetRepo.findById(validated.assetId);

    revalidatePath("/asset-assignments");
    if (asset) {
      revalidatePath(`/assets/${asset.assetTag}`);
    }

    return {
      success: true,
      data: presentAssetAssignment(assignment),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createAssetAssignmentAction" },
      "Failed to create asset assignment",
    );
  }
}

export async function listAssetAssignmentsAction(
  options?: ListAssetAssignmentsDTO,
): Promise<ActionResponse<AssetAssignmentDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.ASSET_ASSIGNMENTS_VIEW);

    const validated = options
      ? ListAssetAssignmentsSchema.parse(options)
      : undefined;

    const container = getContainer();
    const useCase = container.get<ListAssetAssignmentsUseCase>(
      DI_TOKENS.ListAssetAssignmentsUseCase,
    );

    const assignments = await useCase.execute(validated);

    // Enrich with asset tags and assignee names
    const enrichmentMap = await enrichAssetAssignments(assignments);

    return {
      success: true,
      data: presentAssetAssignments(assignments, enrichmentMap),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listAssetAssignmentsAction" },
      "Failed to list asset assignments",
    );
  }
}

/**
 * Get active assignment for an asset (if any)
 * Used by Return Asset Wizard to auto-populate assignmentId
 */
export async function getActiveAssignmentAction(
  assetId: string,
): Promise<ActionResponse<AssetAssignmentDTO | null>> {
  try {
    await requirePermission(PERMISSIONS.ASSET_ASSIGNMENTS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListAssetAssignmentsUseCase>(
      DI_TOKENS.ListAssetAssignmentsUseCase,
    );

    // Get active assignments for this asset
    const assignments = await useCase.execute({
      assetId,
      activeOnly: true,
    });

    // Return the first active assignment (there should only be one primary)
    const activeAssignment = assignments.length > 0 ? assignments[0] : null;

    return {
      success: true,
      data: activeAssignment ? presentAssetAssignment(activeAssignment) : null,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getActiveAssignmentAction", assetId },
      "Failed to get active assignment",
    );
  }
}

export async function getAssetAssignmentAction(
  id: string,
): Promise<ActionResponse<AssetAssignmentDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSET_ASSIGNMENTS_VIEW);

    const validated = AssetAssignmentIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<GetAssetAssignmentUseCase>(
      DI_TOKENS.GetAssetAssignmentUseCase,
    );

    const assignment = await useCase.execute(validated.id);

    if (!assignment) {
      return {
        success: false,
        error: "Asset assignment not found",
      };
    }

    return {
      success: true,
      data: presentAssetAssignment(assignment),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getAssetAssignmentAction", id },
      "Failed to get asset assignment",
    );
  }
}

export async function updateAssetAssignmentAction(
  id: string,
  data: UpdateAssetAssignmentDTO,
): Promise<ActionResponse<AssetAssignmentDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSET_ASSIGNMENTS_UPDATE);

    const validatedId = AssetAssignmentIdSchema.parse({ id });
    const validated = UpdateAssetAssignmentSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateAssetAssignmentUseCase>(
      DI_TOKENS.UpdateAssetAssignmentUseCase,
    );

    const assignment = await useCase.execute({
      id: validatedId.id,
      assigneeType: validated.assigneeType,
      assigneeId: validated.assigneeId,
      startDate: validated.startDate,
      endDate: validated.endDate,
      isPrimary: validated.isPrimary,
      note: validated.note,
    });

    // Get asset tag for revalidation
    const assetRepo = container.get<IAssetRepository>(
      DI_TOKENS.IAssetRepository,
    );
    const asset = await assetRepo.findById(assignment.assetId);

    revalidatePath("/asset-assignments");
    revalidatePath(`/asset-assignments/${id}`);
    if (asset) {
      revalidatePath(`/assets/${asset.assetTag}`);
    }

    return {
      success: true,
      data: presentAssetAssignment(assignment),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateAssetAssignmentAction", id },
      "Failed to update asset assignment",
    );
  }
}

export async function deleteAssetAssignmentAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.ASSET_ASSIGNMENTS_DELETE);

    const validated = AssetAssignmentIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<DeleteAssetAssignmentUseCase>(
      DI_TOKENS.DeleteAssetAssignmentUseCase,
    );

    await useCase.execute(validated.id);

    revalidatePath("/asset-assignments");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteAssetAssignmentAction", id },
      "Failed to delete asset assignment",
    );
  }
}

export async function bulkCreateAssetAssignmentsAction(
  items: CreateAssetAssignmentDTO[],
): Promise<BulkCreateResult> {
  try {
    await requirePermission(PERMISSIONS.ASSET_ASSIGNMENTS_CREATE);

    const container = getContainer();
    const useCase = container.get<CreateAssetAssignmentUseCase>(
      DI_TOKENS.CreateAssetAssignmentUseCase,
    );

    const errors: Array<{ index: number; name: string; error: string }> = [];
    let successCount = 0;

    // Process items sequentially to avoid overwhelming the database
    for (let i = 0; i < items.length; i++) {
      const itemData = items[i];
      try {
        const validated = CreateAssetAssignmentSchema.parse(itemData);

        await useCase.execute({
          assetId: validated.assetId,
          assigneeType: validated.assigneeType,
          assigneeId: validated.assigneeId,
          startDate: validated.startDate,
          endDate: validated.endDate ?? undefined,
          isPrimary: validated.isPrimary,
          note: validated.note ?? undefined,
        });

        successCount++;
      } catch (error) {
        errors.push({
          index: i,
          name: itemData.assetId || "Unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    revalidatePath("/asset-assignments");

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

/**
 * List assignment conflicts
 * Used by admins to review discrepancies between Intune and manual assignments
 */
export async function listConflictsAction(
  options?: ListConflictsDTO,
): Promise<ActionResponse<AssetAssignmentDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.ASSET_ASSIGNMENTS_VIEW);

    const validated = options ? ListConflictsSchema.parse(options) : undefined;

    const container = getContainer();
    const useCase = container.get<ListConflictsUseCase>(
      DI_TOKENS.ListAssignmentConflictsUseCase,
    );

    const conflicts = await useCase.execute(validated || {});

    // Enrich with asset tags and assignee names
    const enrichmentMap = await enrichAssetAssignments(conflicts);

    return {
      success: true,
      data: presentAssetAssignments(conflicts, enrichmentMap),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listConflictsAction" },
      "Failed to list assignment conflicts",
    );
  }
}

/**
 * Update conflict status
 * Allows admins to flag or clear conflicts on assignments
 */
export async function updateConflictStatusAction(
  data: UpdateConflictStatusDTO,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.ASSET_ASSIGNMENTS_UPDATE);

    const validated = UpdateConflictStatusSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateConflictStatusUseCase>(
      DI_TOKENS.UpdateAssignmentConflictStatusUseCase,
    );

    await useCase.execute({
      assignmentId: validated.assignmentId,
      hasConflict: validated.hasConflict,
      conflictNote: validated.conflictNote ?? undefined,
    });

    revalidatePath("/asset-assignments");
    revalidatePath("/admin/assignment-conflicts");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateConflictStatusAction" },
      "Failed to update conflict status",
    );
  }
}
