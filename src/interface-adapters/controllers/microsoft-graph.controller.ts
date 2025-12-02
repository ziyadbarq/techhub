/**
 * Microsoft Graph Controller
 * Server actions for Microsoft Graph operations (user sync)
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer, loadHeavyModule, isModuleLoaded } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

/**
 * Ensures the Microsoft Graph module is loaded before accessing its services
 */
async function ensureMicrosoftGraphModuleLoaded(): Promise<void> {
  if (!isModuleLoaded("microsoft-graph")) {
    await loadHeavyModule("microsoft-graph");
  }
}
import type { SyncUsersFromGraphUseCase } from "@/core/use-cases/foundation/person";
import type { CreateOrganizationUnitUseCase } from "@/core/use-cases/foundation/organization-unit";
import { IMicrosoftGraphService } from "@/core/services/microsoft-graph.service.interface";
import type { IOrganizationUnitRepository } from "@/core/repositories/organization-unit.repository.interface";
import type { IRoleRepository } from "@/core/repositories/role-repository.interface";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import type { SyncResult } from "@/lib/schemas/graph-user.schema";
import { OrganizationUnitType } from "@/core/domain/value-objects/foundation-enums";
import { z } from "zod";

/**
 * Schema for sync options
 */
const SyncOptionsSchema = z.object({
  includeDisabled: z.boolean().optional().default(false),
  includeGuests: z.boolean().optional().default(false),
  defaultOrgUnitId: z.string().min(1, "Organization unit is required"),
  defaultPrimaryRoleId: z.string().min(1, "Primary role is required"),
  deactivateMissing: z.boolean().optional().default(true),
});

export type SyncOptionsDTO = z.infer<typeof SyncOptionsSchema>;

/**
 * Sync result presenter type
 */
export interface SyncResultDTO {
  created: number;
  updated: number;
  deactivated: number;
  /** Users auto-excluded due to missing department (service accounts) */
  excluded: number;
  errorCount: number;
  errors: Array<{
    azureAdId: string;
    email?: string;
    error: string;
  }>;
}

/**
 * Test Microsoft Graph connection
 *
 * Verifies that the Microsoft Graph credentials are configured correctly
 * and the application can authenticate.
 */
export async function testGraphConnectionAction(): Promise<
  ActionResponse<{ connected: boolean; message: string }>
> {
  try {
    await requirePermission(PERMISSIONS.PERSONS_SYNC);

    // Ensure Microsoft Graph module is loaded (HEAVY tier, lazy loaded)
    await ensureMicrosoftGraphModuleLoaded();

    const container = getContainer();
    const graphService = container.get<IMicrosoftGraphService>(
      IMicrosoftGraphService,
    );

    const isConnected = await graphService.testConnection();

    return {
      success: true,
      data: {
        connected: isConnected,
        message: isConnected
          ? "Successfully connected to Microsoft Graph"
          : "Failed to connect to Microsoft Graph. Check credentials.",
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "testGraphConnectionAction" },
      "Failed to test Microsoft Graph connection",
    );
  }
}

/**
 * Sync users from Microsoft Graph
 *
 * Synchronizes users from Microsoft Entra ID (Azure AD) to local Person records.
 * Uses azureAdId as the immutable source of truth for identity.
 */
export async function syncUsersFromGraphAction(
  options: SyncOptionsDTO,
): Promise<ActionResponse<SyncResultDTO>> {
  try {
    await requirePermission(PERMISSIONS.PERSONS_SYNC);

    // Ensure Microsoft Graph module is loaded (HEAVY tier, lazy loaded)
    await ensureMicrosoftGraphModuleLoaded();

    const validated = SyncOptionsSchema.parse(options);

    const container = getContainer();
    const useCase = container.get<SyncUsersFromGraphUseCase>(
      DI_TOKENS.SyncUsersFromGraphUseCase,
    );

    const result: SyncResult = await useCase.execute({
      includeDisabled: validated.includeDisabled,
      includeGuests: validated.includeGuests,
      defaultOrgUnitId: validated.defaultOrgUnitId,
      defaultPrimaryRoleId: validated.defaultPrimaryRoleId,
      deactivateMissing: validated.deactivateMissing,
    });

    revalidatePath("/persons");

    return {
      success: true,
      data: {
        created: result.created,
        updated: result.updated,
        deactivated: result.deactivated,
        excluded: result.excluded,
        errorCount: result.errors.length,
        errors: result.errors,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "syncUsersFromGraphAction" },
      "Failed to sync users from Microsoft Graph",
    );
  }
}

/**
 * Sync a single person from Microsoft Graph
 *
 * Refreshes a specific user using their Azure AD ID (person detail page)
 */
export async function syncPersonFromGraphAction(
  personId: string,
): Promise<ActionResponse<SyncResultDTO>> {
  try {
    await requirePermission(PERMISSIONS.PERSONS_SYNC);

    // Ensure Microsoft Graph module is loaded (HEAVY tier, lazy loaded)
    await ensureMicrosoftGraphModuleLoaded();

    if (!personId) {
      return {
        success: false,
        error: "Person ID is required",
      };
    }

    const container = getContainer();
    const personRepo = container.get<IPersonRepository>(
      DI_TOKENS.IPersonRepository,
    );
    const person = await personRepo.findById(personId);

    if (!person) {
      return { success: false, error: "Person not found" };
    }

    if (!person.azureAdId) {
      return {
        success: false,
        error: "Person is not linked to Microsoft Entra ID",
      };
    }

    const useCase = container.get<SyncUsersFromGraphUseCase>(
      DI_TOKENS.SyncUsersFromGraphUseCase,
    );

    const result: SyncResult = await useCase.execute({
      targetAzureIds: [person.azureAdId],
      includeDisabled: true,
      includeGuests: false,
      defaultOrgUnitId: person.orgUnitId,
      defaultPrimaryRoleId: person.primaryRoleId,
      deactivateMissing: false,
    });

    if (
      result.errors.length > 0 &&
      result.created === 0 &&
      result.updated === 0
    ) {
      return {
        success: false,
        error:
          result.errors[0]?.error ||
          "Failed to sync person from Microsoft Graph",
      };
    }

    revalidatePath("/persons");
    revalidatePath(`/persons/${personId}`);

    return {
      success: true,
      data: {
        created: result.created,
        updated: result.updated,
        deactivated: result.deactivated,
        excluded: result.excluded,
        errorCount: result.errors.length,
        errors: result.errors,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "syncPersonFromGraphAction" },
      "Failed to sync person from Microsoft Graph",
    );
  }
}

/**
 * Get Microsoft Graph sync status
 *
 * Returns information about the last sync and current configuration status.
 */
export async function getGraphSyncStatusAction(): Promise<
  ActionResponse<{
    isConfigured: boolean;
    configErrors: string[];
  }>
> {
  try {
    await requirePermission(PERMISSIONS.PERSONS_SYNC);

    // Ensure Microsoft Graph module is loaded (HEAVY tier, lazy loaded)
    await ensureMicrosoftGraphModuleLoaded();

    const configErrors: string[] = [];

    // Check required environment variables
    if (!process.env.AZURE_TENANT_ID) {
      configErrors.push("AZURE_TENANT_ID is not configured");
    }
    if (!process.env.AZURE_CLIENT_ID) {
      configErrors.push("AZURE_CLIENT_ID is not configured");
    }
    if (!process.env.AZURE_CLIENT_SECRET) {
      configErrors.push("AZURE_CLIENT_SECRET is not configured");
    }

    return {
      success: true,
      data: {
        isConfigured: configErrors.length === 0,
        configErrors,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getGraphSyncStatusAction" },
      "Failed to get Microsoft Graph sync status",
    );
  }
}

/**
 * Get default settings for person sync
 *
 * Returns the BARQ org unit and viewer role for new users.
 * Creates BARQ org unit if it doesn't exist.
 */
export async function getPersonSyncDefaultsAction(): Promise<
  ActionResponse<{ orgUnitId: string; roleId: string }>
> {
  try {
    await requirePermission(PERMISSIONS.PERSONS_SYNC);

    // Ensure Microsoft Graph module is loaded (HEAVY tier, lazy loaded)
    await ensureMicrosoftGraphModuleLoaded();

    const container = getContainer();
    const orgUnitRepo = container.get<IOrganizationUnitRepository>(
      DI_TOKENS.IOrganizationUnitRepository,
    );
    const roleRepo = container.get<IRoleRepository>(DI_TOKENS.IRoleRepository);
    const createOrgUnitUseCase = container.get<CreateOrganizationUnitUseCase>(
      DI_TOKENS.CreateOrganizationUnitUseCase,
    );

    // Find or create BARQ org unit (root company)
    let orgUnit = await orgUnitRepo.findByCode("BARQ");
    if (!orgUnit) {
      // Create BARQ org unit
      orgUnit = await createOrgUnitUseCase.execute({
        name: "Barq",
        code: "BARQ",
        unitType: OrganizationUnitType.COMPANY,
        description: "Root organization unit",
      });
    }

    // Find viewer role (minimal access)
    const role = await roleRepo.findByName("viewer");
    if (!role) {
      return {
        success: false,
        error:
          "Default role (viewer) not found. Please seed the database first.",
      };
    }

    return {
      success: true,
      data: { orgUnitId: orgUnit.id, roleId: role.id },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getPersonSyncDefaultsAction" },
      "Failed to get sync defaults",
    );
  }
}
