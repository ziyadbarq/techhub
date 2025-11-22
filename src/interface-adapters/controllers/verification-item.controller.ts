/**
 * VerificationItem Controller
 * Handles HTTP requests and responses for verification item operations
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type {
  CreateVerificationItemUseCase,
  GetVerificationItemUseCase,
  ListVerificationItemsUseCase,
  UpdateVerificationItemUseCase,
  DeleteVerificationItemUseCase,
  VerifyVerificationItemUseCase,
  FlagExceptionVerificationItemUseCase,
} from "@/core/use-cases/governance/verification-item";
import {
  CreateVerificationItemSchema,
  UpdateVerificationItemSchema,
  VerifyVerificationItemSchema,
  FlagExceptionVerificationItemSchema,
  type CreateVerificationItemDTO,
  type UpdateVerificationItemDTO,
  type VerifyVerificationItemDTO,
  type FlagExceptionVerificationItemDTO,
} from "@/interface-adapters/dtos/generated/verification-item.dto";
import {
  VerificationItemPresenter,
  type VerificationItemDTO,
} from "@/interface-adapters/presenters/verification-item.presenter";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { VerificationStatusEnum } from "@/core/domain/entities/verification-item.entity";

/**
 * Create a new verification item
 */
export async function createVerificationItem(
  data: CreateVerificationItemDTO,
): Promise<
  | { success: true; data: VerificationItemDTO }
  | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.VERIFICATION_ITEMS_MANAGE);

    // Validate input
    const validatedData = CreateVerificationItemSchema.parse(data);

    // Get use case from DI container
    const container = getContainer();
    const useCase = container.get<CreateVerificationItemUseCase>(
      DI_TOKENS.CreateVerificationItemUseCase,
    );

    // Execute use case
    const verificationItem = await useCase.execute(validatedData);

    // Revalidate relevant paths
    revalidatePath("/verification-campaigns");

    return {
      success: true,
      data: VerificationItemPresenter.toDTO(verificationItem),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create verification item",
    };
  }
}

/**
 * Get a verification item by ID
 */
export async function getVerificationItem(
  id: string,
): Promise<
  | { success: true; data: VerificationItemDTO }
  | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.VERIFICATION_ITEMS_VIEW);

    const container = getContainer();
    const useCase = container.get<GetVerificationItemUseCase>(
      DI_TOKENS.GetVerificationItemUseCase,
    );

    const verificationItem = await useCase.execute({ id });

    return {
      success: true,
      data: VerificationItemPresenter.toDTO(verificationItem),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get verification item",
    };
  }
}

/**
 * List verification items
 */
export async function listVerificationItems(options?: {
  campaignId?: string;
  status?: VerificationStatusEnum;
}): Promise<
  | { success: true; data: VerificationItemDTO[] }
  | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.VERIFICATION_ITEMS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListVerificationItemsUseCase>(
      DI_TOKENS.ListVerificationItemsUseCase,
    );

    const verificationItems = await useCase.execute({
      campaignId: options?.campaignId,
      status: options?.status,
    });

    return {
      success: true,
      data: VerificationItemPresenter.toDTOList(verificationItems),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to list verification items",
    };
  }
}

/**
 * Update a verification item
 */
export async function updateVerificationItem(
  id: string,
  data: UpdateVerificationItemDTO,
): Promise<
  | { success: true; data: VerificationItemDTO }
  | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.VERIFICATION_ITEMS_UPDATE);

    // Validate input
    const validatedData = UpdateVerificationItemSchema.parse(data);

    // Get use case from DI container
    const container = getContainer();
    const useCase = container.get<UpdateVerificationItemUseCase>(
      DI_TOKENS.UpdateVerificationItemUseCase,
    );

    // Execute use case
    const verificationItem = await useCase.execute({ id, ...validatedData });

    // Revalidate relevant paths
    revalidatePath("/verification-campaigns");

    return {
      success: true,
      data: VerificationItemPresenter.toDTO(verificationItem),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update verification item",
    };
  }
}

/**
 * Delete a verification item
 */
export async function deleteVerificationItem(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePermission(PERMISSIONS.VERIFICATION_ITEMS_MANAGE);

    const container = getContainer();
    const useCase = container.get<DeleteVerificationItemUseCase>(
      DI_TOKENS.DeleteVerificationItemUseCase,
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
          : "Failed to delete verification item",
    };
  }
}

/**
 * Verify a verification item
 */
export async function verifyVerificationItem(
  id: string,
  data: VerifyVerificationItemDTO,
): Promise<
  | { success: true; data: VerificationItemDTO }
  | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.VERIFICATION_ITEMS_VERIFY);

    // Validate input
    const validatedData = VerifyVerificationItemSchema.parse(data);

    // Get use case from DI container
    const container = getContainer();
    const useCase = container.get<VerifyVerificationItemUseCase>(
      DI_TOKENS.VerifyVerificationItemUseCase,
    );

    // Execute use case
    const verificationItem = await useCase.execute({
      id,
      comment: validatedData.comment,
    });

    // Revalidate relevant paths
    revalidatePath("/verification-campaigns");

    return {
      success: true,
      data: VerificationItemPresenter.toDTO(verificationItem),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to verify verification item",
    };
  }
}

/**
 * Flag a verification item as exception
 */
export async function flagExceptionVerificationItem(
  id: string,
  data: FlagExceptionVerificationItemDTO,
): Promise<
  | { success: true; data: VerificationItemDTO }
  | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.VERIFICATION_ITEMS_FLAG_EXCEPTION);

    // Validate input
    const validatedData = FlagExceptionVerificationItemSchema.parse(data);

    // Get use case from DI container
    const container = getContainer();
    const useCase = container.get<FlagExceptionVerificationItemUseCase>(
      DI_TOKENS.FlagExceptionVerificationItemUseCase,
    );

    // Execute use case
    const verificationItem = await useCase.execute({
      id,
      comment: validatedData.comment,
    });

    // Revalidate relevant paths
    revalidatePath("/verification-campaigns");

    return {
      success: true,
      data: VerificationItemPresenter.toDTO(verificationItem),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to flag verification item as exception",
    };
  }
}
