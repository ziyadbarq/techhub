/**
 * VerificationCampaign Controller
 * Handles HTTP requests and responses for verification campaign operations
 */

"use server";

import { revalidatePath } from "next/cache";
import type { ActionResponse } from "./types";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type {
  CreateVerificationCampaignUseCase,
  GetVerificationCampaignUseCase,
  ListVerificationCampaignsUseCase,
  UpdateVerificationCampaignUseCase,
  DeleteVerificationCampaignUseCase,
  StartVerificationCampaignUseCase,
  CompleteVerificationCampaignUseCase,
} from "@/core/use-cases/governance/verification-campaign";
import {
  CreateVerificationCampaignSchema,
  UpdateVerificationCampaignSchema,
  type CreateVerificationCampaignDTO,
  type UpdateVerificationCampaignDTO,
} from "@/interface-adapters/dtos/generated/verification-campaign.dto";
import {
  VerificationCampaignPresenter,
  type VerificationCampaignDTO,
} from "@/interface-adapters/presenters/verification-campaign.presenter";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { TargetObjectTypeEnum } from "@/core/domain/entities/verification-campaign.entity";

/**
 * Create a new verification campaign
 */
export async function createVerificationCampaign(
  data: CreateVerificationCampaignDTO,
): Promise<ActionResponse<VerificationCampaignDTO>> {
  try {
    await requirePermission(PERMISSIONS.VERIFICATION_CAMPAIGNS_CREATE);

    // Validate input
    const validatedData = CreateVerificationCampaignSchema.parse(data);

    // Get use case from DI container
    const container = getContainer();
    const useCase = container.get<CreateVerificationCampaignUseCase>(
      DI_TOKENS.CreateVerificationCampaignUseCase,
    );

    // Execute use case
    const campaign = await useCase.execute({
      ...validatedData,
      targetType: validatedData.targetType as TargetObjectTypeEnum,
    });

    // Revalidate relevant paths
    revalidatePath("/verification-campaigns");

    return {
      success: true,
      data: VerificationCampaignPresenter.toDTO(campaign),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create verification campaign",
    };
  }
}

/**
 * Get a verification campaign by ID
 */
export async function getVerificationCampaign(
  id: string,
): Promise<ActionResponse<VerificationCampaignDTO>> {
  try {
    await requirePermission(PERMISSIONS.VERIFICATION_CAMPAIGNS_VIEW);

    const container = getContainer();
    const useCase = container.get<GetVerificationCampaignUseCase>(
      DI_TOKENS.GetVerificationCampaignUseCase,
    );

    const campaign = await useCase.execute({ id });

    return {
      success: true,
      data: VerificationCampaignPresenter.toDTO(campaign),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get verification campaign",
    };
  }
}

/**
 * List all verification campaigns
 */
export async function listVerificationCampaigns(options?: {
  activeOnly?: boolean;
  createdById?: string;
}): Promise<ActionResponse<VerificationCampaignDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.VERIFICATION_CAMPAIGNS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListVerificationCampaignsUseCase>(
      DI_TOKENS.ListVerificationCampaignsUseCase,
    );

    const campaigns = await useCase.execute({
      activeOnly: options?.activeOnly,
      createdById: options?.createdById,
    });

    return {
      success: true,
      data: VerificationCampaignPresenter.toDTOList(campaigns),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to list verification campaigns",
    };
  }
}

/**
 * Update a verification campaign
 */
export async function updateVerificationCampaign(
  id: string,
  data: UpdateVerificationCampaignDTO,
): Promise<ActionResponse<VerificationCampaignDTO>> {
  try {
    await requirePermission(PERMISSIONS.VERIFICATION_CAMPAIGNS_UPDATE);

    // Validate input
    const validatedData = UpdateVerificationCampaignSchema.parse(data);

    // Get use case from DI container
    const container = getContainer();
    const useCase = container.get<UpdateVerificationCampaignUseCase>(
      DI_TOKENS.UpdateVerificationCampaignUseCase,
    );

    // Execute use case
    const campaign = await useCase.execute({ id, ...validatedData });

    // Revalidate relevant paths
    revalidatePath("/verification-campaigns");
    revalidatePath(`/verification-campaigns/${id}`);

    return {
      success: true,
      data: VerificationCampaignPresenter.toDTO(campaign),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update verification campaign",
    };
  }
}

/**
 * Delete a verification campaign
 */
export async function deleteVerificationCampaign(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePermission(PERMISSIONS.VERIFICATION_CAMPAIGNS_DELETE);

    const container = getContainer();
    const useCase = container.get<DeleteVerificationCampaignUseCase>(
      DI_TOKENS.DeleteVerificationCampaignUseCase,
    );

    await useCase.execute({ id });

    // Revalidate relevant paths
    revalidatePath("/verification-campaigns");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete verification campaign",
    };
  }
}

/**
 * Start a verification campaign
 */
export async function startVerificationCampaign(
  id: string,
): Promise<ActionResponse<VerificationCampaignDTO>> {
  try {
    await requirePermission(PERMISSIONS.VERIFICATION_CAMPAIGNS_START);

    const container = getContainer();
    const useCase = container.get<StartVerificationCampaignUseCase>(
      DI_TOKENS.StartVerificationCampaignUseCase,
    );

    const campaign = await useCase.execute({ id });

    // Revalidate relevant paths
    revalidatePath("/verification-campaigns");
    revalidatePath(`/verification-campaigns/${id}`);

    return {
      success: true,
      data: VerificationCampaignPresenter.toDTO(campaign),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to start verification campaign",
    };
  }
}

/**
 * Complete a verification campaign
 */
export async function completeVerificationCampaign(
  id: string,
): Promise<ActionResponse<VerificationCampaignDTO>> {
  try {
    await requirePermission(PERMISSIONS.VERIFICATION_CAMPAIGNS_COMPLETE);

    const container = getContainer();
    const useCase = container.get<CompleteVerificationCampaignUseCase>(
      DI_TOKENS.CompleteVerificationCampaignUseCase,
    );

    const campaign = await useCase.execute({ id });

    // Revalidate relevant paths
    revalidatePath("/verification-campaigns");
    revalidatePath(`/verification-campaigns/${id}`);

    return {
      success: true,
      data: VerificationCampaignPresenter.toDTO(campaign),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to complete verification campaign",
    };
  }
}
