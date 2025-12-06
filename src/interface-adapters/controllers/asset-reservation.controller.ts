/**
 * Asset Reservation Controller
 */

"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateReservationDTO,
  UpdateReservationDTO,
  ConfirmReservationDTO,
  CheckAvailabilityDTO,
  ListAvailableAssetsDTO,
  type AssetReservationDTO,
} from "../dtos/generated/asset-reservation.dto";
import {
  ResolveConflictDTO,
  type AssetReservationConflictDTO,
} from "../dtos/generated/asset-reservation-conflict.dto";
import {
  presentAssetReservation,
  presentAssetReservationsWithEnrichment,
  type AssetReservationEnrichment,
} from "../presenters/asset-reservation.presenter";
import type { AssetDTO } from "../presenters/asset.presenter";
import { AssetReservationConflictPresenter } from "../presenters/asset-reservation-conflict.presenter";
import type {
  CreateReservationUseCase,
  GetReservationUseCase,
  ListReservationsUseCase,
  UpdateReservationUseCase,
  CancelReservationUseCase,
  ConfirmReservationUseCase,
  StartReservationUseCase,
  CompleteReservationUseCase,
  DetectConflictsUseCase,
  ResolveConflictUseCase,
  ListConflictsUseCase,
  CheckAvailabilityUseCase,
  ListAvailableAssetsUseCase,
} from "@/core/use-cases/reservations";
import type { ListAssetsUseCase } from "@/core/use-cases/asset/asset";
import type { ListAssetAssignmentsUseCase } from "@/core/use-cases/asset/asset-assignment";
import type { ListPeopleUseCase } from "@/core/use-cases/foundation/person";
import type { AssetReservation } from "@/core/domain/entities/asset-reservation.entity";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { getSession } from "@/lib/auth/session";

/**
 * Enrich asset reservations with asset tags and person names
 */
async function enrichAssetReservations(
  reservations: AssetReservation[],
): Promise<Map<string, AssetReservationEnrichment>> {
  if (reservations.length === 0) {
    return new Map();
  }

  const container = getContainer();

  // Collect unique IDs
  const assetIds = [...new Set(reservations.map((r) => r.assetId))];
  const personIds = [
    ...new Set(
      reservations
        .map((r) => r.reservedForPersonId)
        .filter((id): id is string => id !== null),
    ),
  ];

  // Fetch assets and persons in parallel
  const [assetsMap, personsMap] = await Promise.all([
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
  ]);

  // Build enrichment map
  const enrichmentMap = new Map<string, AssetReservationEnrichment>();
  for (const reservation of reservations) {
    enrichmentMap.set(reservation.id, {
      assetTag: assetsMap.get(reservation.assetId),
      personName: reservation.reservedForPersonId
        ? personsMap.get(reservation.reservedForPersonId)
        : undefined,
    });
  }

  return enrichmentMap;
}

// ==================== Reservation Management ====================

export async function createReservationAction(
  data: z.infer<typeof CreateReservationDTO>,
): Promise<ActionResponse<AssetReservationDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_CHECKOUT);

    const validated = CreateReservationDTO.parse(data);

    // SECURITY: Get reservedById from authenticated session, not client payload
    const { user } = await getSession();
    if (!user?.id) {
      throw new Error("User must be authenticated to create reservations");
    }

    const container = getContainer();
    const personRepository = container.get<IPersonRepository>(
      DI_TOKENS.IPersonRepository,
    );
    const person =
      (await personRepository.findByUserId(user.id)) ||
      (user.email ? await personRepository.findByEmail(user.email) : null);

    if (!person) {
      throw new Error(
        "No Person record linked to current user. Please contact an administrator.",
      );
    }

    const useCase = container.get<CreateReservationUseCase>(
      DI_TOKENS.CreateReservationUseCase,
    );

    const reservation = await useCase.execute({
      assetId: validated.assetId,
      reservedForPersonId: validated.reservedForPersonId,
      reservedForOrgUnitId: validated.reservedForOrgUnitId,
      reservedById: person.id, // Server-resolved from linked person, not from client
      startDate: validated.startDate,
      endDate: validated.endDate,
      purpose: validated.purpose,
      notes: validated.notes,
    });

    revalidatePath("/asset-reservations");

    return {
      success: true,
      data: presentAssetReservation(reservation),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createReservationAction" },
      "Failed to create reservation",
    );
  }
}

export async function listReservationsAction(): Promise<
  ActionResponse<AssetReservationDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListReservationsUseCase>(
      DI_TOKENS.ListReservationsUseCase,
    );

    const result = await useCase.execute({});

    // Enrich with asset tags and person names
    const enrichmentMap = await enrichAssetReservations(result.reservations);

    return {
      success: true,
      data: presentAssetReservationsWithEnrichment(
        result.reservations,
        enrichmentMap,
      ),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listReservationsAction" },
      "Failed to list reservations",
    );
  }
}

export async function listReservationsByAssetAction(
  assetId: string,
): Promise<ActionResponse<AssetReservationDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListReservationsUseCase>(
      DI_TOKENS.ListReservationsUseCase,
    );

    const result = await useCase.execute({ assetId });

    // Enrich with asset tags and person names
    const enrichmentMap = await enrichAssetReservations(result.reservations);

    return {
      success: true,
      data: presentAssetReservationsWithEnrichment(
        result.reservations,
        enrichmentMap,
      ),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listReservationsByAssetAction", assetId },
      "Failed to list reservations by asset",
    );
  }
}

export async function getReservationAction(
  id: string,
): Promise<ActionResponse<AssetReservationDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const container = getContainer();
    const useCase = container.get<GetReservationUseCase>(
      DI_TOKENS.GetReservationUseCase,
    );

    const reservation = await useCase.execute({ reservationId: id });

    return {
      success: true,
      data: presentAssetReservation(reservation),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getReservationAction", id },
      "Failed to get reservation",
    );
  }
}

export async function updateReservationAction(
  id: string,
  data: z.infer<typeof UpdateReservationDTO>,
): Promise<ActionResponse<AssetReservationDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_UPDATE);

    const validated = UpdateReservationDTO.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateReservationUseCase>(
      DI_TOKENS.UpdateReservationUseCase,
    );

    const reservation = await useCase.execute({
      reservationId: id,
      endDate: validated.endDate,
      notes: validated.notes,
    });

    revalidatePath("/asset-reservations");
    revalidatePath(`/asset-reservations/${id}`);

    return {
      success: true,
      data: presentAssetReservation(reservation),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateReservationAction", id },
      "Failed to update reservation",
    );
  }
}

export async function cancelReservationAction(
  id: string,
  reason: string,
): Promise<ActionResponse<AssetReservationDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_UPDATE);

    // SECURITY: Get cancelledById from authenticated session, not client payload
    const { user } = await getSession();
    if (!user?.id) {
      throw new Error("User must be authenticated to cancel reservations");
    }

    const container = getContainer();
    const personRepository = container.get<IPersonRepository>(
      DI_TOKENS.IPersonRepository,
    );
    const person =
      (await personRepository.findByUserId(user.id)) ||
      (user.email ? await personRepository.findByEmail(user.email) : null);

    if (!person) {
      throw new Error(
        "No Person record linked to current user. Please contact an administrator.",
      );
    }

    const useCase = container.get<CancelReservationUseCase>(
      DI_TOKENS.CancelReservationUseCase,
    );

    const reservation = await useCase.execute({
      reservationId: id,
      cancelledById: person.id, // Server-resolved from linked person, not from client
      reason,
    });

    revalidatePath("/asset-reservations");
    revalidatePath(`/asset-reservations/${id}`);

    return {
      success: true,
      data: presentAssetReservation(reservation),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "cancelReservationAction", id },
      "Failed to cancel reservation",
    );
  }
}

export async function confirmReservationAction(
  data: z.infer<typeof ConfirmReservationDTO>,
): Promise<ActionResponse<AssetReservationDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_UPDATE);

    const validated = ConfirmReservationDTO.parse(data);

    const container = getContainer();
    const useCase = container.get<ConfirmReservationUseCase>(
      DI_TOKENS.ConfirmReservationUseCase,
    );

    const reservation = await useCase.execute({
      reservationId: validated.reservationId,
      confirmedById: validated.confirmedById,
    });

    revalidatePath("/asset-reservations");
    revalidatePath(`/asset-reservations/${validated.reservationId}`);

    return {
      success: true,
      data: presentAssetReservation(reservation),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "confirmReservationAction" },
      "Failed to confirm reservation",
    );
  }
}

export async function startReservationAction(
  id: string,
): Promise<ActionResponse<AssetReservationDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_CHECKOUT);

    const container = getContainer();
    const useCase = container.get<StartReservationUseCase>(
      DI_TOKENS.StartReservationUseCase,
    );

    const reservation = await useCase.execute({ reservationId: id });

    revalidatePath("/asset-reservations");
    revalidatePath(`/asset-reservations/${id}`);

    return {
      success: true,
      data: presentAssetReservation(reservation),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "startReservationAction", id },
      "Failed to start reservation",
    );
  }
}

export async function completeReservationAction(
  id: string,
): Promise<ActionResponse<AssetReservationDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_CHECKOUT);

    const container = getContainer();
    const useCase = container.get<CompleteReservationUseCase>(
      DI_TOKENS.CompleteReservationUseCase,
    );

    const reservation = await useCase.execute({
      reservationId: id,
    });

    revalidatePath("/asset-reservations");
    revalidatePath(`/asset-reservations/${id}`);

    return {
      success: true,
      data: presentAssetReservation(reservation),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "completeReservationAction", id },
      "Failed to complete reservation",
    );
  }
}

// ==================== Conflict Management ====================

export async function detectConflictsAction(reservationId: string): Promise<
  ActionResponse<{
    conflictIds: string[];
    conflictCount: number;
  }>
> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const container = getContainer();
    const useCase = container.get<DetectConflictsUseCase>(
      DI_TOKENS.DetectConflictsUseCase,
    );

    const result = await useCase.execute({ reservationId });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "detectConflictsAction", reservationId },
      "Failed to detect conflicts",
    );
  }
}

export async function resolveConflictAction(
  data: z.infer<typeof ResolveConflictDTO>,
): Promise<ActionResponse<AssetReservationConflictDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_UPDATE);

    const validated = ResolveConflictDTO.parse(data);

    const container = getContainer();
    const useCase = container.get<ResolveConflictUseCase>(
      DI_TOKENS.ResolveConflictUseCase,
    );

    const conflict = await useCase.execute({
      conflictId: validated.conflictId,
      resolutionNote: validated.resolutionNote,
    });

    revalidatePath("/asset-reservations/conflicts");

    return {
      success: true,
      data: AssetReservationConflictPresenter.toDTO(conflict),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "resolveConflictAction" },
      "Failed to resolve conflict",
    );
  }
}

export async function listConflictsAction(
  reservationId?: string,
): Promise<ActionResponse<AssetReservationConflictDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListConflictsUseCase>(
      DI_TOKENS.ListConflictsUseCase,
    );

    const result = await useCase.execute({
      reservationId,
      unresolvedOnly: false,
    });

    return {
      success: true,
      data: AssetReservationConflictPresenter.toDTOList(result.conflicts),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listConflictsAction" },
      "Failed to list conflicts",
    );
  }
}

// ==================== Availability Checking ====================

export async function checkAvailabilityAction(
  data: z.infer<typeof CheckAvailabilityDTO>,
): Promise<
  ActionResponse<{
    isAvailable: boolean;
    conflictingReservationIds: string[];
  }>
> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const validated = CheckAvailabilityDTO.parse(data);

    const container = getContainer();
    const useCase = container.get<CheckAvailabilityUseCase>(
      DI_TOKENS.CheckAvailabilityUseCase,
    );

    const result = await useCase.execute({
      assetId: validated.assetId,
      startDate: validated.startDate,
      endDate: validated.endDate,
      excludeReservationId: validated.excludeReservationId,
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "checkAvailabilityAction" },
      "Failed to check availability",
    );
  }
}

export async function listAvailableAssetsAction(
  data: z.infer<typeof ListAvailableAssetsDTO>,
): Promise<
  ActionResponse<{
    availableAssetIds: string[];
    unavailableAssetIds: string[];
  }>
> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const validated = ListAvailableAssetsDTO.parse(data);

    const container = getContainer();
    const useCase = container.get<ListAvailableAssetsUseCase>(
      DI_TOKENS.ListAvailableAssetsUseCase,
    );

    const result = await useCase.execute({
      assetIds: validated.assetIds,
      startDate: validated.startDate,
      endDate: validated.endDate,
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listAvailableAssetsAction" },
      "Failed to list available assets",
    );
  }
}

/**
 * List all assets that do NOT have any active reservations OR active assignments
 * (Strict policy: asset cannot be both assigned and reserved)
 */
export async function listUnreservedAssetsAction(
  assetModelId?: string,
): Promise<ActionResponse<AssetDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const container = getContainer();

    // Get all assets (optionally filtered by model)
    const listAssetsUseCase = container.get<ListAssetsUseCase>(
      DI_TOKENS.ListAssetsUseCase,
    );
    const allAssets = await listAssetsUseCase.execute(
      assetModelId ? { assetModelId } : {},
    );

    // Get all active reservations
    const listReservationsUseCase = container.get<ListReservationsUseCase>(
      DI_TOKENS.ListReservationsUseCase,
    );
    const reservationsResponse = await listReservationsUseCase.execute({});
    const allReservations = reservationsResponse.reservations;

    // Find assets that have active reservations (PENDING, CONFIRMED, or ACTIVE)
    const reservedAssetIds = new Set(
      allReservations
        .filter(
          (r: AssetReservation) =>
            r.status === "PENDING" ||
            r.status === "CONFIRMED" ||
            r.status === "ACTIVE",
        )
        .map((r: AssetReservation) => r.assetId),
    );

    // Get all active assignments to also filter them out
    const listAssignmentsUseCase = container.get<ListAssetAssignmentsUseCase>(
      DI_TOKENS.ListAssetAssignmentsUseCase,
    );
    const allAssignments = await listAssignmentsUseCase.execute();

    // Find assets that have active assignments
    const assignedAssetIds = new Set(
      allAssignments
        .filter((a) => a.endDate === null || a.endDate > new Date())
        .map((a) => a.assetId),
    );

    // Filter out reserved AND assigned assets
    const availableAssets = allAssets.filter(
      (asset) =>
        !reservedAssetIds.has(asset.id) && !assignedAssetIds.has(asset.id),
    );

    // Enrich with related entity names (reuse existing enrichAssets helper from asset controller)
    const { presentAsset } = await import("../presenters/asset.presenter");
    const enrichedAssets = availableAssets.map((asset) => presentAsset(asset));

    return {
      success: true,
      data: enrichedAssets,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listUnreservedAssetsAction", assetModelId },
      "Failed to list unreserved assets",
    );
  }
}
