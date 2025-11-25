/**
 * Microsoft Graph User Sync Handler
 *
 * Processes user sync jobs to synchronize users from Microsoft Entra ID (Azure AD).
 * Uses azureAdId as the immutable source of truth for user identity.
 */

import type { Job } from "bullmq";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { SyncUsersFromGraphUseCase } from "@/core/use-cases/foundation/person";
import type { ILoggerService } from "@/core/services";
import type { UserSyncFromGraphJobData } from "@/core/domain/jobs/job-data.types";

/**
 * Handles Microsoft Graph user sync job.
 *
 * Responsibilities:
 * - Fetch users from Microsoft Graph API
 * - Create/update Person records based on azureAdId
 * - Link manager relationships using azureAdId
 * - Optionally deactivate users no longer in Graph
 * - Log sync summary with statistics
 *
 * @param job - BullMQ job instance
 */
export async function handleUserSyncFromGraph(
  job: Job<UserSyncFromGraphJobData>,
): Promise<void> {
  // Get services from DI container
  const container = getContainer();
  const syncUsersUseCase = container.get<SyncUsersFromGraphUseCase>(
    DI_TOKENS.SyncUsersFromGraphUseCase,
  );
  const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);

  logger.info("Starting Microsoft Graph user sync", {
    jobId: job.id,
    triggeredBy: job.data.triggeredBy,
    includeDisabled: job.data.includeDisabled,
    includeGuests: job.data.includeGuests,
    deactivateMissing: job.data.deactivateMissing,
  });

  await job.updateProgress(10);

  try {
    // Execute user sync
    const result = await syncUsersUseCase.execute({
      includeDisabled: job.data.includeDisabled ?? false,
      includeGuests: job.data.includeGuests ?? false,
      defaultOrgUnitId: job.data.defaultOrgUnitId,
      defaultPrimaryRoleId: job.data.defaultPrimaryRoleId,
      deactivateMissing: job.data.deactivateMissing ?? true,
    });

    await job.updateProgress(90);

    // Log summary
    const summary = {
      created: result.created,
      updated: result.updated,
      deactivated: result.deactivated,
      errors: result.errors.length,
    };

    logger.info("Microsoft Graph user sync completed", {
      jobId: job.id,
      summary,
    });

    // Log errors if any
    if (result.errors.length > 0) {
      logger.warn("User sync completed with errors", {
        jobId: job.id,
        errorCount: result.errors.length,
        errors: result.errors.slice(0, 10).map((e) => ({
          azureAdId: e.azureAdId,
          email: e.email,
          error: e.error,
        })),
      });
    }

    await job.updateProgress(100);

    logger.info("Microsoft Graph user sync job completed successfully", {
      jobId: job.id,
      created: result.created,
      updated: result.updated,
      deactivated: result.deactivated,
    });
  } catch (error) {
    logger.error(
      "Microsoft Graph user sync failed",
      error instanceof Error ? error : new Error(String(error)),
      {
        jobId: job.id,
      },
    );
    throw error; // Let BullMQ handle retries
  }
}
