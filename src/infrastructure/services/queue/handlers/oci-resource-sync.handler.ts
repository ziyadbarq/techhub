/**
 * OCI Cloud Resource Sync Handler
 *
 * Processes OCI resource sync jobs to synchronize cloud infrastructure
 * into CMDB Configuration Items.
 */

import type { Job } from "bullmq";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { IFeatureFlagRepository } from "@/core/repositories/feature-flag.repository.interface";
import type { SyncOciResourcesUseCase } from "@/core/use-cases/oci-sync";
import type { ILoggerService } from "@/core/services";
import type { OciSyncJobData } from "@/core/domain/jobs/job-data.types";
import type { OciServiceKey } from "@/core/domain/value-objects/oci-resource.types";

/**
 * Handles OCI cloud resource sync job.
 *
 * @param job - BullMQ job instance
 */
export async function handleOciResourceSync(
  job: Job<OciSyncJobData>,
): Promise<void> {
  const container = getContainer();
  const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);
  const featureFlagRepository = container.get<IFeatureFlagRepository>(
    DI_TOKENS.IFeatureFlagRepository,
  );

  const isEnabled = await featureFlagRepository.isFeatureEnabled("OCI_SYNC");
  if (!isEnabled) {
    logger.info(
      "Skipping OCI cloud resource sync because feature is disabled",
      {
        jobId: job.id,
      },
    );
    await job.updateProgress(100);
    return;
  }

  const syncUseCase = container.get<SyncOciResourcesUseCase>(
    DI_TOKENS.SyncOciResourcesUseCase,
  );

  logger.info("Starting OCI cloud resource sync", {
    jobId: job.id,
    triggeredBy: job.data.triggeredBy,
    serviceKeys: job.data.serviceKeys,
    dryRun: job.data.dryRun,
  });

  await job.updateProgress(10);

  try {
    const result = await syncUseCase.execute({
      serviceKeys: job.data.serviceKeys as OciServiceKey[] | undefined,
      dryRun: job.data.dryRun ?? false,
      triggeredBy: job.data.triggeredBy ?? "system",
    });

    await job.updateProgress(90);

    const summary = {
      resourcesProcessed: result.resourcesProcessed,
      resourcesCreated: result.resourcesCreated,
      resourcesUpdated: result.resourcesUpdated,
      resourcesUnchanged: result.resourcesUnchanged,
      resourcesRetired: result.resourcesRetired,
      compartmentsCreated: result.compartmentsCreated,
      relationshipsCreated: result.relationshipsCreated,
      errors: result.errors.length,
      durationMs: result.durationMs,
    };

    logger.info("OCI cloud resource sync completed", {
      jobId: job.id,
      summary,
    });

    if (result.errors.length > 0) {
      logger.warn("OCI resource sync completed with errors", {
        jobId: job.id,
        errorCount: result.errors.length,
        errors: result.errors.slice(0, 10).map((e) => ({
          serviceKey: e.serviceKey,
          resourceId: e.resourceId,
          error: e.error,
        })),
      });
    }

    await job.updateProgress(100);
  } catch (error) {
    logger.error(
      "OCI cloud resource sync failed",
      error instanceof Error ? error : new Error(String(error)),
      { jobId: job.id },
    );
    throw error; // Let BullMQ handle retries
  }
}
