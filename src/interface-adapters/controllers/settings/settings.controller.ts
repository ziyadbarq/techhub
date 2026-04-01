/**
 * Settings Controller
 * Server actions for managing database-backed system settings
 */

"use server";

import { exec } from "node:child_process";
import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { getSession } from "@/lib/auth/session";

import type { ListSettingsUseCase } from "@/core/use-cases/settings/list-settings.use-case";
import type { UpdateSettingUseCase } from "@/core/use-cases/settings/update-setting.use-case";
import type { UpdateSettingsBulkUseCase } from "@/core/use-cases/settings/update-settings-bulk.use-case";

import {
  UpdateSettingRequestSchema,
  UpdateSettingsBulkRequestSchema,
} from "../../dtos/settings/settings.dto";
import type {
  ListSettingsResponseDTO,
  UpdateSettingRequestDTO,
  UpdateSettingsBulkRequestDTO,
  UpdateSettingsBulkResponseDTO,
} from "../../dtos/settings/settings.dto";
import { SettingsPresenter } from "../../presenters/settings/settings.presenter";
import type { ActionResponse } from "../types";

/**
 * List all settings with their resolved values
 */
export async function listSettingsAction(): Promise<
  ActionResponse<ListSettingsResponseDTO>
> {
  try {
    await requirePermission(PERMISSIONS.SETTINGS_MANAGE);

    const container = getContainer();
    const useCase = container.get<ListSettingsUseCase>(
      DI_TOKENS.ListSettingsUseCase,
    );

    const result = await useCase.execute();

    return {
      success: true,
      data: {
        settings: SettingsPresenter.toDTOList(result.settings),
        total: result.total,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list settings",
    };
  }
}

/**
 * Update a single setting
 */
export async function updateSettingAction(
  rawRequest: UpdateSettingRequestDTO,
): Promise<ActionResponse<{ key: string; updated: boolean }>> {
  try {
    await requirePermission(PERMISSIONS.SETTINGS_MANAGE);

    const request = UpdateSettingRequestSchema.parse(rawRequest);

    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "Authentication required" };
    }

    const container = getContainer();
    const useCase = container.get<UpdateSettingUseCase>(
      DI_TOKENS.UpdateSettingUseCase,
    );

    const result = await useCase.execute({
      key: request.key,
      value: request.value,
      userId: session.user.id,
      userEmail: session.user.email ?? "unknown",
    });

    revalidatePath("/admin/settings");

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update setting",
    };
  }
}

/**
 * Update multiple settings at once (for saving an entire tab)
 */
export async function updateSettingsBulkAction(
  rawRequest: UpdateSettingsBulkRequestDTO,
): Promise<ActionResponse<UpdateSettingsBulkResponseDTO>> {
  try {
    await requirePermission(PERMISSIONS.SETTINGS_MANAGE);

    const request = UpdateSettingsBulkRequestSchema.parse(rawRequest);

    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "Authentication required" };
    }

    const container = getContainer();
    const useCase = container.get<UpdateSettingsBulkUseCase>(
      DI_TOKENS.UpdateSettingsBulkUseCase,
    );

    const result = await useCase.execute({
      settings: request.settings,
      userId: session.user.id,
      userEmail: session.user.email ?? "unknown",
    });

    revalidatePath("/admin/settings");

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update settings",
    };
  }
}

/**
 * Restart the application via PM2 graceful reload.
 * Falls back to process.exit if PM2 is not available (K8s will auto-restart).
 */
export async function restartApplicationAction(): Promise<
  ActionResponse<{ method: string }>
> {
  try {
    await requirePermission(PERMISSIONS.SETTINGS_MANAGE);

    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "Authentication required" };
    }

    const method = await detectAndRestart();

    return { success: true, data: { method } };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to restart application",
    };
  }
}

function detectAndRestart(): Promise<string> {
  return new Promise((resolve, reject) => {
    // Try PM2 reload first (zero-downtime)
    exec("pm2 reload barq-web", { timeout: 10000 }, (error) => {
      if (!error) {
        resolve("pm2-reload");
        return;
      }

      // PM2 not available — exit process and let the orchestrator restart
      // (K8s, Docker, systemd, etc.)
      if (process.env.NODE_ENV === "production") {
        resolve("process-exit");
        // Delay exit so the response reaches the client
        setTimeout(() => process.exit(0), 500);
      } else {
        reject(
          new Error(
            "Restart not available in development. Stop and restart the dev server manually.",
          ),
        );
      }
    });
  });
}
