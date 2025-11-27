/**
 * Microsoft Intune Device Sync Handler
 *
 * Processes device sync jobs to synchronize Intune managed devices.
 * Links devices to Assets by serial number and to Persons by Intune userId.
 */

import type { Job } from "bullmq";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { SyncDevicesFromIntuneUseCase } from "@/core/use-cases/intune";
import type { ILoggerService } from "@/core/services";
import type { IntuneSyncJobData } from "@/core/domain/jobs/job-data.types";

/**
 * Handles Microsoft Intune device sync job.
 *
 * Responsibilities:
 * - Fetch managed devices from Microsoft Graph Intune API
 * - Create/update IntuneDevice records based on intuneDeviceId
 * - Auto-link to Assets by serial number match
 * - Auto-link to Persons by Intune userId match
 * - Track compliance state changes in history table
 * - Optionally deactivate devices no longer in Intune
 * - Log sync summary with statistics
 *
 * @param job - BullMQ job instance
 */
export async function handleIntuneDeviceSync(
  job: Job<IntuneSyncJobData>,
): Promise<void> {
  // Get services from DI container
  const container = getContainer();
  const syncDevicesUseCase = container.get<SyncDevicesFromIntuneUseCase>(
    DI_TOKENS.SyncDevicesFromIntuneUseCase,
  );
  const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);

  logger.info("Starting Microsoft Intune device sync", {
    jobId: job.id,
    triggeredBy: job.data.triggeredBy,
    autoLinkToAssets: job.data.autoLinkToAssets,
    autoLinkToPersons: job.data.autoLinkToPersons,
    trackComplianceHistory: job.data.trackComplianceHistory,
    deactivateMissing: job.data.deactivateMissing,
    ownershipType: job.data.ownershipType,
    complianceState: job.data.complianceState,
    operatingSystem: job.data.operatingSystem,
    dryRun: job.data.dryRun,
  });

  await job.updateProgress(10);

  try {
    // Execute device sync
    const result = await syncDevicesUseCase.execute({
      autoLinkToAssets: job.data.autoLinkToAssets ?? true,
      autoLinkToPersons: job.data.autoLinkToPersons ?? true,
      trackComplianceHistory: job.data.trackComplianceHistory ?? true,
      deactivateMissing: job.data.deactivateMissing ?? true,
      ownershipType: job.data.ownershipType,
      complianceState: job.data.complianceState,
      operatingSystem: job.data.operatingSystem,
      dryRun: job.data.dryRun ?? false,
    });

    await job.updateProgress(90);

    // Log summary
    const summary = {
      created: result.created,
      updated: result.updated,
      deactivated: result.deactivated,
      linkedToAssets: result.linkedToAssets,
      linkedToPersons: result.linkedToPersons,
      complianceChanges: result.complianceChanges,
      errors: result.errors.length,
      durationMs: result.durationMs,
    };

    logger.info("Microsoft Intune device sync completed", {
      jobId: job.id,
      summary,
    });

    // Log errors if any
    if (result.errors.length > 0) {
      logger.warn("Intune device sync completed with errors", {
        jobId: job.id,
        errorCount: result.errors.length,
        errors: result.errors.slice(0, 10).map((e) => ({
          intuneDeviceId: e.intuneDeviceId,
          deviceName: e.deviceName,
          error: e.error,
        })),
      });
    }

    await job.updateProgress(100);

    logger.info("Microsoft Intune device sync job completed successfully", {
      jobId: job.id,
      created: result.created,
      updated: result.updated,
      deactivated: result.deactivated,
      linkedToAssets: result.linkedToAssets,
      linkedToPersons: result.linkedToPersons,
    });
  } catch (error) {
    logger.error(
      "Microsoft Intune device sync failed",
      error instanceof Error ? error : new Error(String(error)),
      {
        jobId: job.id,
      },
    );
    throw error; // Let BullMQ handle retries
  }
}
