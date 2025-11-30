/**
 * Database Backup Controller
 * Server actions for creating, listing, restoring, and deleting backups.
 */

"use server";

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  type CreateDatabaseBackupUseCase,
  type DeleteDatabaseBackupUseCase,
  type GetDatabaseBackupUseCase,
  type ListDatabaseBackupsUseCase,
  type RestoreDatabaseFromBackupUseCase,
  type CancelDatabaseBackupUseCase,
} from "@/core/use-cases/database-backup";
import { DatabaseBackupPresenter } from "@/interface-adapters/presenters/database-backup.presenter";
import type { DatabaseBackupDto } from "@/interface-adapters/dtos/database-backup.dto";
import {
  createBackupRequestSchema,
  type CreateBackupRequestDto,
} from "@/interface-adapters/dtos/database-backup.dto";
import { getCurrentUserId } from "@/lib/auth/session";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

/**
 * List all database backups
 */
export async function listDatabaseBackupsAction(): Promise<
  ActionResponse<DatabaseBackupDto[]>
> {
  try {
    await requirePermission(PERMISSIONS.DATABASE_BACKUP);

    const container = getContainer();
    const listBackups = container.get<ListDatabaseBackupsUseCase>(
      DI_TOKENS.ListDatabaseBackupsUseCase,
    );

    const backups = await listBackups.execute();
    return {
      success: true,
      data: DatabaseBackupPresenter.listToDto(backups),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listDatabaseBackupsAction" },
      "Failed to list database backups",
    );
  }
}

/**
 * Create a new database backup
 */
export async function createDatabaseBackupAction(
  payload: CreateBackupRequestDto,
): Promise<ActionResponse<DatabaseBackupDto>> {
  try {
    await requirePermission(PERMISSIONS.DATABASE_BACKUP);
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const parsed = createBackupRequestSchema.parse(payload);

    const container = getContainer();
    const createBackup = container.get<CreateDatabaseBackupUseCase>(
      DI_TOKENS.CreateDatabaseBackupUseCase,
    );

    const backup = await createBackup.execute({
      userId,
      notes: parsed.notes,
    });

    return {
      success: true,
      data: DatabaseBackupPresenter.toDto(backup),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createDatabaseBackupAction" },
      "Failed to create database backup",
    );
  }
}

/**
 * Restore database from a backup
 */
export async function restoreDatabaseFromBackupAction(
  backupId: string,
): Promise<ActionResponse<DatabaseBackupDto>> {
  try {
    await requirePermission(PERMISSIONS.DATABASE_RESTORE);
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const container = getContainer();
    const restoreBackup = container.get<RestoreDatabaseFromBackupUseCase>(
      DI_TOKENS.RestoreDatabaseFromBackupUseCase,
    );

    const backup = await restoreBackup.execute({
      backupId,
      userId,
    });

    return {
      success: true,
      data: DatabaseBackupPresenter.toDto(backup),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "restoreDatabaseFromBackupAction" },
      "Failed to start database restore",
    );
  }
}

/**
 * Delete a backup (soft delete + file removal)
 */
export async function deleteDatabaseBackupAction(
  backupId: string,
): Promise<ActionResponse<DatabaseBackupDto>> {
  try {
    await requirePermission(PERMISSIONS.DATABASE_BACKUP);
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const container = getContainer();
    const deleteBackup = container.get<DeleteDatabaseBackupUseCase>(
      DI_TOKENS.DeleteDatabaseBackupUseCase,
    );
    const backup = await deleteBackup.execute({
      backupId,
      deletedById: userId,
    });

    return {
      success: true,
      data: DatabaseBackupPresenter.toDto(backup),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteDatabaseBackupAction" },
      "Failed to delete backup",
    );
  }
}

/**
 * Cancel a pending or running backup
 */
export async function cancelDatabaseBackupAction(
  backupId: string,
): Promise<ActionResponse<DatabaseBackupDto>> {
  try {
    await requirePermission(PERMISSIONS.DATABASE_BACKUP);
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const container = getContainer();
    const cancelBackup = container.get<CancelDatabaseBackupUseCase>(
      DI_TOKENS.CancelDatabaseBackupUseCase,
    );
    const backup = await cancelBackup.execute({
      backupId,
      cancelledById: userId,
    });

    return {
      success: true,
      data: DatabaseBackupPresenter.toDto(backup),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "cancelDatabaseBackupAction" },
      "Failed to cancel backup",
    );
  }
}

/**
 * Get a single backup
 */
export async function getDatabaseBackupAction(
  backupId: string,
): Promise<ActionResponse<DatabaseBackupDto | null>> {
  try {
    await requirePermission(PERMISSIONS.DATABASE_BACKUP);
    const container = getContainer();
    const getBackup = container.get<GetDatabaseBackupUseCase>(
      DI_TOKENS.GetDatabaseBackupUseCase,
    );
    const backup = await getBackup.execute(backupId);

    return {
      success: true,
      data: backup ? DatabaseBackupPresenter.toDto(backup) : null,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getDatabaseBackupAction" },
      "Failed to get backup",
    );
  }
}
