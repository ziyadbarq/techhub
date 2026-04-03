/**
 * Asset Disposal Controller
 */

"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import { getSession } from "@/lib/auth/session";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import {
  CreateAssetDisposalDTO,
  StartDisposalDTO,
  CompleteSanitizationDTO,
  CompleteDisposalDTO,
  GenerateCertificateDTO,
  CancelDisposalDTO,
  type AssetDisposalDTO,
} from "../dtos/generated/asset-disposal.dto";
import {
  ApproveDisposalDTO,
  RejectDisposalDTO,
} from "../dtos/generated/disposal-approval.dto";
import {
  AssetDisposalPresenter,
  type AssetDisposalEnrichment,
} from "../presenters/asset-disposal.presenter";
import type {
  CreateAssetDisposalUseCase,
  GetAssetDisposalUseCase,
  ListAssetDisposalsUseCase,
  ApproveDisposalUseCase,
  RejectDisposalUseCase,
  StartDisposalUseCase,
  CompleteSanitizationUseCase,
  CompleteDisposalUseCase,
  GenerateCertificateUseCase,
  CancelDisposalUseCase,
  DeleteAssetDisposalUseCase,
} from "@/core/use-cases/disposal";
import type { ListAssetsUseCase } from "@/core/use-cases/asset/asset";
import type { AssetDisposal } from "@/core/domain/entities/asset-disposal.entity";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requireFeature } from "@/lib/features/server";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";

/**
 * Resolve current user's linked Person ID
 * Returns null if the user has no session or is not linked to a Person record
 */
async function resolveCurrentPersonId(
  container: ReturnType<typeof getContainer>,
): Promise<string | null> {
  const { user } = await getSession();
  if (!user) {
    return null;
  }

  const personRepository = container.get<IPersonRepository>(
    DI_TOKENS.IPersonRepository,
  );

  const person =
    (await personRepository.findByUserId(user.id)) ||
    (user.email ? await personRepository.findByEmail(user.email) : null);

  return person?.id ?? null;
}

/**
 * Enrich asset disposals with related entity display data
 */
async function enrichAssetDisposals(
  disposals: AssetDisposal[],
): Promise<Map<string, AssetDisposalEnrichment>> {
  if (disposals.length === 0) {
    return new Map();
  }

  const container = getContainer();

  // Collect unique asset IDs
  const assetIds = [...new Set(disposals.map((d) => d.assetId))];

  // Fetch assets
  const assetsMap = await (async () => {
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
  })();

  // Build enrichment map
  const enrichmentMap = new Map<string, AssetDisposalEnrichment>();
  for (const disposal of disposals) {
    enrichmentMap.set(disposal.id, {
      assetTag: assetsMap.get(disposal.assetId),
    });
  }

  return enrichmentMap;
}

export async function createAssetDisposalAction(
  data: z.infer<typeof CreateAssetDisposalDTO>,
): Promise<ActionResponse<AssetDisposalDTO>> {
  try {
    await requireFeature(FEATURE_FLAGS.ASSET_DISPOSALS);
    await requirePermission(PERMISSIONS.ASSETS_DELETE);

    const validated = CreateAssetDisposalDTO.parse(data);
    const container = getContainer();

    const initiatedById = await resolveCurrentPersonId(container);
    if (!initiatedById) {
      throw new Error(
        "Your account is not linked to a Person record. Ask an admin to link your user before creating disposals.",
      );
    }

    const useCase = container.get<CreateAssetDisposalUseCase>(
      DI_TOKENS.CreateAssetDisposalUseCase,
    );

    const disposal = await useCase.execute({
      assetId: validated.assetId,
      disposalType: validated.disposalType,
      reason: validated.reason,
      initiatedById,
      estimatedValue: validated.estimatedValue,
      currency: validated.currency,
      disposalVendorId: validated.disposalVendorId,
      recipientInfo: validated.recipientInfo,
      note: validated.note,
      metadata: validated.metadata,
      approverIds: validated.approverIds,
    });

    revalidatePath("/asset-disposals");

    return {
      success: true,
      data: AssetDisposalPresenter.toDTO(disposal),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createAssetDisposalAction" },
      "Failed to create asset disposal",
    );
  }
}

export async function listAssetDisposalsAction(): Promise<
  ActionResponse<AssetDisposalDTO[]>
> {
  try {
    await requireFeature(FEATURE_FLAGS.ASSET_DISPOSALS);
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListAssetDisposalsUseCase>(
      DI_TOKENS.ListAssetDisposalsUseCase,
    );

    const disposals = await useCase.execute({});

    // Enrich with related entity names
    const enrichmentMap = await enrichAssetDisposals(disposals);

    return {
      success: true,
      data: AssetDisposalPresenter.toDTOList(disposals, enrichmentMap),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listAssetDisposalsAction" },
      "Failed to list asset disposals",
    );
  }
}

export async function getAssetDisposalAction(
  id: string,
): Promise<ActionResponse<AssetDisposalDTO>> {
  try {
    await requireFeature(FEATURE_FLAGS.ASSET_DISPOSALS);
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const container = getContainer();
    const useCase = container.get<GetAssetDisposalUseCase>(
      DI_TOKENS.GetAssetDisposalUseCase,
    );

    const disposal = await useCase.execute({ id });

    return {
      success: true,
      data: AssetDisposalPresenter.toDTO(disposal),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getAssetDisposalAction", id },
      "Failed to get asset disposal",
    );
  }
}

export async function approveDisposalAction(
  data: z.infer<typeof ApproveDisposalDTO>,
): Promise<ActionResponse<AssetDisposalDTO>> {
  try {
    await requireFeature(FEATURE_FLAGS.ASSET_DISPOSALS);
    await requirePermission(PERMISSIONS.ASSETS_DELETE);

    const validated = ApproveDisposalDTO.parse(data);

    const container = getContainer();
    const useCase = container.get<ApproveDisposalUseCase>(
      DI_TOKENS.ApproveDisposalUseCase,
    );

    const disposal = await useCase.execute({
      disposalId: validated.disposalId,
      approvedById: validated.approverId,
    });

    revalidatePath("/asset-disposals");
    revalidatePath(`/asset-disposals/${validated.disposalId}`);

    return {
      success: true,
      data: AssetDisposalPresenter.toDTO(disposal),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "approveDisposalAction" },
      "Failed to approve disposal",
    );
  }
}

export async function rejectDisposalAction(
  data: z.infer<typeof RejectDisposalDTO>,
): Promise<ActionResponse<AssetDisposalDTO>> {
  try {
    await requireFeature(FEATURE_FLAGS.ASSET_DISPOSALS);
    await requirePermission(PERMISSIONS.ASSETS_DELETE);

    const validated = RejectDisposalDTO.parse(data);

    const container = getContainer();
    const useCase = container.get<RejectDisposalUseCase>(
      DI_TOKENS.RejectDisposalUseCase,
    );

    const disposal = await useCase.execute({
      disposalId: validated.disposalId,
      rejectionReason: validated.rejectionReason,
    });

    revalidatePath("/asset-disposals");
    revalidatePath(`/asset-disposals/${validated.disposalId}`);

    return {
      success: true,
      data: AssetDisposalPresenter.toDTO(disposal),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "rejectDisposalAction" },
      "Failed to reject disposal",
    );
  }
}

export async function startDisposalAction(
  data: z.infer<typeof StartDisposalDTO>,
): Promise<ActionResponse<AssetDisposalDTO>> {
  try {
    await requireFeature(FEATURE_FLAGS.ASSET_DISPOSALS);
    await requirePermission(PERMISSIONS.ASSETS_DELETE);

    const validated = StartDisposalDTO.parse(data);

    const container = getContainer();
    const useCase = container.get<StartDisposalUseCase>(
      DI_TOKENS.StartDisposalUseCase,
    );

    const disposal = await useCase.execute({
      disposalId: validated.disposalId,
    });

    revalidatePath("/asset-disposals");
    revalidatePath(`/asset-disposals/${validated.disposalId}`);

    return {
      success: true,
      data: AssetDisposalPresenter.toDTO(disposal),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "startDisposalAction" },
      "Failed to start disposal",
    );
  }
}

export async function completeSanitizationAction(
  data: z.infer<typeof CompleteSanitizationDTO>,
): Promise<ActionResponse<AssetDisposalDTO>> {
  try {
    await requireFeature(FEATURE_FLAGS.ASSET_DISPOSALS);
    await requirePermission(PERMISSIONS.ASSETS_DELETE);

    const validated = CompleteSanitizationDTO.parse(data);

    const container = getContainer();
    const useCase = container.get<CompleteSanitizationUseCase>(
      DI_TOKENS.CompleteSanitizationUseCase,
    );

    const disposal = await useCase.execute({
      disposalId: validated.disposalId,
      checkedItems: validated.checkedItems,
      performedById: validated.performedById,
    });

    revalidatePath("/asset-disposals");
    revalidatePath(`/asset-disposals/${validated.disposalId}`);

    return {
      success: true,
      data: AssetDisposalPresenter.toDTO(disposal),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "completeSanitizationAction" },
      "Failed to complete sanitization",
    );
  }
}

export async function completeDisposalAction(
  data: z.infer<typeof CompleteDisposalDTO>,
): Promise<ActionResponse<AssetDisposalDTO>> {
  try {
    await requireFeature(FEATURE_FLAGS.ASSET_DISPOSALS);
    await requirePermission(PERMISSIONS.ASSETS_DELETE);

    const validated = CompleteDisposalDTO.parse(data);

    const container = getContainer();
    const useCase = container.get<CompleteDisposalUseCase>(
      DI_TOKENS.CompleteDisposalUseCase,
    );

    const disposal = await useCase.execute({
      disposalId: validated.disposalId,
      disposalDate: validated.disposalDate,
      actualProceeds: validated.actualProceeds ?? undefined,
    });

    revalidatePath("/asset-disposals");
    revalidatePath(`/asset-disposals/${validated.disposalId}`);

    return {
      success: true,
      data: AssetDisposalPresenter.toDTO(disposal),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "completeDisposalAction" },
      "Failed to complete disposal",
    );
  }
}

export async function generateCertificateAction(
  data: z.infer<typeof GenerateCertificateDTO>,
): Promise<
  ActionResponse<{
    disposal: AssetDisposalDTO;
    certificateNumber: string;
  }>
> {
  try {
    await requireFeature(FEATURE_FLAGS.ASSET_DISPOSALS);
    await requirePermission(PERMISSIONS.ASSETS_DELETE);

    const validated = GenerateCertificateDTO.parse(data);

    const container = getContainer();
    const useCase = container.get<GenerateCertificateUseCase>(
      DI_TOKENS.GenerateCertificateUseCase,
    );

    const result = await useCase.execute({
      disposalId: validated.disposalId,
    });

    revalidatePath("/asset-disposals");
    revalidatePath(`/asset-disposals/${validated.disposalId}`);

    return {
      success: true,
      data: {
        disposal: AssetDisposalPresenter.toDTO(result.disposal),
        certificateNumber: result.certificateNumber,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "generateCertificateAction" },
      "Failed to generate certificate",
    );
  }
}

export async function cancelDisposalAction(
  data: z.infer<typeof CancelDisposalDTO>,
): Promise<ActionResponse<AssetDisposalDTO>> {
  try {
    await requireFeature(FEATURE_FLAGS.ASSET_DISPOSALS);
    await requirePermission(PERMISSIONS.ASSETS_DELETE);

    const validated = CancelDisposalDTO.parse(data);

    const container = getContainer();
    const useCase = container.get<CancelDisposalUseCase>(
      DI_TOKENS.CancelDisposalUseCase,
    );

    const disposal = await useCase.execute({
      disposalId: validated.disposalId,
      cancellationReason: validated.cancellationReason,
    });

    revalidatePath("/asset-disposals");
    revalidatePath(`/asset-disposals/${validated.disposalId}`);

    return {
      success: true,
      data: AssetDisposalPresenter.toDTO(disposal),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "cancelDisposalAction" },
      "Failed to cancel disposal",
    );
  }
}

export async function deleteAssetDisposalAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requireFeature(FEATURE_FLAGS.ASSET_DISPOSALS);
    await requirePermission(PERMISSIONS.ASSETS_DELETE);

    const container = getContainer();
    const useCase = container.get<DeleteAssetDisposalUseCase>(
      DI_TOKENS.DeleteAssetDisposalUseCase,
    );

    await useCase.execute({ disposalId: id });

    revalidatePath("/asset-disposals");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteAssetDisposalAction", id },
      "Failed to delete asset disposal",
    );
  }
}
