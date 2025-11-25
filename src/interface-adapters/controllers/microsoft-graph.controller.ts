/**
 * Microsoft Graph Controller
 * Server actions for Microsoft Graph operations (user sync)
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { SyncUsersFromGraphUseCase } from "@/core/use-cases/foundation/person";
import { IMicrosoftGraphService } from "@/core/services/microsoft-graph.service.interface";
import type { SyncResult } from "@/lib/schemas/graph-user.schema";
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
