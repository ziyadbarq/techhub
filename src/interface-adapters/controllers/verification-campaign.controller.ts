/**
 * VerificationCampaign Controller
 * Handles HTTP requests and responses for verification campaign operations
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { getSession } from "@/lib/auth/session";
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
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import type { IOrganizationUnitRepository } from "@/core/repositories/organization-unit.repository.interface";
import type { CreatePersonUseCase } from "@/core/use-cases/foundation/person/create-person.use-case";

function getFallbackPersonName(user: {
  name?: string | null;
  email?: string | null;
}) {
  const displayName = user.name?.trim() || user.email?.split("@")[0] || "User";
  const [firstName, ...rest] = displayName.split(/\s+/).filter(Boolean);

  return {
    firstName: firstName || "User",
    lastName: rest.join(" ") || "Account",
  };
}

async function resolveDefaultOrgUnitId(
  container: ReturnType<typeof getContainer>,
) {
  const orgUnitRepository = container.get<IOrganizationUnitRepository>(
    DI_TOKENS.IOrganizationUnitRepository,
  );

  const preferredOrgUnit =
    (await orgUnitRepository.findByCode("TECH")) ||
    (await orgUnitRepository.findByCode("BARQ"));

  if (preferredOrgUnit?.isActive) {
    return preferredOrgUnit.id;
  }

  const [activeOrgUnit] = await orgUnitRepository.findActive({ take: 1 });
  return activeOrgUnit?.id ?? null;
}

async function resolveCurrentPersonId(
  container: ReturnType<typeof getContainer>,
) {
  const { user } = await getSession();
  if (!user) {
    return { personId: null, error: "Not authenticated" };
  }

  const personRepository = container.get<IPersonRepository>(
    DI_TOKENS.IPersonRepository,
  );

  const person =
    (await personRepository.findByUserId(user.id)) ||
    (user.email ? await personRepository.findByEmail(user.email) : null);

  if (person) {
    if (person.userId && person.userId !== user.id) {
      return {
        personId: null,
        error:
          "A person record with your email is already linked to a different user account.",
      };
    }

    if (!person.userId) {
      person.linkToUser(user.id);
      const linkedPerson = await personRepository.update(person);
      return { personId: linkedPerson.id, error: null };
    }

    return { personId: person.id, error: null };
  }

  if (!user.email) {
    return {
      personId: null,
      error: "Your account does not have an email address.",
    };
  }

  const orgUnitId = await resolveDefaultOrgUnitId(container);
  if (!orgUnitId) {
    return {
      personId: null,
      error:
        "No active organization unit exists. Create an organization unit before creating verification campaigns.",
    };
  }

  const createPersonUseCase = container.get<CreatePersonUseCase>(
    DI_TOKENS.CreatePersonUseCase,
  );
  const { firstName, lastName } = getFallbackPersonName(user);
  const createdPerson = await createPersonUseCase.execute({
    userId: user.id,
    firstName,
    lastName,
    email: user.email,
    orgUnitId,
    title: "TechHub User",
    metadata: {
      source: "verification-campaign-auto-provision",
    },
  });

  return { personId: createdPerson.id, error: null };
}

/**
 * Create a new verification campaign
 */
export async function createVerificationCampaign(
  data: CreateVerificationCampaignDTO,
): Promise<
  | { success: true; data: VerificationCampaignDTO }
  | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.VERIFICATION_CAMPAIGNS_CREATE);

    // Validate input
    const validatedData = CreateVerificationCampaignSchema.parse(data);

    const container = getContainer();
    const { personId, error } = await resolveCurrentPersonId(container);
    if (!personId) {
      return {
        success: false,
        error: error ?? "Unable to resolve current person",
      };
    }

    // Get use case from DI container
    const useCase = container.get<CreateVerificationCampaignUseCase>(
      DI_TOKENS.CreateVerificationCampaignUseCase,
    );

    // Execute use case
    const campaign = await useCase.execute({
      ...validatedData,
      targetType: validatedData.targetType as TargetObjectTypeEnum,
      createdById: personId,
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
): Promise<
  | { success: true; data: VerificationCampaignDTO }
  | { success: false; error: string }
> {
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
}): Promise<
  | { success: true; data: VerificationCampaignDTO[] }
  | { success: false; error: string }
> {
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
): Promise<
  | { success: true; data: VerificationCampaignDTO }
  | { success: false; error: string }
> {
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
): Promise<
  | { success: true; data: VerificationCampaignDTO }
  | { success: false; error: string }
> {
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
): Promise<
  | { success: true; data: VerificationCampaignDTO }
  | { success: false; error: string }
> {
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
