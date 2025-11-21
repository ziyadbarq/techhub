/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

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
import { AssetDisposalPresenter } from "../presenters/asset-disposal.presenter";
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
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export async function createAssetDisposalAction(
  data: z.infer<typeof CreateAssetDisposalDTO>,
): Promise<ActionResponse<AssetDisposalDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_DELETE);

    const validated = CreateAssetDisposalDTO.parse(data);

    const container = getContainer();
    const useCase = container.get<CreateAssetDisposalUseCase>(
      DI_TOKENS.CreateAssetDisposalUseCase,
    );

    const disposal = await useCase.execute({
      assetId: validated.assetId,
      disposalType: validated.disposalType,
      disposalMethod: validated.disposalMethod,
      reason: validated.reason,
      estimatedValue: validated.estimatedValue,
      approverIds: validated.approverIds,
      notes: validated.notes,
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
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListAssetDisposalsUseCase>(
      DI_TOKENS.ListAssetDisposalsUseCase,
    );

    const disposals = await useCase.execute({});

    return {
      success: true,
      data: AssetDisposalPresenter.toDTOList(disposals),
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
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const container = getContainer();
    const useCase = container.get<GetAssetDisposalUseCase>(
      DI_TOKENS.GetAssetDisposalUseCase,
    );

    const disposal = await useCase.execute({ disposalId: id });

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
    await requirePermission(PERMISSIONS.ASSETS_DELETE);

    const validated = ApproveDisposalDTO.parse(data);

    const container = getContainer();
    const useCase = container.get<ApproveDisposalUseCase>(
      DI_TOKENS.ApproveDisposalUseCase,
    );

    const disposal = await useCase.execute({
      disposalId: validated.disposalId,
      approverId: validated.approverId,
      comments: validated.comments,
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
    await requirePermission(PERMISSIONS.ASSETS_DELETE);

    const validated = RejectDisposalDTO.parse(data);

    const container = getContainer();
    const useCase = container.get<RejectDisposalUseCase>(
      DI_TOKENS.RejectDisposalUseCase,
    );

    const disposal = await useCase.execute({
      disposalId: validated.disposalId,
      approverId: validated.approverId,
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
    await requirePermission(PERMISSIONS.ASSETS_DELETE);

    const validated = CompleteDisposalDTO.parse(data);

    const container = getContainer();
    const useCase = container.get<CompleteDisposalUseCase>(
      DI_TOKENS.CompleteDisposalUseCase,
    );

    const disposal = await useCase.execute({
      disposalId: validated.disposalId,
      disposalDate: validated.disposalDate,
      actualProceeds: validated.actualProceeds,
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
